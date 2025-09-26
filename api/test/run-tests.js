#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Set NODE_ENV
process.env.NODE_ENV = 'test';

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('Starting test runner with mochawesome...');
console.log('Reports will be saved to:', reportsDir);

// Register babel
require('@babel/register');

// Use Mocha programmatically
const Mocha = require('mocha');

// Create mocha instance with mochawesome
const mocha = new Mocha({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: reportsDir,
    reportFilename: 'test-results',
    html: true,
    json: true,
    overwrite: true,
    charts: true,
    quiet: false
  },
  timeout: 20000,
  bail: true
});

// Add test file
const testFile = path.join(__dirname, 'index.test.js');
console.log('Adding test file:', testFile);
mocha.addFile(testFile);

// Run tests
console.log('Running tests...');
const runner = mocha.run((failures) => {
  console.log(`\nTests completed with ${failures} failures`);
  
  // Give mochawesome time to write files
  setTimeout(() => {
    console.log('\nChecking for generated reports...');
    
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      console.log('Files in reports directory:', files);
      
      if (files.includes('test-results.html')) {
        console.log('✓ HTML report generated successfully');
      } else {
        console.log('✗ HTML report not found');
      }
      
      if (files.includes('test-results.json')) {
        console.log('✓ JSON report generated successfully');
      } else {
        console.log('✗ JSON report not found');
      }
    } else {
      console.log('✗ Reports directory does not exist!');
    }
    
    // Exit with appropriate code
    process.exit(failures ? 1 : 0);
  }, 2000);
});

// Add event listeners for debugging
runner.on('start', () => {
  console.log('Test runner started');
});

runner.on('end', () => {
  console.log('Test runner ended');
});
