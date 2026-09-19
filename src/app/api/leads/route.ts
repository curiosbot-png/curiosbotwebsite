import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, one, hasDb } from "@/lib/db";
import { notifyN8n, rescoreLead } from "@/lib/leads";
import { classifyPath } from "@/lib/content-map";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  company: z.string().trim().max(160).optional().default(""),
  job_title: z.string().trim().max(120).optional().default(""),
  industry: z.string().trim().max(80).optional().default(""),
  company_size: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  service_interest: z.string().trim().max(120).optional().default(""),
  product_interest: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
  kind: z.enum(["contact", "demo", "consultation"]).default("contact"),
  privacy_ack: z.literal(true),
  marketing_opt_in: z.boolean().default(false),
  landing_page: z.string().max(300).optional(),
  vid: z.string().uuid().optional(),
  source: z.string().max(100).optional(), medium: z.string().max(100).optional(), campaign: z.string().max(150).optional(),
  term: z.string().max(150).optional(), content: z.string().max(150).optional(),
  website: z.string().max(0).optional(), // honeypot: must be empty
});

const hash = (s: string) => createHash("sha256").update(s + (process.env.HASH_SALT ?? "")).digest("hex").slice(0, 32);

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasDb()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  const rl = await one<{ hits: number }>(
    `INSERT INTO rate_limits(key, window_start, hits) VALUES ($1, date_trunc('hour', now()), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limits.hits + 1 RETURNING hits`, [`lead:${hash(ip)}`]);
  if ((rl?.hits ?? 1) > 8) return NextResponse.json({ error: "Too many submissions. Please try later." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const honeypot = parsed.error.issues.some((i) => i.path[0] === "website");
    if (honeypot) return NextResponse.json({ ok: true }); // silently drop bots
    return NextResponse.json({ error: "Please check the form fields.", issues: parsed.error.issues.map((i) => ({ field: i.path[0], message: i.message })) }, { status: 400 });
  }
  const d = parsed.data;

  let consent: { analytics?: boolean; marketing?: boolean } = {};
  try { consent = JSON.parse(decodeURIComponent(req.cookies.get("cb_consent")?.value ?? "")); } catch {}
  // Journey linkage requires BOTH analytics and marketing consent and a known visitor.
  let visitorId: string | null = null;
  if (d.vid && consent.analytics && consent.marketing) {
    visitorId = (await one<{ id: string }>("SELECT id FROM visitors WHERE id=$1", [d.vid]))?.id ?? null;
  }
  const attrib = consent.marketing ? { campaign: d.campaign ?? null, medium: d.medium ?? null, term: d.term ?? null, content: d.content ?? null } : { campaign: null, medium: null, term: null, content: null };
  const first = visitorId ? await one<{ first_source: string | null; first_landing: string | null }>("SELECT first_source, first_landing FROM visitors WHERE id=$1", [visitorId]) : null;

  const lead = await one<{ id: string }>(
    `INSERT INTO leads(name,email,company,job_title,industry,company_size,country,service_interest,product_interest,message,kind,
       landing_page,original_source,latest_source,campaign,utm_medium,utm_term,utm_content,visitor_id,marketing_consent,consent_text)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
    [d.name, d.email, d.company, d.job_title, d.industry, d.company_size, d.country, d.service_interest, d.product_interest, d.message, d.kind,
     first?.first_landing ?? d.landing_page ?? null, first?.first_source ?? d.source ?? null, d.source ?? null, attrib.campaign, attrib.medium, attrib.term, attrib.content,
     visitorId, d.marketing_opt_in && consent.marketing === true,
     `Acknowledged privacy policy ${SITE.policyVersion}${d.marketing_opt_in ? "; opted in to marketing communications" : ""}`]);
  if (!lead) return NextResponse.json({ error: "failed" }, { status: 500 });

  await query("INSERT INTO consents(lead_id, visitor_id, analytics, marketing, policy_version) VALUES ($1,$2,$3,$4,$5)",
    [lead.id, visitorId, consent.analytics === true, d.marketing_opt_in, SITE.policyVersion]);
  if (visitorId) {
    await query("UPDATE visitors SET lead_id=$2 WHERE id=$1", [visitorId, lead.id]);
    const ref = classifyPath(d.landing_page ?? "/contact");
    await query("INSERT INTO events(visitor_id,type,path,content_type,content_slug,campaign) VALUES ($1,$2,$3,$4,$5,$6)",
      [visitorId, d.kind === "demo" ? "demo_request" : "form_submit", d.landing_page ?? "/contact", ref.type, ref.slug, attrib.campaign]);
  }
  const result = await rescoreLead(lead.id);
  if (result && (result.stage === "high_intent" || result.stage === "sales_ready")) {
    await query("INSERT INTO alerts(rule_key, message, ref) VALUES ('high_intent_lead', $1, $2)", [`New ${result.stage.replace("_", " ")} lead: ${d.company || d.name} (score ${result.score})`, lead.id]);
  }
  if (d.kind === "demo") await query("INSERT INTO alerts(rule_key, message, ref) VALUES ('demo_request', $1, $2)", [`Demo request from ${d.company || d.name}`, lead.id]);

  void notifyN8n("lead-captured", { leadId: lead.id, name: d.name, email: d.email, company: d.company, kind: d.kind, marketingOptIn: d.marketing_opt_in, score: result?.score ?? 0, stage: result?.stage });
  return NextResponse.json({ ok: true });
}
