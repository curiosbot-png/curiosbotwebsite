#!/usr/bin/env python3
"""Generates importable n8n workflow JSON into n8n/workflows/. Re-run after editing. No secrets are embedded:
credentials are referenced by name and must be created in the n8n UI (see docs/n8n.md).
App base URL inside Docker network: http://web:3000."""
import json, pathlib
OUT = pathlib.Path(__file__).parent / "workflows"; OUT.mkdir(exist_ok=True)
APP = "http://web:3000"
HDR_APP = {"httpHeaderAuth": {"id": "", "name": "Curiosbot ingest (bearer)"}}
HDR_HOOK = {"httpHeaderAuth": {"id": "", "name": "Curiosbot webhook (bearer)"}}
SMTP = {"smtp": {"id": "", "name": "Curiosbot SMTP"}}

def node(name, type_, params, pos, ver=1, creds=None, **extra):
    n = {"parameters": params, "name": name, "type": type_, "typeVersion": ver, "position": pos}
    if creds: n["credentials"] = creds
    n.update(extra); return n

def webhook(path, pos=(0, 0)):
    return node("Webhook", "n8n-nodes-base.webhook", {"httpMethod": "POST", "path": path, "authentication": "headerAuth", "options": {}}, list(pos), 2, HDR_HOOK, webhookId=path)

def post_app(name, path, body, pos, timeout=120000):
    return node(name, "n8n-nodes-base.httpRequest", {
        "method": "POST", "url": f"{APP}{path}", "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth",
        "sendBody": True, "specifyBody": "json", "jsonBody": body, "options": {"timeout": timeout}}, pos, 4, HDR_APP)

def log_run(name, workflow, status, pos, detail="{}"):
    return post_app(name, "/api/ingest", '={{ JSON.stringify({type:"run", workflow:"%s", status:"%s", detail:%s}) }}' % (workflow, status, detail), pos, 20000)

def chain(nodes, links):
    conns = {}
    for a, b in links: conns.setdefault(a, {"main": [[]]})["main"][0].append({"node": b, "type": "main", "index": 0})
    return conns

def wf(fname, name, nodes, links, note):
    doc = {"name": name, "nodes": nodes, "connections": chain(nodes, links), "active": False, "settings": {"executionOrder": "v1"},
           "meta": {"description": note}, "tags": [{"name": "curiosbot"}]}
    (OUT / fname).write_text(json.dumps(doc, indent=2) + "\n")

# 1 lead-captured -> notify sales by email (SMTP). No CRM write, no marketing email.
wf("01-lead-captured.json", "Curiosbot · Lead captured → notify sales", [
    webhook("lead-captured"),
    node("Format", "n8n-nodes-base.set", {"assignments": {"assignments": [
        {"id": "1", "name": "subject", "type": "string", "value": "={{ '[Curiosbot lead] ' + $json.body.name + ' — ' + ($json.body.company || 'no company') + ' (score ' + $json.body.score + ', ' + $json.body.stage + ')' }}"},
        {"id": "2", "name": "text", "type": "string", "value": "={{ 'New ' + $json.body.kind + ' request.\\nName: ' + $json.body.name + '\\nEmail: ' + $json.body.email + '\\nCompany: ' + ($json.body.company||'-') + '\\nScore: ' + $json.body.score + ' (' + $json.body.stage + ')\\nOpen in admin: https://admin.curiosbot.com/leads/' + $json.body.leadId }}"}]}, "options": {}}, [220, 0], 3.4),
    node("Email sales", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "sales@curiosbot.com", "subject": "={{ $json.subject }}", "emailFormat": "text", "text": "={{ $json.text }}", "options": {}}, [440, 0], 2.1, SMTP, onError="continueErrorOutput"),
    log_run("Log success", "lead-captured", "success", [660, -60]),
    log_run("Log failure", "lead-captured", "error", [660, 80]),
], [("Webhook", "Format"), ("Format", "Email sales")],
   "Internal notification only. Does not email the lead or add them to any list (consent-gated marketing is a separate, approval-based flow).")
d = json.loads((OUT / "01-lead-captured.json").read_text())
d["connections"]["Email sales"] = {"main": [[{"node": "Log success", "type": "main", "index": 0}], [{"node": "Log failure", "type": "main", "index": 0}]]}
(OUT / "01-lead-captured.json").write_text(json.dumps(d, indent=2) + "\n")

# 2 password reset email
wf("02-password-reset.json", "Curiosbot · Admin password reset email", [
    webhook("password-reset"),
    node("Email reset link", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "={{ $json.body.email }}", "subject": "Reset your Curiosbot admin password",
        "emailFormat": "text", "text": "={{ 'A password reset was requested for your Curiosbot admin account.\\nThis link is valid for 1 hour and can be used once:\\n' + $json.body.resetUrl + '\\n\\nIf you did not request this, ignore this email.' }}", "options": {}}, [240, 0], 2.1, SMTP),
], [("Webhook", "Email reset link")], "The reset URL contains a one-time token. Keep n8n execution data pruning on (EXECUTIONS_DATA_PRUNE) so tokens are not retained.")

