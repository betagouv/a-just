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

/**
 * Load test contexts from separate JSON files
 * @param {string} apiContextPath - Path to API test contexts JSON
 * @param {string} e2eContextPath - Path to E2E test contexts JSON (primary location)
 * @param {string} e2eContextPathAlt - Alternative path for E2E contexts
 * @returns {object} Merged contexts keyed by test fullTitle
 */
function loadTestContexts(apiContextPath, e2eContextPath, e2eContextPathAlt) {
  const contexts = {};
  
  // Helper to normalize keys to lowercase for case-insensitive lookup
  const normalizeContextKeys = (rawContexts) => {
    const normalized = {};
    for (const [key, value] of Object.entries(rawContexts)) {
      normalized[key.toLowerCase()] = value;
    }
    return normalized;
  };
  
  // Load API contexts
  if (apiContextPath && fs.existsSync(apiContextPath)) {
    try {
      const apiContexts = JSON.parse(fs.readFileSync(apiContextPath, 'utf8'));
      Object.assign(contexts, normalizeContextKeys(apiContexts));
      console.log(`Loaded ${Object.keys(apiContexts).length} API test contexts`);
    } catch (err) {
      console.warn('Failed to load API contexts:', err.message);
    }
  }
  
  // Load E2E contexts - try primary location first
  let e2eLoaded = false;
  if (e2eContextPath && fs.existsSync(e2eContextPath)) {
    try {
      const e2eContexts = JSON.parse(fs.readFileSync(e2eContextPath, 'utf8'));
      Object.assign(contexts, normalizeContextKeys(e2eContexts));
      console.log(`Loaded ${Object.keys(e2eContexts).length} E2E test contexts from ${e2eContextPath}`);
      e2eLoaded = true;
    } catch (err) {
      console.warn('Failed to load E2E contexts from primary path:', err.message);
    }
  }
  
  // Try alternative location if primary didn't work
  if (!e2eLoaded && e2eContextPathAlt && fs.existsSync(e2eContextPathAlt)) {
    try {
      const e2eContexts = JSON.parse(fs.readFileSync(e2eContextPathAlt, 'utf8'));
      Object.assign(contexts, normalizeContextKeys(e2eContexts));
      console.log(`Loaded ${Object.keys(e2eContexts).length} E2E test contexts from ${e2eContextPathAlt}`);
    } catch (err) {
      console.warn('Failed to load E2E contexts from alternative path:', err.message);
    }
  }
  
  return contexts;
}

/**
 * Get context for a test from the loaded contexts map
 * @param {object} test - Test object with fullTitle
 * @param {object} contextsMap - Map of test fullTitle to context
 * @param {array} suitePath - Array of suite titles leading to this test (for Cypress)
 * @returns {object|null} Context object or null
 */
function parseAJustContext(test, contextsMap, suitePath) {
  if (!test || !contextsMap) return null;
  
  // For Mocha/API tests, fullTitle is populated directly
  // For Cypress tests, we need to construct it from suitePath + test.title
  let fullTitle = test.fullTitle;
  if (!fullTitle && suitePath && suitePath.length > 0 && test.title) {
    fullTitle = [...suitePath, test.title].join(' ');
  }
  if (!fullTitle) {
    fullTitle = test.title || '';
  }
  if (!fullTitle) return null;
  
  // Normalize to lowercase for case-insensitive lookup
  const normalizedKey = fullTitle.toLowerCase();
  const context = contextsMap[normalizedKey];
  console.log(`DEBUG: Looking up context for "${fullTitle}" (normalized: "${normalizedKey}") - ${context ? 'FOUND' : 'NOT FOUND'}`);
  if (!context) {
    console.log(`  Test title: "${test.title}"`);
    console.log(`  Suite path: ${JSON.stringify(suitePath)}`);
    console.log(`  test.fullTitle: ${test.fullTitle || 'undefined'}`);
  }
  
  return context || null;
}

function renderAJustContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return '';
  const lines = [];
  
  // User
  if (ctx.user && typeof ctx.user === 'object') {
    const u = ctx.user;
    const parts = [];
    if (u.email) parts.push(esc(u.email));
    if (u.id) parts.push(`ID: ${esc(String(u.id))}`);
    if (u.role) parts.push(`Rôle: ${esc(u.role)}`);
    if (parts.length) lines.push(`<div class="ctx-user"><strong>Utilisateur:</strong> ${parts.join(' • ')}</div>`);
  }
  
  // Backup
  if (ctx.backup && typeof ctx.backup === 'object') {
    const b = ctx.backup;
    const parts = [];
    if (b.label) parts.push(esc(b.label));
    if (b.id) parts.push(`ID: ${esc(String(b.id))}`);
    if (parts.length) lines.push(`<div class="ctx-backup"><strong>Backup:</strong> ${parts.join(' • ')}</div>`);
  }
  
  // Rights
  if (ctx.rights && typeof ctx.rights === 'object') {
    const r = ctx.rights;
    const rightsParts = [];
    
    // Tools
    if (Array.isArray(r.tools) && r.tools.length) {
      const toolLines = r.tools.map(t => {
        const modes = [];
        if (t.canRead) modes.push('lecture');
        if (t.canWrite) modes.push('écriture');
        return `${esc(t.name || '')}: ${modes.join(' + ') || 'aucun'}`;
      });
      rightsParts.push(`<div class="ctx-tools"><strong>Outils:</strong><ul>${toolLines.map(l => `<li>${l}</li>`).join('')}</ul></div>`);
    }
    
    // Referentiels
    if (r.referentiels) {
      const refLabel = r.referentiels === 'all' || r.referentiels === null 
        ? 'tous les référentiels' 
        : Array.isArray(r.referentiels) 
          ? r.referentiels.join(', ') 
          : String(r.referentiels);
      rightsParts.push(`<div class="ctx-ref"><strong>Référentiels:</strong> ${esc(refLabel)}</div>`);
    }
    
    if (rightsParts.length) {
      lines.push(`<div class="ctx-rights">${rightsParts.join('')}</div>`);
    }
  }
  
  return lines.length ? `<div class="ajust-context">${lines.join('')}</div>` : '';
}

function isCySpecBase(b) {
  return /\.cy\.(js|ts)$/i.test(String(b || ''));
}

function extractSpecFromContext(ctx) {
  try {
    const parsed = typeof ctx === 'string' ? JSON.parse(ctx) : ctx;
    if (parsed && typeof parsed.value === 'string') return parsed.value;
  } catch {}
  if (typeof ctx === 'string') {
    const m = ctx.match(/[\\/](?:cypress[\\/](?:e2e|integration)[\\/])?[\w.-]+\.cy\.(?:js|ts)/i);
    if (m && m[0]) return m[0];
  }
  return null;
}

