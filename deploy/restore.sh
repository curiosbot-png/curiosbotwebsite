#!/bin/sh
# Restore a backup set into the running stack.  Usage: deploy/restore.sh backups/20261001-020000
# DESTRUCTIVE for the target databases. Stop the web and n8n services first (docker compose stop web n8n).
set -eu
SET="${1:?usage: restore.sh <backup-directory>}"
[ -f "$SET/curiosbot.dump" ] || { echo "no curiosbot.dump in $SET"; exit 1; }
( cd "$SET" && sha256sum -c SHA256SUMS )
for DB in curiosbot n8n; do
  echo "Restoring $DB ..."
  docker compose exec -T postgres sh -c "dropdb -U postgres --if-exists $DB && createdb -U postgres -O \$([ $DB = n8n ] && echo n8n || echo curiosbot) $DB"
  docker compose exec -T postgres pg_restore -U postgres -d "$DB" --no-owner --role="$([ $DB = n8n ] && echo n8n || echo curiosbot)" < "$SET/$DB.dump"
done
echo "Done. Start services: docker compose up -d"
