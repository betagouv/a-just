#!/bin/bash
# Minimal test to check if mochawesome works at all

echo "=== Testing mochawesome from correct directory ==="
echo "Current directory: $(pwd)"
echo "Mochawesome path check:"
ls -la node_modules/mochawesome/src/mochawesome.js 2>/dev/null || echo "Mochawesome not found"

echo "Creating minimal test file in current directory..."
cat > minimal.test.js << 'EOF'
describe('Minimal Test', function() {
  it('should pass', function() {
    console.log('Test running');
  });
});
EOF

echo "Method 1: Bypassing ALL config and babel with --no-config..."
./node_modules/.bin/mocha minimal.test.js --no-config --reporter mochawesome --reporter-option reportDir=./minimal-test-output,quiet=false 2>&1 | head -50

echo "Checking output directory 1..."
ls -la ./minimal-test-output/ 2>/dev/null || echo "No minimal-test-output directory created"

echo "Method 2: Using spec reporter to verify mocha works..."
./node_modules/.bin/mocha minimal.test.js --no-config --reporter spec 2>&1 | head -10

echo "Method 3: Trying JSON reporter as alternative..."
./node_modules/.bin/mocha minimal.test.js --no-config --reporter json --reporter-option output=./test-output.json 2>&1 | head -20

echo "Checking JSON output..."
ls -la test-output.json 2>/dev/null || echo "No JSON file created"

echo "Method 4: Direct require of mochawesome..."
node -e "
const Mocha = require('mocha');
const mocha = new Mocha({ reporter: require('mochawesome') });
mocha.addFile('./minimal.test.js');
mocha.run();" 2>&1 | head -30

echo "Method 3: Using absolute path to mochawesome..."
./node_modules/.bin/mocha minimal.test.js --reporter $(pwd)/node_modules/mochawesome --reporter-option reportDir=./minimal-test-output3,quiet=false 2>&1 | head -30

echo "Checking output directory 3..."
ls -la ./minimal-test-output3/ 2>/dev/null || echo "No minimal-test-output3 directory created"

echo "Cleanup..."
rm -f minimal.test.js
