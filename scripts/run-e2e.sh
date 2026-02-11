#!/usr/bin/env bash
set -euo pipefail

# Purpose: run the full Docker-based E2E suite with rich diagnostics and proper cleanup
#
# What it does:
# 1) Builds the E2E stack images with NODE_ENV=test
# 2) Runs Cypress in a named container (cypress-run)
# 3) Captures the Cypress exit code
# 4) If tests fail, prints docker-compose ps and logs from all relevant services
# 5) Always cleans up the transient Cypress container and tears down the stack
# 6) Exits with the original Cypress exit code

PROJECT_NAME="test-e2e"
COMPOSE_FILE="docker-compose-e2e.test.yml"

export NODE_ENV=test

# 1) Build images so we test the current sources
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

# 1.1) Obsolete: we no longer clone ajust -> ajust_sandbox in the same DB.
# api_sandbox now uses a dedicated db_sandbox service seeded at init.
# Keeping the stack simple avoids flaky failures in CI (exit 128 on DROP/CREATE).

# 2) Run Cypress via compose up so GA streams logs and we propagate Cypress exit code
set +e
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up --abort-on-container-exit --exit-code-from cypress cypress
exitcode=$?
set -e

# 3) On failure, print diagnostics to help debugging in CI
if [ $exitcode -ne 0 ]; then
  echo '=== docker compose ps ('$PROJECT_NAME') ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps || true

  echo '=== logs: cypress ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color cypress >> "./end-to-end/logs" || true

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
