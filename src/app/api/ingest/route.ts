import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { bearerOk } from "@/lib/internal-auth";

export const runtime = "nodejs";

// Inbound endpoint for n8n (analytics ingestion, alerts, run logging). Auth: `Authorization: Bearer N8N_INGEST_SECRET` (n8n Header Auth credential)
// or an HMAC-SHA256 signature of the raw body in X-Curiosbot-Signature. The endpoint is also only reachable on the internal Docker network.
// Only pushes data that was genuinely fetched from an authorised platform; the app never fabricates external metrics.
const metric = z.object({ source: z.enum(["ga4", "gsc", "google_ads", "linkedin_ads", "meta_ads", "salesforce"]), metric_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dimension: z.string().max(60).default(""), dimension_value: z.string().max(500).default(""), metrics: z.record(z.union([z.number(), z.string()])) });
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("metrics"), rows: z.array(metric).max(5000) }),
  z.object({ type: z.literal("integration"), key: z.string().max(40), status: z.enum(["not_connected", "connected", "error"]), detail: z.record(z.any()).default({}) }),
  z.object({ type: z.literal("run"), workflow: z.string().max(80), status: z.enum(["success", "error", "pending_approval"]), detail: z.record(z.any()).default({}) }),
  z.object({ type: z.literal("alert"), rule_key: z.string().max(60), message: z.string().max(500), ref: z.string().max(100).optional() }),
]);

function validSignature(raw: string, sig: string | null) {
  const secret = process.env.N8N_INGEST_SECRET;
  if (!secret || !sig) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  let given: Buffer;
  try { given = Buffer.from(sig, "hex"); } catch { return false; }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 2_000_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (!bearerOk(req.headers.get("authorization"), process.env.N8N_INGEST_SECRET) && !validSignature(raw, req.headers.get("x-curiosbot-signature"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "invalid", issues: p.error.issues.slice(0, 5) }, { status: 400 });
  const d = p.data;
  if (d.type === "metrics") {
    for (const r of d.rows) {
      await query(`INSERT INTO external_metrics(source,metric_date,dimension,dimension_value,metrics) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (source,metric_date,dimension,dimension_value) DO UPDATE SET metrics=EXCLUDED.metrics, ingested_at=now()`, [r.source, r.metric_date, r.dimension, r.dimension_value, JSON.stringify(r.metrics)]);
    }
    const sources = [...new Set(d.rows.map((r) => r.source))];
    for (const s of sources) await query("UPDATE integrations SET status='connected', last_sync_at=now() WHERE key=$1", [s]);
    return NextResponse.json({ ok: true, rows: d.rows.length });
  }
  if (d.type === "integration") await query("UPDATE integrations SET status=$2, detail=$3, last_sync_at=now() WHERE key=$1", [d.key, d.status, JSON.stringify(d.detail)]);
  if (d.type === "run") {
    await query("INSERT INTO automation_runs(workflow,status,detail) VALUES ($1,$2,$3)", [d.workflow, d.status, JSON.stringify(d.detail)]);
    if (d.status === "error") await query("INSERT INTO alerts(rule_key,message,ref) VALUES ('automation_failure',$1,$2)", [`Workflow failed: ${d.workflow}`, d.workflow]);
  }
  if (d.type === "alert") await query("INSERT INTO alerts(rule_key,message,ref) VALUES ($1,$2,$3)", [d.rule_key, d.message, d.ref ?? null]);
  return NextResponse.json({ ok: true });
}
