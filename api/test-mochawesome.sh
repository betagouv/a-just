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

echo "Method 1: Using npx mocha with mochawesome..."
npx mocha minimal.test.js --reporter mochawesome --reporter-option reportDir=./minimal-test-output,quiet=false 2>&1 | head -30

echo "Checking output directory 1..."
ls -la ./minimal-test-output/ 2>/dev/null || echo "No minimal-test-output directory created"

echo "Method 2: Using node_modules/.bin/mocha directly..."
./node_modules/.bin/mocha minimal.test.js --reporter mochawesome --reporter-option reportDir=./minimal-test-output2,quiet=false 2>&1 | head -30

echo "Checking output directory 2..."
ls -la ./minimal-test-output2/ 2>/dev/null || echo "No minimal-test-output2 directory created"

echo "Method 3: Using absolute path to mochawesome..."
./node_modules/.bin/mocha minimal.test.js --reporter $(pwd)/node_modules/mochawesome --reporter-option reportDir=./minimal-test-output3,quiet=false 2>&1 | head -30

echo "Checking output directory 3..."
ls -la ./minimal-test-output3/ 2>/dev/null || echo "No minimal-test-output3 directory created"

echo "Cleanup..."
rm -f minimal.test.js
