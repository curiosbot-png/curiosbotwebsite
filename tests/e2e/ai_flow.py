#!/usr/bin/env python3
"""E2E: AI Product Creator -> review -> approve -> draft -> publish workflow -> live page; Analyst numeric guard; Ask Curiosbot.
Run against an instance started with OPENAI_API_KEY=test OPENAI_BASE_URL=http://127.0.0.1:4010/v1 and tests/e2e/mock_openai.py running."""
import html, http.cookiejar, os, re, sys, urllib.error, urllib.parse, urllib.request, uuid

BASE = os.environ.get("SMOKE_BASE", "http://localhost:3100").rstrip("/")
EMAIL, PW = os.environ["SMOKE_EMAIL"], os.environ["SMOKE_PASSWORD"]
fails = 0
def check(name, ok, extra=""):
    global fails
    print(("PASS " if ok else "FAIL ") + name + (f"   [{extra}]" if not ok and extra else "")); fails += 0 if ok else 1

class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
def multipart(fields):
    b = uuid.uuid4().hex; body = b""
    for k, v in fields: body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    return body + f"--{b}--\r\n".encode(), f"multipart/form-data; boundary={b}"

class Sess:
    def __init__(self): self.cookie = ""
    def req(self, path, data=None, follow=True):
        h = {"Cookie": self.cookie, "User-Agent": "e2e", "Origin": BASE}
        if data is not None: body, ct = multipart(data); h["Content-Type"] = ct
        else: body = None
        op = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedir)
        try:
            r = op.open(urllib.request.Request(BASE + path, data=body, headers=h), timeout=120); return r.status, r.read().decode(), r.geturl()
        except urllib.error.HTTPError as e: return e.code, e.read().decode(), e.headers.get("Location", "")
    def forms(self, page):
        out = []
        for m in re.finditer(r"<form\b(.*?)</form>", page, re.S):
            f = m.group(1)
            hidden = [(x.group(1), html.unescape(x.group(2) or "")) for x in re.finditer(r'<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?', f)]
            out.append((f, hidden))
        return out
    def submit(self, path, button_text, fields):
        _, page, _ = self.req(path)
        for f, hidden in self.forms(page):
            if button_text in re.sub(r"<[^>]+>", " ", f):
                extra = [(k, v) for k, v in hidden if k in ("id", "to")] if False else []
                return self.req(path, hidden + fields)
        raise RuntimeError(f"form '{button_text}' not found at {path}")

s = Sess()
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
page = op.open(BASE + "/admin/login").read().decode()
hidden = [(m.group(1), html.unescape(m.group(2) or "")) for m in re.finditer(r'<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?', page)]
body, ct = multipart(hidden + [("email", EMAIL), ("password", PW)])
try: op.open(urllib.request.Request(BASE + "/admin/login", data=body, headers={"Content-Type": ct, "Origin": BASE}))
except urllib.error.HTTPError: pass
s.cookie = "cb_session=" + next(c.value for c in jar if c.name == "cb_session")

name = "E2E Widget " + uuid.uuid4().hex[:6]
st, page, url = s.submit("/admin/ai-studio/product", "Generate product marketing", [("name", name), ("description", "A widget that automates enterprise reporting."), ("target_customer", "CIOs"), ("industry", "Manufacturing"), ("problem", ""), ("features", ""), ("notes", "")])
check("generate -> lands on review page", "/ai-studio/generations/" in url and "Mock tagline" in page, url)
gen_path = urllib.parse.urlparse(url).path
check("output not published/public yet", s.req("/products/" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"))[0] == 404)

st, page, _ = s.submit(gen_path, "Create product draft", []) if False else (0, "", "")
_, page, _ = s.req(gen_path)
check("draft creation not offered before approval", "Create product draft" not in page)
_, page, _ = s.submit(gen_path, "Save edits", [("f_tagline", "Edited tagline"), ("f_short_description", "Edited short description")]) 
_, page, _ = s.req(gen_path); check("edits saved", "Edited tagline" in page)
s.submit(gen_path, "Approve", [])
_, page, _ = s.req(gen_path); check("approved -> create-draft button appears", "Create product draft" in page)
st, page, url = s.submit(gen_path, "Create product draft", [])
check("product draft created", "/admin/products/" in url, url)
prod_path = urllib.parse.urlparse(url).path
slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
check("draft is NOT publicly visible", s.req("/products/" + slug)[0] == 404)
for label in ["Submit for review", "Approve", "Publish now"]:
    st, page, _ = s.submit(prod_path, label, [])
_, page, _ = s.req(prod_path); check("workflow reached published", ">published<" in page.replace("\n", "") or "published" in re.sub(r"<[^>]+>", " ", page))
import time; time.sleep(1)
st, pub, _ = s.req("/products/" + slug)
check("published product page is live (SSR from DB)", st == 200 and "Edited tagline" in pub and "Request a demo" in pub, str(st))
check("product page has SoftwareApplication JSON-LD", "SoftwareApplication" in pub)
check("sitemap includes product", "/products/" + slug in s.req("/sitemap.xml")[1])

st, page, url = s.submit("/admin/ai-studio/analyst", "Run analysis", [("p", "30d")])
txt = re.sub(r"<[^>]+>", " ", page)
check("analyst shows verified insight", "Visitors totalled 62" in txt, url)
check("analyst DROPS insight with invented number (87.3%)", "87.3" not in txt and "withheld" in txt)
check("analyst has observation/explanation/experiment structure", all(k in txt for k in ["Observation", "Possible explanation", "Recommended experiment"]))
st, page, url = s.submit("/admin/ai-studio/ask", "Ask", [("question", "What are visitors interested in?"), ("p", "30d")])
txt = re.sub(r"<[^>]+>", " ", page); check("ask curiosbot answers from data", "62" in txt and "Data tools used" in txt, url)
print("\nFAILURES:", fails); sys.exit(1 if fails else 0)
