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

# 1.1) Ensure DB is up, then clone sandbox DB from seeded DB to avoid migration collisions
echo "[e2e] Preparing databases (ajust -> ajust_sandbox)"
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d db
echo "[e2e] Waiting for Postgres to accept connections..."
ATTEMPTS=0
until docker exec "$PROJECT_NAME-db-1" pg_isready -U ajust-user -d ajust >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -gt 60 ]; then echo "[e2e] Postgres not ready after 60s"; exit 1; fi
  sleep 1
done
echo "[e2e] DB is ready; cloning ajust_sandbox from ajust"
docker exec -i "$PROJECT_NAME-db-1" psql -U ajust-user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('ajust','ajust_sandbox') AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
docker exec -i "$PROJECT_NAME-db-1" psql -U ajust-user -d postgres -c "DROP DATABASE IF EXISTS ajust_sandbox;" >/dev/null
docker exec -i "$PROJECT_NAME-db-1" psql -U ajust-user -d postgres -c "CREATE DATABASE ajust_sandbox TEMPLATE ajust;" >/dev/null

# 2) Run Cypress in a named container so we can fetch logs by name later
set +e
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" run --name cypress-run cypress
exitcode=$?
set -e

# 3) On failure, print diagnostics to help debugging in CI
if [ $exitcode -ne 0 ]; then
  echo '=== docker compose ps ('$PROJECT_NAME') ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps || true

  echo '=== logs: cypress ==='
  docker logs cypress-run || true

  echo '=== logs: api_sandbox ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color api_sandbox || true

  echo '=== logs: api ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color api || true

  echo '=== logs: front_sandbox ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color front_sandbox || true

  echo '=== logs: front ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color front || true

  echo '=== logs: db ==='
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --no-color db || true
fi

# 4) Cleanup: remove the transient cypress container and tear down the stack
docker rm -f cypress-run || true
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down

# 5) Propagate the test result
exit $exitcode
