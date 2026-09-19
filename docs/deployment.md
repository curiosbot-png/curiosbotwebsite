# Deployment (Hostinger VPS) — staging first

**Rule: nothing touches production DNS, the WordPress site or email records until the owner explicitly approves.**

## 0. Prerequisites (owner)
See docs/owner-actions.md. Need: VPS with Ubuntu 22.04/24.04 + root SSH key, a DNS A record for `staging`, `admin`, `automation` → VPS IP (these are new hostnames; they do not affect the live site or email), GitHub repo.

## 1. Harden the server
```bash
ssh root@VPS
git clone <repo> /opt/curiosbot && cd /opt/curiosbot
bash deploy/harden-vps.sh      # ufw 22/80/443, fail2ban, key-only SSH (confirm your key works in a 2nd session first)
```
Docker + compose plugin must be installed (`curl -fsSL https://get.docker.com | sh`).

## 2. Configure secrets on the server only
```bash
cp .env.example .env && chmod 600 .env
for v in POSTGRES_SUPERUSER_PASSWORD POSTGRES_PASSWORD N8N_DB_PASSWORD HASH_SALT N8N_WEBHOOK_SECRET N8N_INGEST_SECRET N8N_ENCRYPTION_KEY; do
  sed -i "s|^$v=.*|$v=$(openssl rand -base64 36 | tr -d '=+/')|" .env; done
# Basic-auth hash for n8n: see comment in .env.example. Add OPENAI_API_KEY yourself in an editor (never paste it in chat).
```
Back up `N8N_ENCRYPTION_KEY` in a password manager.

## 3. Launch staging
```bash
docker compose --env-file .env up -d --build
docker compose exec web node scripts/create-admin.mjs   # with ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD exported for that command
docker compose ps; curl -fsS https://staging.curiosbot.com/api/health
```
`.env` defaults to `PUBLIC_HOSTS=staging.curiosbot.com` (noindex). Import n8n workflows (docs/n8n.md). Run `python3 scripts/smoke.py https://staging.curiosbot.com`.

## 4. Owner review
Send the owner the staging + admin URLs and the checklist in docs/testing.md. Collect fixes. Legal review of privacy/cookie/legal-notice drafts; fill CIF and registry details.

## 5. Production cutover (only after written owner approval)
1. Lower TTL on `curiosbot.com`/`www` A records to 300 s at least 24 h before.
2. Export DNS zone (screenshot/copy) — **MX, SPF, DKIM, DMARC records are not edited at all.**
3. Back up the WordPress files + DB (Hostinger backup or `wp db export` + archive `wp-content`). Keep the old site intact until rollback window closes.
4. On the VPS: set `PUBLIC_HOSTS=curiosbot.com,www.curiosbot.com`, `NEXT_PUBLIC_SITE_URL=https://curiosbot.com`; replace `deploy/caddy/sites/public-extra.caddy` with `public-extra.production.caddy` (removes noindex) and add the www → apex redirect from `www-redirect.production.active.caddy.example`. `docker compose up -d`.
5. Change ONLY the A (and AAAA if present) records of the apex and `www` to the VPS IP.
6. Verify: certificate issued, `/`, key pages, `/sitemap.xml`, `/robots.txt`, old-URL redirects, contact form, admin login, and **send/receive a test email** to sales@ and help@.
7. Submit sitemap in Search Console; monitor 404s for a week.

## Rollback → docs/rollback.md
