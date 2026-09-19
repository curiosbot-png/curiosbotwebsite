# Security
- **Network:** ufw allows 22/80/443 only; Postgres and n8n are on the internal Docker network and never published. HTTPS everywhere with HSTS via Caddy. SSH key-only, fail2ban.
- **n8n:** behind Caddy basic auth plus n8n owner login; `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`; credentials encrypted with `N8N_ENCRYPTION_KEY`; webhooks require a Header Auth bearer; app endpoints (`/api/ingest`, `/api/internal/*`) require a bearer, compared in constant time.
- **App:** strict CSP and security headers (next.config.mjs), origin check + honeypot + rate limit on public forms, zod validation on all inputs, parameterised SQL, escaping markdown renderer (no raw HTML), audit log for admin actions, RBAC enforced server-side (admin-only: approve/publish, users, scoring, alerts).
- **Auth:** bcrypt cost 12, 12-char password policy, lockout, session revocation on logout, reset tokens hashed + one-time + 1 h, generic error messages. MFA fields exist; TOTP UI is a documented next step.
- **Secrets:** only in server `.env` (chmod 600) and n8n credential store. `.env` is git-ignored. Rotate on suspicion: change value in `.env`, update the matching n8n credential, `docker compose up -d`.
- **Known limits:** MFA not yet enforced; admin CSRF relies on Next server-action origin checks + SameSite=Lax; run `npm audit` in CI/regularly; pin `N8N_VERSION` and image tags after first deploy.
