# Architecture

```
Browser ──HTTPS──▶ Caddy ──▶ web (Next.js standalone)  ──▶ postgres (internal only)
                     │            │  ▲
                     │            ▼  │ bearer webhooks / ingest
                     └──────────▶ n8n ──▶ postgres (n8n DB, internal)
backup container: nightly pg_dump (both DBs) + n8n volume, rotated
```
- **One Next.js app, two hosts.** `src/middleware.ts` rewrites `ADMIN_HOST` to `/admin/*` and 404s `/admin` on public hosts. Without ADMIN_HOST (local dev) `/admin` paths work directly.
- **Database:** plain SQL migrations (`db/migrations`, tracked in `schema_migrations`); parameterised SQL only; Postgres is never published to the host.
- **Auth:** bcrypt(12), DB sessions (SHA-256 token hash, httpOnly Secure SameSite=Lax, 12 h), lockout after 5 failures, DB rate limiting, audit log, RBAC (`admin`, `marketing`), MFA columns reserved.
- **Analytics:** first-party events only after consent (`cb_consent`), random UUID visitor id, no fingerprinting, no IP storage, GPC honoured. Campaign/UTM and lead linking need marketing consent.
- **Lead scoring:** pure function over events + configurable rules/stages; each score stores its breakdown ("why this lead scored X").
- **AI:** OpenAI Chat Completions with zod-validated JSON. Analyst output passes a numeric-traceability guard; Ask Curiosbot uses a fixed whitelist of read-only data tools (no model-written SQL). Content/product generation is stored as drafts; publishing requires an admin action.
- **n8n:** app → n8n webhooks (bearer, Header Auth). n8n → app `/api/ingest` and `/api/internal/*` (bearer). Approval gates use n8n "Wait" nodes with email links. See docs/n8n.md.
- **Decisions:** Caddy over Nginx (automatic certificates, less config); standalone Next output for a small image; self-hosted fonts (no third-party requests, GDPR); external metrics stored separately (`external_metrics`) so nothing is mixed with first-party numbers; cost/ROAS are null unless an ad platform is connected.
