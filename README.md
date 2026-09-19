# Curiosbot 2.0 — website + AI marketing platform

Next.js 15 (App Router, TypeScript, Tailwind, Framer Motion) · PostgreSQL 16 · self-hosted n8n · OpenAI API · Docker Compose · Caddy (automatic HTTPS).

| Host | Purpose |
|---|---|
| `curiosbot.com`, `www` | Public website (after approved cutover) |
| `staging.curiosbot.com` | Staging: same stack, noindex, used for approval |
| `admin.curiosbot.com` | Admin portal + Marketing Command Center (same app, host-routed) |
| `automation.curiosbot.com` | n8n behind Caddy basic-auth + n8n owner login |

## Quick start (local)
```bash
npm ci
createdb curiosbot   # any PostgreSQL 16
export DATABASE_URL=postgres://user:pass@localhost:5432/curiosbot HASH_SALT=dev
npm run migrate
ADMIN_EMAIL=you@example.com ADMIN_NAME="You" ADMIN_PASSWORD='<12+ chars>' npm run create-admin
NODE_ENV=development npm run seed   # optional DEMO data, refuses to run in production
npm run dev
npm test && npm run lint
```
Admin locally: `/admin/login` (no ADMIN_HOST set = path routing). Passwords are never stored in the repo.

## Documentation
- [docs/01-brand-analysis.md](docs/01-brand-analysis.md) — existing site analysis, palette, URL map
- [docs/architecture.md](docs/architecture.md) — components, data flow, decisions
- [docs/deployment.md](docs/deployment.md) — Hostinger VPS, staging → approval → production cutover, DNS
- [docs/rollback.md](docs/rollback.md) — rollback and email/DNS safety
- [docs/security.md](docs/security.md) · [docs/gdpr.md](docs/gdpr.md)
- [docs/n8n.md](docs/n8n.md) · [docs/integrations.md](docs/integrations.md)
- [docs/backup-restore.md](docs/backup-restore.md) · [docs/owner-actions.md](docs/owner-actions.md) · [docs/testing.md](docs/testing.md)

## Non-negotiables built in
No auto-publishing (draft → in_review → approved → published, server-enforced). No fabricated metrics (external numbers only via authorised n8n ingestion; AI analyst outputs are checked against the data snapshot). No ad spend or external posting without owner-connected accounts and human approval. Analytics is consent-gated and fingerprint-free.
