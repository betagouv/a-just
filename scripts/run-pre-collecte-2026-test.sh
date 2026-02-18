#!/usr/bin/env bash
set -euo pipefail

# Purpose: Run extracteur-pre-collecte-2026 test against frozen sandbox reference
# This generates a baseline Excel file from the sandbox code at a specific commit

PROJECT_NAME="test-e2e"
COMPOSE_FILE="docker-compose-e2e.test.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export NODE_ENV=test

# Path to sandbox reference code (can be overridden via env var)
SANDBOX_CODE_DIR="${SANDBOX_CODE_DIR:-$REPO_DIR/../a-just-sandbox-reference}"

echo "=== Extracteur Pre-Collecte 2026 Test ==="
echo "Sandbox reference: $SANDBOX_CODE_DIR"

# Check if sandbox reference exists
if [ ! -d "$SANDBOX_CODE_DIR/.git" ]; then
  echo "❌ Sandbox reference directory not found: $SANDBOX_CODE_DIR"
  echo ""
  echo "Please run: ./scripts/setup-sandbox-reference.sh"
  exit 1
fi

# Show sandbox reference info
if [ -f "$SANDBOX_CODE_DIR/.sandbox-reference-marker" ]; then
  FROZEN_SHA=$(cat "$SANDBOX_CODE_DIR/.sandbox-reference-marker")
  echo "Frozen at commit: $FROZEN_SHA"
else
  echo "⚠️  Warning: No .sandbox-reference-marker file found"
fi

echo ""
echo "Building Docker images..."

# 1) Build images with sandbox reference
SANDBOX_CODE_DIR="$SANDBOX_CODE_DIR" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

echo ""
echo "Starting services..."

# 2) Start all services and wait for them to be healthy
SANDBOX_CODE_DIR="$SANDBOX_CODE_DIR" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

echo "Waiting for services to be healthy (this may take 1-2 minutes)..."
echo "Waiting for sandbox frontend to be ready..."

# Wait for sandbox frontend to be healthy (max 3 minutes)
for i in {1..36}; do
  if docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps front_sandbox | grep -q "healthy"; then
    echo "✓ Sandbox frontend is healthy"
    break
  fi
  if [ $i -eq 36 ]; then
    echo "❌ Timeout waiting for sandbox frontend to be healthy"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --tail=50 front_sandbox
    exit 1
  fi
  echo "  Still waiting... ($i/36)"
  sleep 5
done

echo ""
echo "Running test..."

# 3) Run the specific test
set +e
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" run --rm \
  -e CY_JSON_ONLY=1 \
  -e SANDBOX_CODE_DIR="$SANDBOX_CODE_DIR" \
  -e CYPRESS_BASE_URL=http://175.0.0.31:4200 \
  -e CYPRESS_SANDBOX_FRONT_URL=http://175.0.0.31:4200 \
  cypress sh -c "npm ci && npx cypress run --spec 'cypress/e2e/extracteur-pre-collecte-2026.cy.ts'"
exitcode=$?
set -e

# 3) On failure, print diagnostics
if [ $exitcode -ne 0 ]; then
  echo '=== docker compose ps ('$PROJECT_NAME') ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps || true

  echo '=== logs: api_sandbox ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color --tail=100 api_sandbox || true
fi

# 4) Cleanup
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down

# 5) Show result
if [ $exitcode -eq 0 ]; then
  echo ""
  echo "✅ Test passed!"
  echo "Baseline file should be in: end-to-end/cypress/downloads/"
  ls -lh end-to-end/cypress/downloads/Extraction_PRE_COLLECTE_2026_* 2>/dev/null || true
else
  echo ""
  echo "❌ Test failed with exit code: $exitcode"
fi

exit $exitcode
