# Rollback and DNS/email safety
- **Before cutover:** record the current A/AAAA/CNAME/MX/TXT records verbatim. The cutover changes only apex/www A (and AAAA) records.
- **Rollback trigger:** any failed check in the cutover verification, or owner request.
- **Rollback steps (≈5 min + TTL):** set apex/www A records back to the recorded WordPress IP. Nothing was deleted from the old host, so the old site resumes. Then on the VPS set `PUBLIC_HOSTS=staging.curiosbot.com` and `docker compose up -d`.
- **Application rollback:** `git checkout <previous tag> && docker compose up -d --build web`. Migrations are additive; if a migration must be reverted, restore the last backup (docs/backup-restore.md).
- **Email:** MX/SPF/DKIM/DMARC records are never modified by this project. If email breaks, restore the recorded TXT/MX values immediately. Transactional mail from n8n (no-reply@) requires an SPF include and DKIM from the chosen SMTP provider — add these only with the owner, keeping the existing SPF record and merging (one SPF TXT record only).
- Retain the WordPress backup ≥ 30 days after cutover.
- **Malware history:** the previous WordPress install on this Hostinger account was compromised earlier (all three WP sites). The rebuilt curiosbot.com is clean, but its sibling sites (aitooldirectory.com, aitoolsearch.com) may still be infected. Do NOT restore or copy files from other WordPress sites; make the pre-cutover WordPress backup only of curiosbot.com; rotate Hostinger/FTP/DB/WP-admin passwords before placing any new VPS behind the same account credentials.
