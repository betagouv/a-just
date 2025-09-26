#!/bin/bash
# Direct test to bypass any wrapper issues

echo "=== DIRECT MOCHA TEST ==="
echo "Working directory: $(pwd)"

# Run mocha directly with explicit reporter path
echo "Running: npx mocha --config .mocharc.yaml --reporter ./node_modules/mochawesome --reporter-option reportDir=./test/reports --reporter-option reportFilename=test-results --reporter-option quiet=false"

npx mocha --config .mocharc.yaml \
  --require ./test/_diagnostic.js \
  --reporter ./node_modules/mochawesome \
  --reporter-option reportDir=./test/reports \
  --reporter-option reportFilename=test-results \
  --reporter-option quiet=false

echo ""
echo "=== CHECKING RESULTS ==="
echo "Contents of test/reports:"
ls -la test/reports/ 2>/dev/null || echo "Directory not found"
