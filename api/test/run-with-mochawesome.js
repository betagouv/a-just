#!/usr/bin/env node

// Direct runner that ensures mochawesome works
const Mocha = require('mocha');
const path = require('path');

console.log('=== MOCHAWESOME DIRECT RUNNER ===');

// Create mocha instance with mochawesome
const mocha = new Mocha({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: './test/reports',
    reportFilename: 'test-results',
    html: true,
    json: true,
    overwrite: true,
    charts: true,
    code: false,
    quiet: false
  },
  timeout: 20000,
  color: true,
  bail: true
});

// Add test file
mocha.addFile(path.join(__dirname, 'index.test.js'));

// Require babel
require('@babel/register');

// Run tests
mocha.run(failures => {
  console.log('=== Tests complete, waiting for mochawesome to write files ===');
  setTimeout(() => {
    console.log('=== Checking for report files ===');
    const fs = require('fs');
    const reportDir = path.join(__dirname, 'reports');
    if (fs.existsSync(reportDir)) {
      const files = fs.readdirSync(reportDir);
      console.log('Files in test/reports:', files);
    }
    process.exit(failures ? 1 : 0);
  }, 2000);
});
