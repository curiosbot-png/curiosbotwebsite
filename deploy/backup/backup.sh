#!/bin/sh
# Nightly backups: both PostgreSQL databases (custom format) + n8n data volume. Rotates after BACKUP_KEEP_DAYS.
set -eu
STAMP=$(date +%Y%m%d-%H%M%S)
DIR=/backups/$STAMP
mkdir -p "$DIR"
for DB in curiosbot n8n; do
  pg_dump -h postgres -U postgres -Fc "$DB" > "$DIR/$DB.dump"
done
tar -C /n8n_data -czf "$DIR/n8n_data.tgz" . 2>/dev/null || echo "n8n data archive skipped"
# Integrity check: each dump must list its table of contents
for DB in curiosbot n8n; do pg_restore -l "$DIR/$DB.dump" > /dev/null; done
( cd "$DIR" && sha256sum * > SHA256SUMS )
echo "backup ok: $DIR"
find /backups -mindepth 1 -maxdepth 1 -type d -mtime +"${BACKUP_KEEP_DAYS:-14}" -exec rm -rf {} +
