#!/usr/bin/env node
/*
  Inject per-spec Cypress video links near suite headers in Mochawesome HTML.
  Usage: node scripts/inject-videos-into-mochawesome-html.js <htmlPath> <videosDir> <sectionedJsonPath>
  - htmlPath: path to the generated mochawesome HTML
  - videosDir: directory containing <spec>.mp4 files
  - sectionedJsonPath: merged/sectioned JSON used to generate the HTML
*/
const fs = require('fs');
const path = require('path');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readJSONSafe(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function listMp4(dir) {
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.mp4'))
      .map((f) => ({
        file: f,
        base: f.replace(/\.mp4$/i, ''),
      }));
  } catch {
    return [];
  }
}

// Traverse mochawesome JSON to map spec base name -> representative top-level suite title
function buildSpecToTitleMap(report) {
  const map = new Map(); // specBase -> title
  if (!report) return map;

  const results = Array.isArray(report.results) ? report.results : [];

  const extractSpecFromContext = (ctx) => {
    if (!ctx) return null;
    try {
      // ctx may be a JSON string like {"title":"cypress-mochawesome-reporter-videos-passed","value":"cypress/e2e/login.cy.js"}
      const parsed = typeof ctx === 'string' ? JSON.parse(ctx) : ctx;
      if (parsed && typeof parsed.value === 'string') return parsed.value;
    } catch {}
    // Fallback: regex search for cypress/e2e/*.cy.js
    if (typeof ctx === 'string') {
      const m = ctx.match(/cypress\/(?:e2e|integration)\/[\w-.]+\.cy\.js/);
      if (m) return m[0];
    }
    return null;
  };

  const visitSuite = (suite, titlePath) => {
    if (!suite || typeof suite !== 'object') return;
    const title = (suite.title || '').trim();
    const nextPath = title ? [...titlePath, title] : titlePath;

    const tests = Array.isArray(suite.tests) ? suite.tests : [];
    for (const t of tests) {
      let specPath = null;
      // Prefer context (reliable in Cypress JSON-only runs)
      if (t && t.context) specPath = extractSpecFromContext(t.context);
      // Fallback to file fields if present
      if (!specPath && t && t.file) specPath = t.file;
      if (!specPath && suite && suite.file) specPath = suite.file;

      if (!specPath) continue;
      const base = path.basename(specPath);
      if (!map.has(base) && nextPath.length > 0) {
        map.set(base, nextPath[0]);
      }
    }

    const subs = Array.isArray(suite.suites) ? suite.suites : [];
    for (const s of subs) visitSuite(s, nextPath);
  };

  for (const r of results) {
    const rootSuite = r && r.suites;
    if (rootSuite) visitSuite(rootSuite, []);
  }

  return map;
}

function injectLinkForTitle(html, title, href) {
  if (!title) return { html, changed: false };
  const safeTitle = escapeRegExp(title.trim());

  // Try heading tags h1..h6 containing the exact title
  const headingRe = new RegExp(`(<h[1-6][^>]*>\\s*)(${safeTitle})(\\s*</h[1-6]>)`);
  if (headingRe.test(html)) {
    const link = ` <span class="video-link" style="margin-left:8px;font-size:0.9em;"><a href="${href}" target="_blank">▶ Video</a></span>`;
    const newHtml = html.replace(headingRe, `$1$2${link}$3`);
    return { html: newHtml, changed: newHtml !== html };
  }

  // Try suite-title containers
  const suiteTitleRe = new RegExp(`(<[^>]*class=\\"[^\\"]*suite-title[^\\"]*\\"[^>]*>\\s*)(${safeTitle})(\\s*<\\/[^>]+>)`);
  if (suiteTitleRe.test(html)) {
    const link = ` <span class="video-link" style="margin-left:8px;font-size:0.9em;"><a href="${href}" target="_blank">▶ Video</a></span>`;
    const newHtml = html.replace(suiteTitleRe, `$1$2${link}$3`);
    return { html: newHtml, changed: newHtml !== html };
  }

  return { html, changed: false };
}

(function main() {
  const [htmlPath, videosDir, jsonPath] = process.argv.slice(2);
  if (!htmlPath || !videosDir) {
    console.error('Usage: node scripts/inject-videos-into-mochawesome-html.js <htmlPath> <videosDir> <sectionedJsonPath>');
    process.exit(0);
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML not found: ${htmlPath}`);
    process.exit(0);
  }

  const htmlOrig = fs.readFileSync(htmlPath, 'utf8');
  let html = htmlOrig;
  const report = jsonPath ? readJSONSafe(jsonPath) : null;
  const specToTitle = buildSpecToTitleMap(report);
  const videos = listMp4(videosDir);

  let injected = 0;
  for (const v of videos) {
    const specBase = v.base; // e.g., login.cy.js
    const title = specToTitle.get(specBase) || specToTitle.get(path.join('cypress', 'e2e', specBase)) || null;
    const href = `../videos/${v.file}`;

    // Avoid duplicate injection for same href
    if (html.includes(`href="${href}"`) && html.includes('class="video-link"')) continue;

    if (title) {
      const res = injectLinkForTitle(html, title, href);
      html = res.html;
      if (res.changed) {
        injected++;
        continue;
      }
    }
  }

  if (injected > 0 && html !== htmlOrig) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`Injected ${injected} video link(s) into HTML.`);
  } else {
    console.log('No video links injected.');
  }
})();
