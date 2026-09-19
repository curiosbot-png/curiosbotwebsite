# Backup & restore
- `backup` service runs `deploy/backup/backup.sh` nightly: `pg_dump -Fc` for `curiosbot` and `n8n`, tar of the n8n volume, integrity check (`pg_restore -l`), SHA256SUMS, rotation (`BACKUP_KEEP_DAYS`, default 14). Backups land in `./backups` on the VPS (bind mount).
- **Off-site copy is required** (a VPS disk failure loses both): e.g. `rclone`/`rsync` `/opt/curiosbot/backups` nightly to storage you control. Also keep `.env` and `N8N_ENCRYPTION_KEY` in a password manager.
- Restore: `docker compose stop web n8n && bash deploy/restore.sh backups/<timestamp>` (verifies checksums, then DROPS and recreates both databases), then `docker compose up -d`. Test a restore on staging quarterly.
- Before every deploy or migration: `docker compose exec backup /usr/local/bin/backup.sh` (manual backup).
