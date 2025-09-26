#!/bin/bash
# Minimal test to check if mochawesome works at all

echo "Creating minimal test file..."
cat > /tmp/minimal.test.js << 'EOF'
describe('Minimal Test', function() {
  it('should pass', function() {
    console.log('Test running');
  });
});
EOF

echo "Running mocha with mochawesome directly..."
cd /tmp
npx mocha minimal.test.js --reporter mochawesome --reporter-option reportDir=./test-output,quiet=false

echo "Checking output directory..."
ls -la ./test-output/ 2>/dev/null || echo "No test-output directory created"

echo "Trying with explicit path to mochawesome..."
npx mocha minimal.test.js --reporter ./node_modules/mochawesome --reporter-option reportDir=./test-output2,quiet=false

echo "Checking second output directory..."
ls -la ./test-output2/ 2>/dev/null || echo "No test-output2 directory created"
