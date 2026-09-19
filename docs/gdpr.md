# GDPR / privacy design (not legal advice — have counsel review)
- Cookie banner: analytics and marketing off by default; choice stored in `cb_consent` and mirrored in the `consents` table; withdrawable via footer "Cookie settings".
- The server re-checks consent on every tracking call; Global Privacy Control is honoured. No fingerprinting, no IP address storage, random UUID visitor id.
- Marketing consent gates campaign/UTM capture and linking a visitor's journey to a lead.
- Lead form: privacy acknowledgement required; marketing opt-in separate and unticked.
- Erasure/export: admin "data requests" action erases a lead + linked visitor events. Retention: `node scripts/retention.mjs` purges events > 25 months (env `RETENTION_EVENT_MONTHS`), stale sessions, resets, rate-limit rows. Schedule daily: `0 3 * * * cd /opt/curiosbot && docker compose exec -T web node scripts/retention.mjs`.
- Processors to list in the privacy policy after legal review: Hostinger (hosting), OpenAI (content/analysis prompts contain aggregate analytics, not personal data by design — verify), SMTP provider, Google (only if Search Console/GA4 connected).
- Privacy policy, cookie policy and legal notice are DRAFTS with placeholders (CIF, registry data, DPO/contact). Do not go live without review.
