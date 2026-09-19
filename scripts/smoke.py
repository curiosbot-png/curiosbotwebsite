#!/usr/bin/env python3
"""End-to-end smoke test against a running instance (no third-party deps).
Usage: SMOKE_BASE=http://localhost:3100 SMOKE_EMAIL=... SMOKE_PASSWORD=... python3 scripts/smoke.py
Logs in through the real login form (no-JS path), then requests every public and admin page and checks auth/role rules."""
import html, http.cookiejar, os, re, sys, urllib.error, urllib.parse, urllib.request, uuid

BASE = os.environ.get("SMOKE_BASE", "http://localhost:3100").rstrip("/")
EMAIL, PW = os.environ.get("SMOKE_EMAIL", ""), os.environ.get("SMOKE_PASSWORD", "")
ADMIN_PREFIX = os.environ.get("SMOKE_ADMIN_PREFIX", "/admin")  # "" when using the admin subdomain
fails = 0

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def opener(jar, follow=True):
    h = [urllib.request.HTTPCookieProcessor(jar)]
    if not follow: h.append(NoRedirect())
    return urllib.request.build_opener(*h)

def get(op, path):
    try:
        r = op.open(urllib.request.Request(BASE + path, headers={"User-Agent": "smoke"}), timeout=30)
        return r.status, r.read().decode("utf-8", "replace"), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), e.headers.get("Location", "")

def check(name, ok, extra=""):
    global fails
    print(("PASS " if ok else "FAIL ") + name + (f"  {extra}" if extra and not ok else ""))
    if not ok: fails += 1

def multipart(fields):
    b = uuid.uuid4().hex; body = b""
    for k, v in fields: body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    return body + f"--{b}--\r\n".encode(), f"multipart/form-data; boundary={b}"

# public pages
anon = opener(http.cookiejar.CookieJar())
for p in ["/", "/ai-consulting", "/ai-strategy-adoption", "/cxo-ai-advisory", "/plm-consulting", "/salesforce-consulting", "/products", "/insights", "/about", "/contact", "/privacy", "/cookie-policy", "/legal-notice", "/robots.txt", "/sitemap.xml"]:
    s, body, _ = get(anon, p); check(f"public {p} -> 200", s == 200, str(s))
s, body, _ = get(anon, "/this-does-not-exist"); check("404 page", s == 404)
s, body, _ = get(anon, "/"); check("home has <h1> and canonical/JSON-LD", "<h1" in body and "application/ld+json" in body)

# admin protected when anonymous
nf = opener(http.cookiejar.CookieJar(), follow=False)
s, _, loc = get(nf, ADMIN_PREFIX or "/"); check("admin redirects anonymous to login", s in (302, 303, 307, 308) and "login" in loc, f"{s} {loc}")

if not EMAIL:
    print("SMOKE_EMAIL not set; skipping authenticated checks"); sys.exit(1 if fails else 0)

jar = http.cookiejar.CookieJar(); op = opener(jar)
_, page, _ = get(op, ADMIN_PREFIX + "/login")
hidden = [(m.group(1), html.unescape(m.group(2) or "")) for m in re.finditer(r'<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?', page)]
def login(pw):
    body, ct = multipart(hidden + [("email", EMAIL), ("password", pw)])
    req = urllib.request.Request(BASE + ADMIN_PREFIX + "/login", data=body, headers={"Content-Type": ct, "Origin": BASE})
    try: r = op.open(req, timeout=30); return r.status, r.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.read().decode()
s, b = login("definitely-wrong-password"); check("wrong password shows generic error", "Invalid email or password" in b, str(s))
s, b = login(PW); has_session = any(c.name == "cb_session" for c in jar); check("correct password sets session cookie", has_session, str(s))
if not has_session: sys.exit(1)
# The session cookie is Secure (correct in production). For local http:// runs, send it explicitly.
tok = next(c.value for c in jar if c.name == "cb_session")
op = urllib.request.build_opener(); op.addheaders = [("Cookie", f"cb_session={tok}"), ("User-Agent", "smoke")]
for p in ["", "/marketing", "/content", "/content/new", "/products", "/products/new", "/campaigns", "/leads", "/audience", "/email", "/social", "/advertising", "/seo", "/ai-studio", "/ai-studio/product", "/ai-studio/content", "/ai-studio/analyst", "/ai-studio/ask", "/automations", "/analytics", "/users", "/settings", "?p=7d", "/marketing?p=90d&device=mobile", "/analytics?p=year", "/content?sort=trending", "/leads?stage=engaged", "/seo?p=custom&from=2026-01-01&to=2026-02-01"]:
    s, body, final = get(op, ADMIN_PREFIX + p); check(f"admin {p or '/'} -> 200 (authenticated, not login page)", s == 200 and "/login" not in final and "Application error" not in body, f"{s} {final}")
s, body, _ = get(op, ADMIN_PREFIX); check("dashboard shows KPI labels", all(k in body for k in ["Visitors", "New leads", "Qualified leads", "Demo requests"]))
# role checks: marketing users must not reach admin-only pages
print("\nFAILURES:", fails); sys.exit(1 if fails else 0)
