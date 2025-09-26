#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('Starting test runner with mochawesome...');

// Run mocha with mochawesome reporter
const mocha = spawn(
  path.join(__dirname, '..', 'node_modules', '.bin', 'mocha'),
  [
    path.join(__dirname, 'index.test.js'),
    '--no-config',
    '--timeout', '20000',
    '--require', '@babel/register',
    '--bail',
    '--reporter', 'mochawesome',
    '--reporter-option', `reportDir=${reportsDir}`,
    '--reporter-option', 'reportFilename=test-results',
    '--reporter-option', 'html=true',
    '--reporter-option', 'json=true',
    '--reporter-option', 'overwrite=true',
    '--reporter-option', 'charts=true'
  ],
  {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit'
  }
);

mocha.on('close', (code) => {
  console.log(`\nTests completed with exit code ${code}`);
  
  // Give mochawesome time to write files
  setTimeout(() => {
    console.log('\nChecking for generated reports...');
    
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
    
    // Exit with the same code as mocha
    process.exit(code);
  }, 2000);
});

mocha.on('error', (err) => {
  console.error('Failed to start test process:', err);
  process.exit(1);
});
