#!/usr/bin/env node
/*
  Build a minimal static HTML report from a Mochawesome sectioned JSON.

  Usage:
    node scripts/build-static-report.js <sectionedJson> <videosDir> <screenshotsDir> <outHtml>
*/

const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function walk(dir, pred, acc = []) {
  if (!dir || !fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, pred, acc);
    else if (!pred || pred(full)) acc.push(full);
  }
  return acc;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isCySpecBase(b) {
  return /\.cy\.(js|ts)$/i.test(String(b || ''));
}

function specBaseFromSuiteDeep(s) {
  if (!s || typeof s !== 'object') return null;
  const here = path.basename(s.file || s.fullFile || '');
  if (isCySpecBase(here)) return here;
  if (Array.isArray(s.tests)) {
    for (const t of s.tests) {
      const tb = path.basename(t.file || '');
      if (isCySpecBase(tb)) return tb;
    }
  }
  if (Array.isArray(s.suites)) {
    for (const sub of s.suites) {
      const b = specBaseFromSuiteDeep(sub);
      if (b) return b;
    }
  }
  return null;
}

function collectTestsDeep(s, acc = []) {
  if (!s || typeof s !== 'object') return acc;
  if (Array.isArray(s.tests)) acc.push(...s.tests);
  if (Array.isArray(s.suites)) s.suites.forEach((x) => collectTestsDeep(x, acc));
  return acc;
}

function suiteKeyForDedupe(s, isE2E) {
  const spec = specBaseFromSuiteDeep(s) || '';
  const fileId = String(s.file || s.fullFile || '');
  const title = s.title || spec || '';
  return isE2E ? `${spec}__${title}` : `${fileId}__${title}`;
}

function countTestsDeep(s) {
  return collectTestsDeep(s, []).length;
}

function dedupeTopSuites(list, isE2E) {
  const map = new Map();
  for (const s of (list || [])) {
    const k = suiteKeyForDedupe(s, isE2E);
    if (!map.has(k) || countTestsDeep(s) > countTestsDeep(map.get(k))) {
      map.set(k, s);
    }
  }
  return Array.from(map.values());
}

function toRelUrl(fromDir, absPath) {
  const rel = path.relative(fromDir, absPath).split(path.sep).join('/');
  return rel || '.';
}

