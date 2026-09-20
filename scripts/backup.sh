#!/usr/bin/env sh
set -eu
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"
STAMP="$(date +%Y%m%d-%H%M%S)"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/daily/readiness-$STAMP.sql.gz"
find "$BACKUP_DIR/daily" -type f -name '*.sql.gz' | sort | head -n -7 | xargs -r rm
if [ "$(date +%u)" = "7" ]; then
  cp "$BACKUP_DIR/daily/readiness-$STAMP.sql.gz" "$BACKUP_DIR/weekly/readiness-$STAMP.sql.gz"
  find "$BACKUP_DIR/weekly" -type f -name '*.sql.gz' | sort | head -n -4 | xargs -r rm
fi
echo "Backup written: $BACKUP_DIR/daily/readiness-$STAMP.sql.gz"
