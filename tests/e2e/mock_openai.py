#!/usr/bin/env python3
"""Tiny OpenAI-compatible mock for local E2E testing (no network, no key needed). Port 4010."""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

def reply(system, user):
    if "Choose which analytics data tools" in system:
        return {"tools": ["kpis", "content"]}
    if "Ask Curiosbot" in system:
        return {"answer": "Visitors were 62 in the period and there were 3 new leads.", "used": ["kpis"], "data_gaps": []}
    if "AI Marketing Analyst" in system:
        return {"insights": [
            {"observation": "Visitors totalled 62 in the period.", "evidence": ["kpis.cur.visitors"], "possible_explanation": "Traffic may reflect the LinkedIn campaign.", "recommended_experiment": "Add a CTA to the top 3 articles.", "confidence": "low"},
            {"observation": "Conversion rate hit 87.3% this period.", "evidence": [], "possible_explanation": "Could be the new hero.", "recommended_experiment": "Test the hero.", "confidence": "high"}],
            "investigate_next": ["Check mobile funnel"]}
    if "product" in user.lower() and "Product input" in user:
        pair = [{"title": "T1", "description": "D1"}]
        return {"tagline": "Mock tagline", "hero_copy": "Hero", "short_description": "Mock short description", "long_description": "Long", "business_problem": "Mock problem", "solution": "Mock solution",
                "how_it_works": pair, "capabilities": pair, "benefits": pair, "use_cases": pair, "faq": [{"q": "Q?", "a": "A."}], "seo_title": "Mock SEO", "seo_description": "Mock SEO desc",
                "linkedin_announcement": "LI", "social_posts": ["p1"], "email_announcement": "E", "newsletter": "N", "ad_copy": [{"headline": "H", "description": "D"}], "video_script": "V", "image_prompts": ["i"], "sales_pitch": "S", "executive_summary": "X"}
    return {"article_title": "Mock article", "article_md": "# Mock\n\nBody", "executive_summary": "Summary", "linkedin_article": "LA", "linkedin_post": "LP", "social_posts": ["a"],
            "newsletter": "N", "email": {"subject": "S", "body": "B"}, "seo": {"title": "T", "description": "D", "keywords": ["k"]}, "ad_concepts": [], "video_script": "V", "image_prompts": [], "cta": "C"}

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        msgs = body["messages"]; out = json.dumps(reply(msgs[0]["content"], msgs[1]["content"])).encode()
        resp = json.dumps({"choices": [{"message": {"content": out.decode()}}]}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(resp)
    def log_message(self, *a): pass
HTTPServer(("127.0.0.1", 4010), H).serve_forever()
