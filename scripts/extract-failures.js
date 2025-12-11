#!/usr/bin/env node
/*
  Usage:
    node scripts/extract-failures.js <sectioned.json>

  Extracts failed test information from a mochawesome sectioned report.
  Outputs a summary of failures in a format suitable for Mattermost notifications.
*/

const fs = require('fs')

const jsonPath = process.argv[2]
if (!jsonPath) {
  console.error('Usage: node extract-failures.js <sectioned.json>')
  process.exit(1)
}

function readJson(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Error reading JSON: ${err.message}`)
    process.exit(1)
  }
}

function extractFailures(suite, failures = []) {
  if (!suite) return failures

  // Check tests in this suite
  if (suite.tests && Array.isArray(suite.tests)) {
    suite.tests.forEach(test => {
      if (test.fail) {
        failures.push({
          title: test.title,
          fullTitle: test.fullTitle || test.title,
          suite: suite.title,
          err: test.err ? test.err.message : 'Unknown error'
        })
      }
    })
  }

  // Recursively check nested suites
  if (suite.suites && Array.isArray(suite.suites)) {
    suite.suites.forEach(s => extractFailures(s, failures))
  }

  return failures
}

const report = readJson(jsonPath)
const failures = []

// Extract from all top-level suites
if (report.results && Array.isArray(report.results)) {
  report.results.forEach(result => {
    if (result.suites && Array.isArray(result.suites)) {
      result.suites.forEach(suite => extractFailures(suite, failures))
    }
  })
}

// Output summary
if (failures.length === 0) {
  console.log('No failures found')
  process.exit(1) // Exit 1 when no failures (for workflow logic)
}

// Format for Mattermost (limit to first 10 to avoid message being too long)
const maxFailures = 10
const displayFailures = failures.slice(0, maxFailures)

console.log(`**${failures.length} test(s) failed:**`)
displayFailures.forEach((f, i) => {
  console.log(`${i + 1}. ${f.fullTitle}`)
})

if (failures.length > maxFailures) {
  console.log(`... and ${failures.length - maxFailures} more`)
}

// Exit 0 when failures found (for workflow logic)
process.exit(0)
