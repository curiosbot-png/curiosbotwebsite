# Testing
- `npm run lint` (tsc), `npm test` (vitest: scoring, AI guards, markdown, workflow, alerts, internal auth).
- `python3 scripts/smoke.py <base-url>`: public pages, security headers, admin login/RBAC, consent-gated tracking, lead capture and scoring.
- `python3 tests/e2e/ai_flow.py`: full AI generate → edit → approve → publish flow against a mock OpenAI (`tests/e2e/mock_openai.py`). Real OpenAI calls need `OPENAI_API_KEY` on staging.
- Owner acceptance checklist (staging): every public page on desktop + mobile; contact form → lead appears in admin with score + explanation; consent banner behaviour; admin login, product creation via AI, publish gate; n8n webhook email received; `prefers-reduced-motion` respected; Lighthouse ≥ 90 on home (run on staging over real network).
