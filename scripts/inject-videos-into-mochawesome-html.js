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

  // Always add a small runtime injector so links appear even though the report is a SPA rendered via React
  let appendedRuntime = false;
  if (videos.length && !html.includes('id="video-injector-inline"')) {
    const videoFiles = videos.map(v => v.file);
    const runtimeScript = `\n<script id="video-injector-inline">(function(){\n  var videoFiles = ${JSON.stringify(videoFiles)};\n  var videoMap = {};\n  videoFiles.forEach(function(fname){ var base = fname.replace(/\\.mp4$/i,''); videoMap[base] = '../videos/' + fname; });\n  function extractSpecFromContext(ctx){\n    try { var obj = typeof ctx === 'string' ? JSON.parse(ctx) : ctx; if (obj && obj.value) return obj.value; } catch(e){}\n    if (typeof ctx === 'string'){ var m = ctx.match(/[\\\\/\\\\\\\\\\w.-]+\\.cy\\.(js|ts)/i); if (m) return m[0]; }\n    return null;\n  }\n  function buildIndex(){\n    var idx = {};\n    var suites = [];\n    if (window.marge) {\n      if (Array.isArray(window.marge.filteredSuites) && window.marge.filteredSuites.length) {\n        suites = window.marge.filteredSuites.slice();\n      } else if (Array.isArray(window.marge.results)) {\n        window.marge.results.forEach(function(r){ if (r && r.suites) suites.push(r.suites); });\n      }\n    }\n    function visitSuite(s){\n      if (!s || typeof s !== 'object') return;\n      var base = null;\n      if (Array.isArray(s.tests)) {\n        for (var i=0;i<s.tests.length && !base;i++){\n          var t = s.tests[i];\n          var p = (t && (extractSpecFromContext(t.context) || t.file)) || s.file || null;\n          if (p){ var b = (p+'').split(/[\\\\/]/).pop(); if (b) base = b; }\n        }\n      }\n      if (!base && s.file){ base = (s.file+'').split(/[\\\\/]/).pop(); }\n      if (base){ (idx[base] = idx[base] || []).push(s.uuid); }\n      if (Array.isArray(s.suites)) { for (var j=0;j<s.suites.length;j++) visitSuite(s.suites[j]); }\n    }\n    suites.forEach(visitSuite);\n    return idx;\n  }\n  function appendLink(el, href){\n    if (!el || !href) return false;\n    if (el.querySelector('a.video-link-inline')) return false;\n    var span = document.createElement('span');\n    span.style.marginLeft = '8px';\n    span.style.fontSize = '0.95em';\n    var a = document.createElement('a');\n    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';\n    a.className = 'video-link-inline'; a.textContent = '▶ Video';\n    span.appendChild(a);\n    el.appendChild(span);\n    return true;\n  }\n  function cleanupCombinedFilenames(){\n    var nodes = document.querySelectorAll('h6[class*="filename"]');\n    var cleaned = false;\n    nodes.forEach(function(el){\n      var text = (el.textContent || '').trim().toLowerCase();\n      if (text === 'combined' || /(^|[\\/])combined(\\.[a-z0-9]+)?$/i.test(text)) {\n        el.remove();\n        cleaned = true;\n      }\n    });\n    return cleaned;\n  }\n  function fixScreenshotLinks(){\n    var container = document.getElementById('report') || document;\n    var nodes = container.querySelectorAll('div.context a.image-link, div.context img.image');\n    var changed = false;\n    nodes.forEach(function(el){\n      var isAnchor = el.tagName === 'A';\n      var attr = isAnchor ? 'href' : 'src';\n      var url = el.getAttribute(attr);\n      if (!url) return;\n      var u = url.trim();\n      if (/^(?:[a-z]+:)?\\/\\//i.test(u)) return; // absolute http(s), ftp\n      if (/^data:/i.test(u)) return; // base64 data\n      if (/^\\//.test(u)) return; // absolute root\n      var normalized = u.replace(/^\\.\\//,'');\n      // Already points to cypress/screenshots: ensure ../ prefix from combined/\n      if (/^(?:\\.\\.\\/)?cypress\\/screenshots\\//.test(normalized)) {\n        if (!/^\\.\\.\\//.test(normalized)) normalized = '../' + normalized;\n      } else if (/\\.(?:png|jpe?g|gif)$/i.test(normalized)) {\n        // Spec-folder style like simulator.cy.js/.. -> prefix screenshots base\n        normalized = '../cypress/screenshots/' + normalized;\n      } else {\n        return; // not an image path we rewrite\n      }\n      if (normalized !== u) {\n        el.setAttribute(attr, normalized);\n        changed = true;\n      }\n    });\n    return changed;\n  }\n  function ensureFailedOnlyStyle(){\n    if (document.getElementById('failed-only-style')) return;\n    var css = '#report[data-failed-only="1"] li.component.passed,'+\n              '#report[data-failed-only="1"] li.component.pending,'+\n              '#report[data-failed-only="1"] li.component.skipped{display:none!important;}';\n    var style = document.createElement('style');\n    style.id = 'failed-only-style';\n    style.type = 'text/css';\n    style.appendChild(document.createTextNode(css));\n    document.head.appendChild(style);\n  }\n  function enforceFailedOnlyFilter(){\n    try {\n      if (!window.marge) return false;\n      var failedOnly = window.marge.singleFilter === 'showFailed' ||\n        (!window.marge.showPassed && !window.marge.showPending && !window.marge.showSkipped && !!window.marge.showFailed);\n      var reportEl = document.getElementById('report');\n      if (!reportEl) return false;\n      ensureFailedOnlyStyle();\n      if (failedOnly) {\n        if (reportEl.getAttribute('data-failed-only') !== '1') {\n          reportEl.setAttribute('data-failed-only','1');\n          return true;\n        }\n      } else if (reportEl.getAttribute('data-failed-only') === '1') {\n        reportEl.removeAttribute('data-failed-only');\n        return true;\n      }\n    } catch(e){}\n    return false;\n  }\n  function injectOnce(){\n    var injected = false;\n    cleanupCombinedFilenames();\n    fixScreenshotLinks();\n    enforceFailedOnlyFilter();\n    if (window.marge){\n      var idx = buildIndex();\n      for (var base in idx){\n        if (!/\\.cy\\.(js|ts)$/i.test(base)) continue;\n        var href = videoMap[base];\n        if (!href) continue;\n        var uuids = idx[base] || [];\n        for (var k=0;k<uuids.length;k++){\n          var node = document.getElementById(uuids[k]);\n          if (!node) continue;\n          var target = node.querySelector('h6[class*="filename"]') || node.querySelector('h3[class*="title"]') || node.querySelector('h3');\n          if (appendLink(target, href)) injected = true;\n        }\n      }\n    } else {\n      var nodes = document.querySelectorAll('h6');\n      if (nodes && nodes.length) {\n        nodes.forEach(function(el){\n          var text = (el.textContent || '').trim();\n          var base = text.split(/[\\\\/]/).pop();\n          if (!/\\.cy\\.(js|ts)$/i.test(base)) return;\n          var href = videoMap[base];\n          if (appendLink(el, href)) injected = true;\n        });\n      }\n    }\n    return injected;\n  }\n  function start(){\n    var target = document.getElementById('report') || document.body;\n    if (!target){ setTimeout(start, 100); return; }\n    var tries = 0;\n    var tm = setInterval(function(){ if (injectOnce() || ++tries > 100) clearInterval(tm); }, 200);\n    var obs = new MutationObserver(function(){ injectOnce(); });\n    obs.observe(target, { childList: true, subtree: true });\n    document.addEventListener('visibilitychange', injectOnce, { once: false });\n  }\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();\n})();</script>\n`;
    // Prefer inserting before closing </body> to ensure execution
    const bodyCloseIdx = html.lastIndexOf('</body>');
    if (bodyCloseIdx !== -1) {
      html = html.slice(0, bodyCloseIdx) + runtimeScript + html.slice(bodyCloseIdx);
    } else {
      html += runtimeScript;
    }
    appendedRuntime = true;
  }

  if ((injected > 0 || appendedRuntime) && html !== htmlOrig) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`Injected ${injected} static link(s); runtime injector appended: ${appendedRuntime}.`);
  } else {
    console.log('No video links injected and no runtime injector appended.');
  }
})();
