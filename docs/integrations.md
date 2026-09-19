# Integrations (architecture; owner connects accounts)
| Integration | Status | How |
|---|---|---|
| Search Console / GA4 | Ready, not connected | n8n workflow 03 with Google OAuth (read-only). Data lands in `external_metrics`; dashboards show "not connected" until data arrives. |
| Google Ads / LinkedIn Ads / Meta Ads | Reporting-only architecture | n8n reads spend/clicks/conversions and posts `source` rows to `/api/ingest`. Cost/ROAS stay empty until then. **Campaign creation and spend are never automated.** |
| Salesforce | Approval-gated | Workflow 08; node disabled until OAuth; human approval per lead. |
| Email (SMTP) | Needed for internal notifications and password reset | Create n8n credential "Curiosbot SMTP". Marketing/newsletter sending requires a chosen ESP, consented list, and approval; not enabled. |
| LinkedIn / social posting | Approval-gated placeholder | Workflows 06/07 stop after approval; add posting nodes after the owner connects accounts. |
Every ingestion posts a `run` record so failures show in Admin → Automation and raise an alert.
