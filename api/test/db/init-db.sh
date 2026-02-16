#!/bin/bash
set -e

echo "Loading test database from test_tmp.sql.gz..."
gunzip -c /tmp/test_tmp.sql.gz | psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>&1 | grep -v "invalid command" | grep -v "unrecognized configuration parameter" || true
echo "Database initialization complete."