# 3 analytics ingestion daily: GA4 + GSC (owner connects OAuth). Only pushes what platforms return.
wf("03-analytics-ingestion.json", "Curiosbot · Daily analytics ingestion (GA4 + Search Console)", [
    node("Daily 05:30", "n8n-nodes-base.scheduleTrigger", {"rule": {"interval": [{"field": "cronExpression", "expression": "30 5 * * *"}]}}, [0, 0], 1.2),
    node("Search Console (last 3 days)", "n8n-nodes-base.httpRequest", {"method": "POST",
        "url": "https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent('sc-domain:curiosbot.com') }}/searchAnalytics/query",
        "authentication": "predefinedCredentialType", "nodeCredentialType": "googleOAuth2Api", "sendBody": True, "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({startDate: $now.minus({days:3}).toFormat('yyyy-MM-dd'), endDate: $now.minus({days:1}).toFormat('yyyy-MM-dd'), dimensions:['date','query'], rowLimit:500}) }}", "options": {}},
        [240, -80], 4, {"googleOAuth2Api": {"id": "", "name": "Google Search Console"}}, onError="continueRegularOutput"),
    node("Map GSC rows", "n8n-nodes-base.code", {"jsCode": "const rows = ($json.rows||[]).map(r=>({source:'gsc',metric_date:r.keys[0],dimension:'query',dimension_value:String(r.keys[1]).slice(0,500),metrics:{clicks:r.clicks,impressions:r.impressions,ctr:r.ctr,position:r.position}}));\nreturn [{json:{type:'metrics',rows}}];"}, [480, -80], 2),
    node("Has rows?", "n8n-nodes-base.if", {"conditions": {"options": {"version": 2}, "combinator": "and", "conditions": [{"id": "1", "leftValue": "={{ $json.rows.length }}", "rightValue": 0, "operator": {"type": "number", "operation": "gt"}}]}}, [700, -80], 2.2),
    post_app("Push GSC → app", "/api/ingest", "={{ JSON.stringify($json) }}", [920, -140]),
    log_run("Log run", "analytics-ingestion", "success", [1140, -140]),
], [("Daily 05:30", "Search Console (last 3 days)"), ("Search Console (last 3 days)", "Map GSC rows"), ("Map GSC rows", "Has rows?"), ("Has rows?", "Push GSC → app"), ("Push GSC → app", "Log run")],
   "Requires the owner to connect Google OAuth (Search Console read-only scope). Add a GA4 Data API node in the same pattern (source 'ga4'). Rows are only pushed when the platform returned data; nothing is fabricated.")

# 4 alerts hourly
wf("04-alerts-hourly.json", "Curiosbot · Hourly alert evaluation → notify", [
    node("Hourly", "n8n-nodes-base.scheduleTrigger", {"rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}}, [0, 0], 1.2),
    post_app("Evaluate alerts", "/api/internal/alerts", "{}", [220, 0], 60000),
    node("Split alerts", "n8n-nodes-base.splitOut", {"fieldToSplitOut": "alerts", "options": {}}, [440, 0], 1),
    node("Email owner", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "sales@curiosbot.com", "subject": "={{ '[Curiosbot alert] ' + $json.rule_key }}",
        "emailFormat": "text", "text": "={{ $json.message + '\\nSee https://admin.curiosbot.com/alerts' }}", "options": {}}, [660, 0], 2.1, SMTP),
], [("Hourly", "Evaluate alerts"), ("Evaluate alerts", "Split alerts"), ("Split alerts", "Email owner")],
   "The app evaluates spike/drop/trending/campaign rules and dedupes for 24h; only NEW alerts are returned and emailed.")

# 5 weekly AI analysis
wf("05-ai-analysis-weekly.json", "Curiosbot · Weekly AI marketing analysis", [
    node("Monday 07:00", "n8n-nodes-base.scheduleTrigger", {"rule": {"interval": [{"field": "cronExpression", "expression": "0 7 * * 1"}]}}, [0, 0], 1.2),
    post_app("Run analyst", "/api/internal/analyst", "{}", [220, 0], 180000),
    node("Email summary", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "sales@curiosbot.com", "subject": "Curiosbot weekly AI analysis ready for review",
        "emailFormat": "text", "text": "={{ 'The weekly analysis produced ' + $json.insights.length + ' insight(s). Review them (with evidence) at https://admin.curiosbot.com/ai/analyst' }}", "options": {}}, [440, 0], 2.1, SMTP),
], [("Monday 07:00", "Run analyst"), ("Run analyst", "Email summary")],
   "Analysis is stored for review only; insights with untraceable numbers are dropped by the app's guard. Nothing is published or acted on automatically.")

