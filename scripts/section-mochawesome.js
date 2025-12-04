#!/usr/bin/env node
/*
  Usage:
    node scripts/section-mochawesome.js <merged.json> <out.json>

  Takes a mochawesome-merge output (merged.json) and rewrites it so that
  top-level suites are grouped into three sections:
    - "Unit tests" for non-Cypress suites
    - "End to end tests" for regular Cypress suites
    - "Non-regression tests" for Cypress non-reg suites (effectif-suite, activite-suite)

  The resulting JSON can be passed to mochawesome-report-generator to render
  a single HTML report with three clear sections.
*/

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const inPath = process.argv[2] || 'reports/combined/merged.json'
const outPath = process.argv[3] || 'reports/combined/sectioned.json'

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

// RFC4122 version 4 UUID generator
function uuidv4() {
  const bytes = crypto.randomBytes(16);
  // Per RFC 4122 section 4.4, set bits for version and `clock_seq_hi_and_reserved`
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4 (0b0100xxxx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1 (0b10xxxxxx)
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return (
    hex.slice(0, 8) + '-' +
    hex.slice(8, 12) + '-' +
    hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' +
    hex.slice(20)
  );
}

function isCySpecBaseName(name) {
  return /\.cy\.(js|ts)$/i.test(String(name || ''))
}

function isNonRegSuite(s) {
  if (!s || typeof s !== 'object') return false
  const f = String(s.file || s.fullFile || '')
  const basename = path.basename(f)
  // Check if it's a non-regression suite file
  if (basename === 'effectif-suite.cy.ts' || basename === 'activite-suite.cy.ts') return true
  // Check tests within the suite
  if (Array.isArray(s.tests)) {
    for (const t of s.tests) {
      const tf = String((t && t.file) || '')
      const tbase = path.basename(tf)
      if (tbase === 'effectif-suite.cy.ts' || tbase === 'activite-suite.cy.ts') return true
    }
  }
  // Check nested suites
  if (Array.isArray(s.suites)) {
    for (const sub of s.suites) {
      if (isNonRegSuite(sub)) return true
    }
  }
  return false
}

function suiteLooksE2E(s) {
  if (!s || typeof s !== 'object') return false
  const f = String(s.file || s.fullFile || '')
  if (
    f.includes('cypress/') ||
    f.includes('/e2e/') ||
    f.includes('cypress\\') ||
    isCySpecBaseName(path.basename(f))
  ) return true
  if (Array.isArray(s.tests)) {
    for (const t of s.tests) {
      const tf = String((t && t.file) || '')
      if (
        tf.includes('cypress/') ||
        tf.includes('/e2e/') ||
        tf.includes('cypress\\') ||
        isCySpecBaseName(path.basename(tf))
      ) return true
    }
  }
  if (Array.isArray(s.suites)) {
    for (const sub of s.suites) {
      if (suiteLooksE2E(sub)) return true
    }
  }
  return false
}

function isE2E(result) {
  const f = (result.fullFile || result.file || '').toString()
  if (f.includes('cypress/') || f.includes('/e2e/') || f.includes('cypress\\')) return true
  if (Array.isArray(result.suites)) {
    for (const s of result.suites) {
      if (suiteLooksE2E(s)) return true
    }
  }
  return false
}

function flattenTopSuites(resultsArr) {
  const suites = []
  for (const r of resultsArr) {
    if (Array.isArray(r.suites)) {
      for (const s of r.suites) suites.push(s)
    }
  }
  return suites
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function makeWrapperSuite(title, childSuites) {
  return {
    uuid: uuidv4(),
    title,
    fullFile: 'combined',
    file: 'combined',
    suites: clone(childSuites),
    tests: [],
    beforeHooks: [],
    afterHooks: [],
    pending: [],
    passes: [],
    failures: [],
    skipped: [],
    root: false,
    duration: 0,
    _timeout: 0,
  }
}

function buildSectioned(merged) {
  const allResults = Array.isArray(merged.results) ? merged.results : []
  const e2eResults = allResults.filter(isE2E)
  const unitResults = allResults.filter((r) => !isE2E(r))

  const allE2ESuites = flattenTopSuites(e2eResults)
  const unitSuites = flattenTopSuites(unitResults)

  // Separate non-reg suites from regular E2E suites
  const nonRegSuites = allE2ESuites.filter(isNonRegSuite)
  const regularE2ESuites = allE2ESuites.filter((s) => !isNonRegSuite(s))

  const suites = [
    makeWrapperSuite('End to end tests', regularE2ESuites),
    makeWrapperSuite('Non-regression tests', nonRegSuites),
    makeWrapperSuite('Unit tests', unitSuites),
  ]

  const masterResult = {
    uuid: uuidv4(),
    title: '',
    fullFile: 'combined',
    file: 'combined',
    beforeHooks: [],
    afterHooks: [],
    suites,
    tests: [],
    pending: [],
    passes: [],
    failures: [],
    skipped: [],
    duration: 0,
    root: true,
    _timeout: 0,
  }

  // Keep merged stats/meta as-is to preserve counts and metadata
  const out = {
    stats: merged.stats || {},
    results: [masterResult],
    meta: merged.meta || {},
  }

  return out
}

function main() {
  if (!fs.existsSync(inPath)) {
    console.error(`Input not found: ${inPath}`)
    process.exit(1)
  }

  const merged = readJson(inPath)
  const sectioned = buildSectioned(merged)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(sectioned, null, 2), 'utf8')
  console.log(`Sectioned report JSON written to: ${outPath}`)
}

main()
