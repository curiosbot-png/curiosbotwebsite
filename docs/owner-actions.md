# Owner-only actions (one at a time, never in chat/source)
1. **GitHub:** create an empty private repo and authorise access (or push the code yourself).
2. **Hostinger VPS:** add your SSH public key; provide the server IP.
3. **DNS (new records only):** A records `staging`, `admin`, `automation` → VPS IP.
4. **Secrets:** on the VPS, edit `.env` (OpenAI key, SMTP details). Never paste them into chat.
5. **Legal:** review privacy/cookie/legal-notice drafts; supply CIF and registry data; confirm whether client names may be shown.
6. **Optional connections:** Google (Search Console/GA4), Salesforce, ad platforms, LinkedIn.
7. **Staging approval → written go-ahead for production cutover** (docs/deployment.md §5).
