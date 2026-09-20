#!/usr/bin/env sh
set -eu
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_FILE="${1:?Usage: scripts/restore.sh backups/daily/readiness-YYYYMMDD.sql.gz}"
gzip -dc "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "Restore completed from $BACKUP_FILE"