# 6 product lifecycle / 7 content distribution: approval gate — n8n sends a Wait-for-approval email, only then proceeds to draft-only steps.
def approval(fname, name, path, subject_expr, note):
    wf(fname, name, [
        webhook(path),
        node("Ask human to approve", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "sales@curiosbot.com", "subject": subject_expr,
            "emailFormat": "text", "text": "={{ 'Approval needed before any external distribution.\\nItem: ' + $json.body.url + '\\nApprove: ' + $execution.resumeUrl + '?decision=approve\\nReject: ' + $execution.resumeUrl + '?decision=reject' }}", "options": {}}, [220, 0], 2.1, SMTP),
        node("Wait for approval", "n8n-nodes-base.wait", {"resume": "webhook", "httpMethod": "GET", "options": {}}, [440, 0], 1.1, webhookId=path + "-approval"),
        node("Approved?", "n8n-nodes-base.if", {"conditions": {"options": {"version": 2}, "combinator": "and", "conditions": [{"id": "1", "leftValue": "={{ $json.query.decision }}", "rightValue": "approve", "operator": {"type": "string", "operation": "equals"}}]}}, [660, 0], 2.2),
        log_run("Log approved (drafts only)", path, "success", [880, -60], '{approved:true, note:"External posting needs its own credentials; add channel nodes here"}'),
        log_run("Log rejected", path, "success", [880, 80], '{approved:false}'),
    ], [("Webhook", "Ask human to approve"), ("Ask human to approve", "Wait for approval"), ("Wait for approval", "Approved?"), ("Approved?", "Log approved (drafts only)")], note)
    d = json.loads((OUT / fname).read_text())
    d["connections"]["Approved?"] = {"main": [[{"node": "Log approved (drafts only)", "type": "main", "index": 0}], [{"node": "Log rejected", "type": "main", "index": 0}]]}
    (OUT / fname).write_text(json.dumps(d, indent=2) + "\n")

approval("06-product-lifecycle.json", "Curiosbot · Product published → approval → distribution", "product-published", "={{ 'Approve distribution: ' + $json.body.slug }}",
         "Fires when an admin publishes a product on the site. Distribution (LinkedIn/email/newsletter) is gated by a human email approval. Add posting nodes AFTER the 'Approved?' true branch once the owner connects those accounts. Never spends advertising budget.")
approval("07-content-distribution.json", "Curiosbot · Insight published → approval → distribution", "content-published", "={{ 'Approve distribution: ' + $json.body.slug }}",
         "Same approval gate for insights/articles. No auto-posting until the owner connects channels and adds nodes.")

# 8 crm sync — approval gate, then Salesforce create (owner connects Salesforce OAuth; node disabled by default)
wf("08-crm-sync.json", "Curiosbot · Qualified lead → approval → Salesforce", [
    webhook("crm-sync"),
    node("Ask human to approve", "n8n-nodes-base.emailSend", {"fromEmail": "no-reply@curiosbot.com", "toEmail": "sales@curiosbot.com", "subject": "Approve CRM sync for a qualified lead",
        "emailFormat": "text", "text": "={{ 'Lead ' + ($json.body.name||'') + ' <' + ($json.body.email||'') + '>\\nApprove creating in Salesforce: ' + $execution.resumeUrl + '?decision=approve\\nReject: ' + $execution.resumeUrl + '?decision=reject' }}", "options": {}}, [220, 0], 2.1, SMTP),
    node("Wait for approval", "n8n-nodes-base.wait", {"resume": "webhook", "httpMethod": "GET", "options": {}}, [440, 0], 1.1, webhookId="crm-sync-approval"),
    node("Approved?", "n8n-nodes-base.if", {"conditions": {"options": {"version": 2}, "combinator": "and", "conditions": [{"id": "1", "leftValue": "={{ $json.query.decision }}", "rightValue": "approve", "operator": {"type": "string", "operation": "equals"}}]}}, [660, 0], 2.2),
    node("Create Salesforce lead (enable after OAuth)", "n8n-nodes-base.salesforce", {"resource": "lead", "operation": "create", "company": "={{ $('Webhook').item.json.body.company || 'Unknown' }}", "lastname": "={{ $('Webhook').item.json.body.name }}", "additionalFields": {"email": "={{ $('Webhook').item.json.body.email }}"}},
         [880, -60], 1, {"salesforceOAuth2Api": {"id": "", "name": "Salesforce"}}, disabled=True),
    log_run("Log", "crm-sync", "success", [1100, 0], '{approved:$("Approved?").item.json.query.decision}'),
], [("Webhook", "Ask human to approve"), ("Ask human to approve", "Wait for approval"), ("Wait for approval", "Approved?"), ("Approved?", "Create Salesforce lead (enable after OAuth)"), ("Create Salesforce lead (enable after OAuth)", "Log")],
   "Human approval is mandatory before any record is written to an external CRM. The Salesforce node ships DISABLED until the owner connects OAuth.")
print("ok", sorted(p.name for p in OUT.iterdir()))
