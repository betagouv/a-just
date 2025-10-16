#!/usr/bin/env node
/*
  Usage:
    node scripts/section-mochawesome.js <merged.json> <out.json>

  Takes a mochawesome-merge output (merged.json) and rewrites it so that
  top-level suites are grouped into two sections:
    - "Unit tests" for non-Cypress suites
    - "End to end tests" for Cypress suites

  The resulting JSON can be passed to mochawesome-report-generator to render
  a single HTML report with two clear sections.
*/

const fs = require('fs')
const path = require('path')

const inPath = process.argv[2] || 'reports/combined/merged.json'
const outPath = process.argv[3] || 'reports/combined/sectioned.json'

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

// RFC4122 version 4 UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function isE2E(result) {
  const f = (result.fullFile || result.file || '').toString()
  return f.includes('cypress/') || f.includes('/e2e/') || f.includes('cypress\\')
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

  const e2eSuites = flattenTopSuites(e2eResults)
  const unitSuites = flattenTopSuites(unitResults)

  const masterResult = {
    uuid: uuidv4(),
    title: '',
    fullFile: 'combined',
    file: 'combined',
    beforeHooks: [],
    afterHooks: [],
    suites: [
      makeWrapperSuite('End to end tests', e2eSuites),
      makeWrapperSuite('Unit tests', unitSuites),
    ],
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
