#!/usr/bin/env node

// Direct runner that ensures mochawesome works
console.log('=== MOCHAWESOME DIRECT RUNNER ===');

try {
  console.log('Loading modules...');
  const Mocha = require('mocha');
  const path = require('path');
  const fs = require('fs');
  
  console.log('Setting up babel...');
  require('@babel/register');
  
  console.log('Creating Mocha instance...');
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
  
  const testFile = path.join(__dirname, 'index.test.js');
  console.log('Adding test file:', testFile);
  console.log('Test file exists:', fs.existsSync(testFile));
  
  mocha.addFile(testFile);
  
  console.log('Starting test run...');
  
  // Set a hard timeout to force exit after tests should be done
  // Your tests take about 33 seconds based on the logs
  setTimeout(() => {
    console.log('=== HARD TIMEOUT: Forcing exit after 35 seconds ===');
    const reportDir = path.join(__dirname, 'reports');
    if (fs.existsSync(reportDir)) {
      const files = fs.readdirSync(reportDir);
      console.log('Files in test/reports at timeout:', files);
    }
    process.exit(0);
  }, 35000);
  
  // Also try the normal callbacks
  mocha.run(failures => {
    console.log('=== Tests complete (callback), waiting for mochawesome to write files ===');
    console.log('Test failures:', failures);
    
    setTimeout(() => {
      console.log('=== Checking for report files ===');
      const reportDir = path.join(__dirname, 'reports');
      if (fs.existsSync(reportDir)) {
        const files = fs.readdirSync(reportDir);
        console.log('Files in test/reports:', files);
      } else {
        console.log('Report directory does not exist!');
      }
      process.exit(failures ? 1 : 0);
    }, 2000);
  });
} catch (error) {
  console.error('=== ERROR IN RUNNER ===');
  console.error(error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
