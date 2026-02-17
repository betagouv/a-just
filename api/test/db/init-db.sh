#!/bin/bash
set -e

echo "Loading test database from test_tmp.sql.gz..."
gunzip -c /tmp/test_tmp.sql.gz | psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>&1 | grep -v "invalid command" | grep -v "unrecognized configuration parameter" || true

echo "Setting up E2E test infrastructure..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
    -- Un-delete E2E Test Backup (clear deleted_at so Sequelize paranoid mode doesn't filter it)
    UPDATE "HRBackups" SET deleted_at = NULL WHERE label = 'E2E Test Backup';

    -- Ensure TJ entry exists for E2E Test Backup (required for visibility)
    INSERT INTO "TJ" (i_elst, label, latitude, longitude, population, enabled, type, created_at, updated_at)
    SELECT 0, 'E2E Test Backup', 0, 0, 0, true, 'TGI', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "TJ" WHERE label = 'E2E Test Backup');

    -- Ensure test user has access to E2E Test Backup
    INSERT INTO "UserVentilations" (user_id, hr_backup_id)
    SELECT 961, b.id
    FROM "HRBackups" b
    WHERE b.label = 'E2E Test Backup'
    AND NOT EXISTS (
        SELECT 1 FROM "UserVentilations" 
        WHERE user_id = 961 AND hr_backup_id = b.id
    );
EOSQL

echo "Database initialization complete."