function specBaseFromSuiteDeep(s) {
  if (!s || typeof s !== 'object') return null;
  const here = path.basename(s.file || s.fullFile || '');
  if (isCySpecBase(here)) return here;
  if (Array.isArray(s.tests)) {
    for (const t of s.tests) {
      const tb = path.basename(t.file || '');
      if (isCySpecBase(tb)) return tb;
      const ctx = extractSpecFromContext(t && t.context);
      const tbc = ctx ? path.basename(ctx) : '';
      if (isCySpecBase(tbc)) return tbc;
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

function getTestsOfSuite(s) {
  if (!s || typeof s !== 'object') return [];
  if (Array.isArray(s.tests) && s.tests.length) return s.tests;
  // Fallback: some mochawesome JSONs keep only UUIDs in passes/failures/pending/skipped.
  // Convert them into minimal test-like objects with explicit state so counters work reliably.
  const arr = [];
  if (Array.isArray(s.passes)) arr.push(...s.passes.map(() => ({ title: '', fullTitle: '', state: 'passed' })));
  if (Array.isArray(s.failures)) arr.push(...s.failures.map(() => ({ title: '', fullTitle: '', state: 'failed' })));
  if (Array.isArray(s.pending)) arr.push(...s.pending.map(() => ({ title: '', fullTitle: '', state: 'pending' })));
  if (Array.isArray(s.skipped)) arr.push(...s.skipped.map(() => ({ title: '', fullTitle: '', state: 'skipped' })));
  return arr;
}

function collectTestsDeep(s, acc = []) {
  if (!s || typeof s !== 'object') return acc;
  const here = getTestsOfSuite(s);
  if (here.length) acc.push(...here);
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
  const [inJson, videosDir, screenshotsDir, outHtml, githubRunUrl] = process.argv.slice(2);
  if (!inJson || !videosDir || !screenshotsDir || !outHtml) {
    console.error('Usage: node scripts/build-static-report.js <sectionedJson> <videosDir> <screenshotsDir> <outHtml> [githubRunUrl]');
    process.exit(1);
  }
  const data = readJson(inJson);
  const outDir = path.dirname(path.resolve(outHtml));
  const videosDirAbs = path.resolve(videosDir);
  const screenshotsDirAbs = path.resolve(screenshotsDir);
  
  // Load test contexts from separate JSON files
  // In CI, these are in the artifact directories relative to the output HTML
  // outHtml is typically site/pr-X/run-Y/combined/a-just-tests-report.html
  // Context files are copied directly to mocha/ and cypress/ directories
  const runDir = path.dirname(outDir); // site/pr-X/run-Y
  const apiContextPath = path.join(runDir, 'mocha', 'test-contexts.json');
  const e2eContextPath = path.join(runDir, 'cypress', 'test-contexts.json');
  const e2eContextPathAlt = path.join(runDir, 'cypress', '.jsons', 'test-contexts.json');
  const testContexts = loadTestContexts(apiContextPath, e2eContextPath, e2eContextPathAlt);
  console.log(`Loaded ${Object.keys(testContexts).length} total test contexts`);
  console.log('DEBUG: All context keys:', JSON.stringify(Object.keys(testContexts), null, 2));

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
    const st = String(t.state || '').toLowerCase();
    if (st === 'passed' || st === 'pass') return 'passed';
    if (st === 'failed' || st === 'fail') return 'failed';
    if (t.pass === true || t.passed === true) return 'passed';
    if (t.fail === true || t.failed === true) return 'failed';
    if (t.pending === true) return 'pending';
    if (t.skipped === true || t.skip === true) return 'skipped';
    return '';
  }
  function aggregateCounts(gs) {
    const list = [];
    for (const g of gs) {
      const uniq = dedupeTopSuites(g.suites || [], g.isE2E);
      for (const s of uniq) collectTestsDeep(s, list);
    }
    let passed = 0, failed = 0, skipped = 0, pending = 0;
    for (const t of list) {
      const st = testStateOf(t);
      if (st === 'passed') passed++;
      else if (st === 'failed') failed++;
      else if (st === 'skipped') skipped++;
      else if (st === 'pending') pending++;
    }
    // Define total as all tests (including skipped/pending)
    return { total: list.length, passed, failed, skipped, pending };
  }
  const totals = aggregateCounts(groups);

  function countsOfSuiteOnly(s) {
    let passed = 0, failed = 0, skipped = 0, pending = 0, total = 0;
    if (Array.isArray(s.tests) && s.tests.length) {
      for (const t of s.tests) {
        if (!t || !(String((t.title || t.fullTitle || '')).trim().length > 0)) continue;
        const st = testStateOf(t);
        if (st === 'passed') passed++;
        else if (st === 'failed') failed++;
        else if (st === 'skipped') skipped++;
        else if (st === 'pending') pending++;
        total++;
      }
    } else {
      if (Array.isArray(s.passes)) { passed += s.passes.length; total += s.passes.length; }
      if (Array.isArray(s.failures)) { failed += s.failures.length; total += s.failures.length; }
      if (Array.isArray(s.pending)) { pending += s.pending.length; total += s.pending.length; }
      if (Array.isArray(s.skipped)) { skipped += s.skipped.length; total += s.skipped.length; }
    }
    return { total, passed, failed, skipped, pending };
  }

  function suiteCounts(s) {
    // Unified counting: collect all tests (real or fallback) and derive counts from their state.
    const all = collectTestsDeep(s, []);
    let passed = 0, failed = 0, skipped = 0, pending = 0;
    for (const t of all) {
      const st = testStateOf(t);
      if (st === 'passed') passed++;
      else if (st === 'failed') failed++;
      else if (st === 'skipped') skipped++;
      else if (st === 'pending') pending++;
    }
    return { total: all.length, passed, failed, skipped, pending };
  }

  const e2eId = e2eGroup ? `group-${slugId(e2eGroup.title)}` : '';
  const unitId = unitGroup ? `group-${slugId(unitGroup.title)}` : '';

  function renderSuiteRecursive(s, depth, g, specBase, groupId, pathTitles) {
    if (!s || typeof s !== 'object') return '';
    const tests = getTestsOfSuite(s)
      .filter((t) => String(t && (t.title || t.fullTitle) || '').trim().length > 0)
      .map((t) => ({
        title: t.title || '',
        fullTitle: t.fullTitle || '',
        state: testStateOf(t),
        err: t.err || {},
        ajustContext: t.ajustContext || null,
        context: t.context || null,
      }));
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
      const ctxHtml = isFail ? renderAJustContext(parseAJustContext(t, testContexts, thisPath)) : '';
      return `
        <li class="test ${t.state}">
          <div class="row"><span class="mark ${t.state}">${t.state==='passed'?'✓':t.state==='failed'?'✗':''}</span> <span class="t">${esc(t.title || t.fullTitle)}</span></div>
          ${isFail ? `<details><summary>Details</summary>${msg?`<pre class="msg">${esc(msg)}</pre>`:''}${stk?`<pre class="stk">${esc(stk)}</pre>`:''}${shotLinks?`<div class="shots">${shotLinks}</div>`:''}${ctxHtml}</details>`:''}
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
    const parts = [];
    if (c.passed) parts.push(`<span class="passed">${c.passed} ✅</span>`);
    if (c.failed) parts.push(`<span class="failed">${c.failed} ❌</span>`);
    if (c.skipped) parts.push(`<span class="skipped">${c.skipped} ⏭</span>`);
    if (c.pending) parts.push(`<span class="pending">${c.pending} ⏸</span>`);
    const cnt = parts.join(' / ');
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
      const c = suiteCounts(s);
      const parts = [];
      if (c.passed) parts.push(`<span class=\\"passed\\">${c.passed} ✅</span>`);
      if (c.failed) parts.push(`<span class=\\"failed\\">${c.failed} ❌</span>`);
      if (c.skipped) parts.push(`<span class=\\"skipped\\">${c.skipped} ⏭</span>`);
      if (c.pending) parts.push(`<span class=\\"pending\\">${c.pending} ⏸</span>`);
      const cnt = parts.join(' / ');
      const top = `<li><a href=\"#${topId}\">${esc(suiteTitle)}</a> <span class=\"cnt\">${cnt}</span>`
        + (Array.isArray(s.suites) && s.suites.length ? `<ul class="toc-subsuites">${s.suites.map((sub)=>renderTOCSuiteRecursive(sub, groupId, [suiteTitle])).join('')}</ul>` : '')
        + `</li>`;
      return top;
    }).join('');
    return `<li class="toc-group"><a href="#${groupId}">${esc(g.title)}</a><ul class="toc-suites">${suites}</ul></li>`;
  }

  const headerParts = [];
  if (totals.passed) headerParts.push(`<span class="passed">${totals.passed} ✅</span>`);
  if (totals.failed) headerParts.push(`<span class="failed">${totals.failed} ❌</span>`);
  if (totals.skipped) headerParts.push(`<span class="skipped">${totals.skipped} ⏭</span>`);
  if (totals.pending) headerParts.push(`<span class="pending">${totals.pending} ⏸</span>`);
  const headerCounts = headerParts.join(' / ');

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
  .mark.skipped{color:#666}
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
  .stats .skipped{color:#666}
  .stats .pending{color:#666}
  .hide-pass .test.passed{display:none}
  header .right{margin-left:auto;display:flex;gap:12px;align-items:center}
 .toc{position:fixed;left:0;top:64px;bottom:0;width:308px;overflow:auto;background:#fff;border-right:1px solid #eee;padding:8px 12px;z-index:10}
 .toc .toc-h{font-weight:600;margin:6px 0}
 .toc ul{list-style:none;padding:0;margin:0}
 .toc li{margin:6px 0;line-height:1.35}
  .toc a{text-decoration:none;color:#0d47a1}
  .toc .cnt{color:#555;font-size:12px;margin-left:6px}
  .toc .passed{color:#1a7f37}
  .toc .failed{color:#b91c1c}
  .toc .skipped{color:#666}
  .toc .toc-suites{margin-left:10px}
  .toc .toc-subsuites{margin-left:14px}
  .toc .toc-group{margin-top:16px;padding-top:12px;border-top:1px solid #f0f0f0}
  .toc .toc-group:first-child{margin-top:0;padding-top:0;border-top:none}
  .toc .toc-group > a{font-weight:600;font-size:14px;color:#0a3d7a}
 .content{margin-left:328px}
  h2, h3, h4, h5, .suite{scroll-margin-top:72px}
  @media (max-width: 900px){.toc{display:none}.content{margin-left:0}}
  .suite h3 .vid{font-size:13px;margin-left:8px;opacity:0.85;text-decoration:none}
  .suite h3 .vid:hover{text-decoration:underline;opacity:1}
  .ajust-context{margin-top:12px;padding:10px;background:#f9f9f9;border-left:3px solid #0d47a1;font-size:13px;line-height:1.5}
  .ajust-context strong{color:#0a3d7a}
  .ajust-context .ctx-user,.ajust-context .ctx-backup{margin-bottom:6px}
  .ajust-context .ctx-rights{margin-top:8px}
  .ajust-context .ctx-tools ul{list-style:none;padding-left:16px;margin:4px 0}
  .ajust-context .ctx-tools li{margin:2px 0}
  .ajust-context .ctx-ref{margin-top:6px}
</style>
<script>
 function toggleFailedOnly(cb){
  document.body.classList.toggle('hide-pass', cb.checked);
 }
</script>
 </head>
 <body>
 <header>
   <div>
     <h1>Global test report</h1>
     ${githubRunUrl ? `<div style="font-size:13px;color:#666;margin-top:4px"><a href="${esc(githubRunUrl)}" target="_blank" style="color:#0d47a1;text-decoration:none">🔗 View GitHub Actions run</a></div>` : ''}
   </div>
  <div class="right">
    <div class="stats"><span class="total">Total: ${totals.total}</span> (${headerCounts})</div>
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
