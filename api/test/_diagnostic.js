const fs = require('fs');
const path = require('path');

console.log('\n=== MOCHA DIAGNOSTIC START ===');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Mocha CLI arguments:', process.argv.slice(2).join(' '));

// Check if mochawesome is resolvable
try {
  const mochawesomePath = require.resolve('mochawesome');
  console.log('✓ Mochawesome found at:', mochawesomePath);
  const mochawesomeVersion = require('mochawesome/package.json').version;
  console.log('✓ Mochawesome version:', mochawesomeVersion);
} catch (e) {
  console.error('✗ Mochawesome NOT found:', e.message);
}

// Check if mocha-multi-reporters is resolvable
try {
  const multiPath = require.resolve('mocha-multi-reporters');
  console.log('✓ Mocha-multi-reporters found at:', multiPath);
} catch (e) {
  console.error('✗ Mocha-multi-reporters NOT found:', e.message);
}

// Test write permissions to reports directory
const reportsDir = path.join(process.cwd(), 'test', 'reports');
const testFile = path.join(reportsDir, '_diagnostic_probe.txt');
try {
  // Ensure directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log('✓ Created test/reports directory');
  } else {
    console.log('✓ test/reports directory exists');
  }
  
  // Test write
  fs.writeFileSync(testFile, `Diagnostic probe written at ${new Date().toISOString()}\nPID: ${process.pid}`);
  console.log('✓ Successfully wrote probe file to:', testFile);
} catch (e) {
  console.error('✗ Cannot write to test/reports:', e.message);
}

console.log('=== MOCHA DIAGNOSTIC END ===\n');
