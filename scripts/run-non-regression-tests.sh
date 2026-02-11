#!/usr/bin/env bash
set -euo pipefail

# Purpose: run the non-regression Docker-based E2E suite with rich diagnostics and proper cleanup

PROJECT_NAME="test-e2e-nr"
COMPOSE_FILE="docker-compose-e2e.test.yml"

export NODE_ENV=test

# Path to sandbox code (can be overridden via env var)
SANDBOX_CODE_DIR="${SANDBOX_CODE_DIR:-./sandbox-code}"

# 1) Build images
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

# 2) Start all services in background
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d db db_sandbox api api_sandbox redis redis_sandbox front front_sandbox  

# 3) Run Cypress with custom config
set +e
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" run --rm \
  -e CY_JSON_ONLY=1 \
  -e SANDBOX_CODE_DIR=/work/sandbox-code \
  -e CYPRESS_BASE_URL=http://175.0.0.30:4200 \
  -e NG_APP_SERVER_URL=http://175.0.0.20:8081/api \
  -v "$SANDBOX_CODE_DIR:/work/sandbox-code:ro" \
  cypress sh -lc '
    set -e
    cd /e2e
    npm ci
    echo "Waiting for PR front at http://175.0.0.30:4200 ..."
    npx -y wait-on -t 180000 -i 2000 "http://175.0.0.30:4200"
    echo "Waiting for PR API at http://175.0.0.20:8081/api ..."
    npx -y wait-on -t 180000 -i 2000 "http://175.0.0.20:8081/api"
    echo "Waiting for SANDBOX front at http://175.0.0.31:4200 ..."
    npx -y wait-on -t 180000 -i 2000 "http://175.0.0.31:4200"
    echo "Waiting for SANDBOX API at http://175.0.0.21:8081/api ..."
    npx -y wait-on -t 180000 -i 2000 "http://175.0.0.21:8081/api"
    rm -rf cypress/reports && mkdir -p cypress/reports
    npx cypress run --browser chrome --headless --spec "cypress/e2e/effectif-suite.cy.ts,cypress/e2e/activite-suite.cy.ts"
    echo "=== E2E Non-Regression reports ==="; ls -la cypress/reports || true
  '
exitcode=$?
set -e

# 3) On failure, print diagnostics to help debugging in CI
if [ $exitcode -ne 0 ]; then
  echo '=== docker compose ps ('$PROJECT_NAME') ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps || true

  echo '=== logs: cypress ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color cypress >> "./end-to-end/logs"  || true

  echo '=== logs: api_sandbox ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color api_sandbox >> "./end-to-end/logs" || true

  echo '=== logs: api ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color api >> "./end-to-end/logs" || true

  echo '=== logs: front_sandbox ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color front_sandbox >> "./end-to-end/logs" || true

  echo '=== logs: front ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color front >> "./end-to-end/logs" || true

  echo '=== logs: db ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color db >> "./end-to-end/logs" || true
fi

# 4) Cleanup: tear down the stack
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down

# 5) Propagate the test result
exit $exitcode