function slugId(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function suiteIdFromPath(groupId, pathTitles) {
  const joined = (pathTitles || []).map(slugId).join('__');
  return `suite-${groupId}__${joined}`;
}

function main() {
  const [inJson, videosDir, screenshotsDir, outHtml] = process.argv.slice(2);
  if (!inJson || !videosDir || !screenshotsDir || !outHtml) {
    console.error('Usage: node scripts/build-static-report.js <sectionedJson> <videosDir> <screenshotsDir> <outHtml>');
    process.exit(1);
  }
  const data = readJson(inJson);
  const outDir = path.dirname(path.resolve(outHtml));
  const videosDirAbs = path.resolve(videosDir);
  const screenshotsDirAbs = path.resolve(screenshotsDir);

  // Build indices
  // Videos: map specBase (e.g., activity.cy.js) -> absolute .mp4 path (first match wins)
  const videoMap = new Map();
  for (const f of walk(videosDirAbs, (p) => /\.mp4$/i.test(p))) {
    const base = path.basename(f).replace(/\.mp4$/i, '');
    if (!videoMap.has(base)) videoMap.set(base, f);
  }
  const shotMap = new Map(); // specBase -> [abs pngs]
  for (const f of walk(screenshotsDirAbs, (p) => /\.(png|jpg|jpeg|gif)$/i.test(p))) {
    const parts = f.split(path.sep);
    let spec = null;
    for (const part of parts) { if (isCySpecBase(part)) { spec = part; break; } }
    if (!spec) continue;
    if (!shotMap.has(spec)) shotMap.set(spec, []);
    shotMap.get(spec).push(f);
  }

  function matchScreenshots(specBase, test) {
    const cands = shotMap.get(specBase) || [];
    if (!cands.length) return [];
    const tnorm = norm(test.fullTitle || test.title || '');
    if (!tnorm) return [];
    return cands.filter((abs) => norm(path.basename(abs)) .includes(tnorm));
  }

  const results = Array.isArray(data.results) ? data.results : [];
  const topSuites = results.length ? results[0].suites || [] : [];
  const groups = topSuites.map((g) => ({ title: g.title || '', suites: g.suites || [], isE2E: /end to end/i.test(g.title || '') }));

  const unitGroup = groups.find((g) => /unit/i.test(g.title));
  const e2eGroup = groups.find((g) => /end to end/i.test(g.title));

  function testStateOf(t) {
    return t.state || (t.pass ? 'passed' : t.fail ? 'failed' : '');
  }
  function aggregateCounts(gs) {
    const list = [];
    for (const g of gs) {
      const uniq = dedupeTopSuites(g.suites || [], g.isE2E);
      for (const s of uniq) collectTestsDeep(s, list);
    }
    let passed = 0, failed = 0;
    for (const t of list) {
      const st = testStateOf(t);
      if (st === 'passed') passed++; else if (st === 'failed') failed++;
    }
    return { total: list.length, passed, failed };
  }
  const totals = aggregateCounts(groups);

  function suiteCounts(s) {
    const tests = collectTestsDeep(s, []);
    let failed = 0;
    for (const t of tests) {
      const st = testStateOf(t);
      if (st === 'failed') failed++;
    }
    return { total: tests.length, failed };
  }

  const e2eId = e2eGroup ? `group-${slugId(e2eGroup.title)}` : '';
  const unitId = unitGroup ? `group-${slugId(unitGroup.title)}` : '';

  function renderSuiteRecursive(s, depth, g, specBase, groupId, pathTitles) {
    if (!s || typeof s !== 'object') return '';
    const tests = Array.isArray(s.tests) ? s.tests.map((t) => ({
      title: t.title || '',
      fullTitle: t.fullTitle || '',
      state: t.state || (t.pass ? 'passed' : t.fail ? 'failed' : ''),
      err: t.err || {},
    })) : [];
    const tag = depth === 0 ? 'h3' : (depth === 1 ? 'h4' : 'h5');
    const title = s.title || (depth === 0 ? (specBase || '') : '');
    let videoHref = '';
    if (depth === 0 && g.isE2E && isCySpecBase(specBase)) {
      const videoAbs = videoMap.get(specBase.replace(/\.mp4$/i, ''))
        || videoMap.get(specBase);
      if (videoAbs && fs.existsSync(videoAbs)) {
        videoHref = toRelUrl(outDir, videoAbs);
      }
    }
    const basePath = (pathTitles || []);
    const thisPath = (depth === 0) ? basePath : (title ? [...basePath, title] : basePath);
    const thisId = (depth >= 1 && title) ? suiteIdFromPath(groupId, thisPath) : '';
    const testsHtml = tests.map((t) => {
      const isFail = t.state === 'failed';
      const shots = isFail && isCySpecBase(specBase) ? matchScreenshots(specBase, t) : [];
      const shotLinks = shots.map((abs, i) => `<a href="${toRelUrl(outDir, abs)}" target="_blank">Screenshot ${i+1}</a>`).join(' ');
      const msg = t.err && (t.err.message || t.err.code) ? (t.err.message || t.err.code) : '';
      const stk = t.err && t.err.stack ? String(t.err.stack) : '';
      return `
        <li class="test ${t.state}">
          <div class="row"><span class="mark ${t.state}">${t.state==='passed'?'✓':t.state==='failed'?'✗':''}</span> <span class="t">${esc(t.title || t.fullTitle)}</span></div>
          ${isFail ? `<details><summary>Details</summary>${msg?`<pre class="msg">${esc(msg)}</pre>`:''}${stk?`<pre class="stk">${esc(stk)}</pre>`:''}${shotLinks?`<div class="shots">${shotLinks}</div>`:''}</details>`:''}
        </li>`;
    }).join('\n');
    const kidsHtml = Array.isArray(s.suites) ? s.suites.map((sub) => renderSuiteRecursive(sub, depth+1, g, specBase, groupId, thisPath)).join('\n') : '';
    const header = title ? `<${tag} ${thisId?`id="${thisId}"`:''}>${esc(title)}${videoHref?` <a class="vid" href="${videoHref}" target="_blank">▶ Video</a>`:''}</${tag}>` : '';
    return `
      <div class="subsuite depth-${depth}">
        ${header}
        ${testsHtml?`<ul class="tests">${testsHtml}</ul>`:''}
        ${kidsHtml}
      </div>`;
  }

  function renderGroup(g, groupId) {
    if (!g) return '';
    const uniqSuites = dedupeTopSuites(g.suites || [], g.isE2E);
    const suitesHtml = uniqSuites.map((s) => {
      const specBase = specBaseFromSuiteDeep(s);
      const suiteTitle = s.title || specBase || '';
      const suiteId = `suite-${groupId}__${slugId(suiteTitle)}`;
      const failed = collectTestsDeep(s).filter((t) => testStateOf(t) === 'failed').length;
      return `
        <section id="${suiteId}" class="suite ${failed? 'has-fail': ''}">
          ${renderSuiteRecursive(s, 0, g, specBase, groupId, [suiteTitle])}
        </section>`;
    }).join('\n');
    return `
      <div class="group">
        <h2 id="${groupId}">${esc(g.title)}</h2>
        ${suitesHtml || '<p class="empty">No tests.</p>'}
      </div>`;
  }

  function renderTOCSuiteRecursive(s, groupId, pathTitles) {
    const specBase = specBaseFromSuiteDeep(s);
    const suiteTitle = s.title || specBase || '';
    const id = suiteIdFromPath(groupId, [...(pathTitles||[]), suiteTitle]);
    const c = suiteCounts(s);
    const passed = c.total - c.failed;
    const cnt = c.failed === 0
      ? `<span class="passed">${c.total} ✅</span>`
      : `<span class="passed">${passed} ✅</span> / <span class="failed">${c.failed} ❌</span>`;
    const kids = Array.isArray(s.suites) && s.suites.length
      ? `<ul class="toc-subsuites">${s.suites.map((sub)=>renderTOCSuiteRecursive(sub, groupId, [...(pathTitles||[]), suiteTitle])).join('')}</ul>`
      : '';
    return `<li><a href="#${id}">${esc(suiteTitle)}</a> <span class="cnt">${cnt}</span>${kids}</li>`;
  }

  function renderTOC(g, groupId) {
    if (!g) return '';
    const uniq = dedupeTopSuites(g.suites || [], /end to end/i.test(g.title || ''));
    const suites = uniq.map((s) => {
      const suiteTitle = s.title || specBaseFromSuiteDeep(s) || '';
      const topId = suiteIdFromPath(groupId, [suiteTitle]);
      // Ensure top-level id matches the <section id>
      const top = `<li><a href="#${topId}">${esc(suiteTitle)}</a> <span class="cnt">${(()=>{const c = suiteCounts(s); const p=c.total-c.failed; return c.failed===0?`<span class=\"passed\">${c.total} ✅</span>`:`<span class=\"passed\">${p} ✅</span> / <span class=\"failed\">${c.failed} ❌</span>`})()}</span>`
        + (Array.isArray(s.suites) && s.suites.length ? `<ul class="toc-subsuites">${s.suites.map((sub)=>renderTOCSuiteRecursive(sub, groupId, [suiteTitle])).join('')}</ul>` : '')
        + `</li>`;
      return top;
    }).join('');
    return `<li class="toc-group"><a href="#${groupId}">${esc(g.title)}</a><ul class="toc-suites">${suites}</ul></li>`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Global test report</title>
<style>
 body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:16px;color:#222}
  header{position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #eee;z-index:20;display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between}
  h1{margin:0 0 8px;font-size:20px}
  h2{margin:16px 0 8px;font-size:18px}
  h3{margin:10px 0 6px;font-size:15px}
  h4{margin:8px 0 4px;font-size:14px;color:#333}
  h5{margin:6px 0 4px;font-size:13px;color:#444}
  .group{border-top:1px solid #eee;padding-top:8px}
  .suite{border:1px solid #eee;border-radius:6px;background:#fafafa;padding:8px;margin:8px 0}
  .subsuite.depth-1{padding-left:8px;border-left:2px solid #f1f1f1;margin-left:6px}
  .subsuite.depth-2{padding-left:8px;border-left:2px dashed #f1f1f1;margin-left:12px}
  .suite.has-fail{border-color:#f7c4c4;background:#fff7f7}
  .right{display:flex;align-items:center;gap:12px}
  .stats{font-size:14px}
  .filters{font-size:14px;margin-left:12px}
  .tests{list-style:none;padding:0;margin:0}
  .test{padding:6px 0}
  .tests .test + .test{border-top:1px solid #e6e6e6;margin-top:6px;padding-top:6px}
  .row{display:flex;gap:8px;align-items:center}
  .mark{display:inline-block;width:18px;text-align:center}
  .mark.passed{color:#1a7f37}
  .mark.failed{color:#b91c1c}
  details{margin:6px 0}
  .test details{margin:6px 0 6px 34px;padding-left:8px;border-left:2px solid #eee;color:#555;font-size:13px}
  .test details summary{color:#666;font-size:13px}
  .test details .msg, .test details .stk{color:#444;font-size:12.5px}
  .test details .shots{font-size:12.5px}
  .test details .shots a{opacity:0.85}
  .shots a{margin-right:8px}
  .filters{font-size:14px}
  .stats{font-size:14px;display:flex;gap:12px;align-items:center}
  .stats .passed{color:#1a7f37}
  .stats .failed{color:#b91c1c}
  .hide-pass .test.passed{display:none}
  header .right{margin-left:auto;display:flex;gap:12px;align-items:center}
 .toc{position:fixed;left:0;top:64px;bottom:0;width:280px;overflow:auto;background:#fff;border-right:1px solid #eee;padding:8px 12px;z-index:10}
 .toc .toc-h{font-weight:600;margin:6px 0}
 .toc ul{list-style:none;padding:0;margin:0}
 .toc li{margin:4px 0}
  .toc a{text-decoration:none;color:#0d47a1}
  .toc .cnt{color:#555;font-size:12px;margin-left:6px}
  .toc .passed{color:#1a7f37}
  .toc .failed{color:#b91c1c}
  .toc .toc-suites{margin-left:10px}
  .toc .toc-subsuites{margin-left:14px}
 .content{margin-left:300px}
  h2, h3, h4, h5, .suite{scroll-margin-top:72px}
  @media (max-width: 900px){.toc{display:none}.content{margin-left:0}}
  .suite h3 .vid{font-size:13px;margin-left:8px;opacity:0.85;text-decoration:none}
  .suite h3 .vid:hover{text-decoration:underline;opacity:1}
</style>
<script>
 function toggleFailedOnly(cb){
  document.body.classList.toggle('hide-pass', cb.checked);
 }
</script>
 </head>
 <body>
 <header>
   <h1>Global test report</h1>
   <div class="right">
     <div class="stats"><span class="total">Total: ${totals.total}</span> (<span class="passed">${totals.passed} ✅</span>&nbsp;&nbsp;/&nbsp;&nbsp;<span class="failed">${totals.failed} ❌</span>)</div>
     <label class="filters"><input type="checkbox" onchange="toggleFailedOnly(this)"> Failed only</label>
   </div>
 </header>
 <nav class="toc">
   <div class="toc-h">Contents</div>
   <ul class="toc-groups">
     ${renderTOC(e2eGroup, e2eId)}
     ${renderTOC(unitGroup, unitId)}
   </ul>
 </nav>
 <main class="content">
 ${renderGroup(e2eGroup, e2eId)}
 ${renderGroup(unitGroup, unitId)}
 </main>
 </body>
</html>`;

  fs.mkdirSync(path.dirname(outHtml), { recursive: true });
  fs.writeFileSync(outHtml, html, 'utf8');
  console.log(`Static report written to: ${outHtml}`);
}

main();
