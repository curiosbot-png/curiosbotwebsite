# Curiosbot 2.0 platform — build status (2026-09-19)

Repo (local, not yet pushed): curiosbot-platform. Next.js 15 + PostgreSQL 16 + n8n + OpenAI + Docker Compose + Caddy. Replaces the WordPress site; keeps the existing blue #0067FF / violet #7C3AED palette and URL structure.

## Built and verified locally
- Public site (home, 3 practice pages + AI strategy + CXO advisory, database-driven products and insights, about, contact, draft legal pages), SEO (JSON-LD, sitemap, robots, redirects from old WP URLs), reduced-motion-aware animation.
- Admin portal (host-routed admin.curiosbot.com): auth, RBAC, audit, Marketing Command Center, lead scoring with explanations, AI Product Creator / Content Factory / Analyst / Ask Curiosbot with draft → review → approve → publish gate.
- Consent-gated first-party analytics; GDPR erase; retention script.
- n8n: 8 importable workflows (lead notify, password reset, GSC ingestion, hourly alerts, weekly AI analysis, publish approval gates, CRM approval).
- Docker Compose, Caddy, VPS hardening, backup/restore, CI workflow, full docs set.
- Tests: 20 unit tests, smoke (0 failures), AI E2E with mock OpenAI (0 failures), internal bearer endpoints verified.

## Not yet verified (needs environment we don't have here)
Docker image build, Caddyfile on real host, real OpenAI calls, Search Console/GA4/ads/Salesforce OAuth, Lighthouse on a real network, backup/restore against the real stack.

## Blocked on owner (one at a time)
1. GitHub repo/authorisation  2. Hostinger VPS SSH access + IP  3. DNS A records for staging/admin/automation (new records only)  4. Secrets on VPS (OpenAI key, SMTP)  5. Legal review of privacy/cookie/legal notice, CIF, client-name permission  6. Staging approval, then written production go-ahead.

## Safety notes
Production DNS, MX/SPF/DKIM/DMARC and the WordPress site are untouched. Prior WordPress malware compromise: see docs/rollback.md before cutover; rotate Hostinger/FTP/DB/WP passwords.
