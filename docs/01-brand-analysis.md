# Phase 1 — Existing Curiosbot Site Analysis

Source: live inspection of https://curiosbot.com on 2026-09-19 (rendered DOM, computed styles, robots.txt, sitemaps, WP REST index) plus the project status doc `curiosbot-website-redesign-status.md`.

## Platform today
WordPress, Astra theme + Spectra blocks, SureForms, Yoast-style sitemap, hosted on Hostinger. The site was rebuilt clean on 2026-09-16 after a malware incident. **Treat the current site as the fragile production system: do not touch DNS/hosting until the new stack is proven on staging.**

## Extracted brand tokens (Astra global palette, computed)
| Token | Hex | Use today |
|---|---|---|
| Primary blue | `#0067FF` | links, buttons, accents |
| Violet accent | `#7C3AED` | hover/link states (added 2026-09) |
| Ink / navy | `#0F172A` | headings |
| Slate | `#364151` | body text (rgb 54,65,81) |
| Ice | `#E7F6FF` | page background |
| White | `#FFFFFF` | surfaces |
| Mist | `#D1DAE5` | borders |
| Deep night | `#070614` | dark sections |
| Charcoal | `#222222` | misc |

Prior static-site design system (referenced in project doc): indigo `#5B6EF0`, copper `#C99A67`. Copper is **not** in the live site; we keep it only as an optional warm highlight for data (see design system).

**Typography (live):** headings Poppins; body Open Sans.
**Logo:** `https://curiosbot.com/wp-content/uploads/2020/06/site-logo-white.svg` (white wordmark for dark header). Re-use the SVG; do not redraw.
**OG image:** `/wp-content/uploads/2026/09/curiosbot-ai-transformation-1024x772.png`.

## Navigation and URLs (all discovered)
| URL | Type | Action in 2.0 |
|---|---|---|
| `/` | Home | Rebuilt |
| `/about/` | Page | Rebuilt at `/about` (301 from trailing-slash form) |
| `/services/` | Page | 301 → `/ai-consulting` (hub page keeps services overview) |
| `/contact/` | Page | Rebuilt at `/contact` |
| `/customer-cabinet/` | Page (legacy template) | Not linked; 301 → `/contact` |
| `/hello-world/` | Default WP post | 410/404 (no SEO value) |
| `/sitemap_index.xml`, `/wp-sitemap.xml` | Sitemaps | 301 → `/sitemap.xml` |
| `/wp-admin`, `/wp-login.php` | WP | Not proxied to new app |

Sitemap groups: archives, pages, posts, sureforms_form, category. Only 4 real pages carry content.

## Messaging worth preserving
- "Turn AI Ambition Into Enterprise Results" (H1)
- "One Consultancy, Three Core Practices": AI adoption, PLM, Salesforce
- Differentiators: Integrated AI Systems, Agentic Workflows, Measurable Operational ROI
- Founder quote: "We don't sell AI pilots that sit in a slide deck." — Anup Khanvilkar, Founder
- Stats: 18+ years, 4+ industry verticals, 3 core practices
- Contact: Zaragoza, Spain; sales@curiosbot.com; help@curiosbot.com; (+34) 602 001 201
- Client names on the current site: Borealis, Siemens, Continental, Essity (from the marketing deck). **Open item:** confirm the company may name these publicly; 2.0 ships them behind a `SHOW_CLIENT_NAMES` flag defaulting to off.

## SEO observations
- robots.txt blocks several scraper bots, allows everyone else, points to `sitemap_index.xml`. Preserve the bot blocks.
- Site is very thin (4 pages). Biggest SEO gain in 2.0 is new service/product/insight pages, not preserving old ones.
- Meta description is empty on the home page; 2.0 sets explicit metadata everywhere.

## Design decision: "Curiosbot 2.0"
Keep blue `#0067FF` + violet `#7C3AED` on deep navy `#0F172A`/`#070614`, Poppins + Open Sans. Add luminous gradient (blue→violet), a cyan data accent derived from the blue, and depth via layered surfaces. No rebrand of logo or palette.

## Email safety (production cutover)
Email is on Hostinger for the `curiosbot.com` domain. A VPS cutover changes **only the A/AAAA records for `@` and `www`**; MX, SPF, DKIM, DMARC, autodiscover records must be exported and left untouched. See `docs/deployment.md`.
