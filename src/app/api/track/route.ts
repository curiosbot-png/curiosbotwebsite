import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasDb, query } from "@/lib/db";
import { classifyPath } from "@/lib/content-map";

export const runtime = "nodejs";

const schema = z.object({
  vid: z.string().uuid(),
  type: z.enum(["page_view", "engaged", "scroll", "cta_click", "download"]),
  path: z.string().max(300).startsWith("/"),
  source: z.string().max(100).optional(), medium: z.string().max(100).optional(), campaign: z.string().max(150).optional(),
  value: z.number().min(0).max(100000).optional(),
  device: z.enum(["desktop", "mobile", "tablet"]).optional(),
  meta: z.record(z.string().max(100)).optional(),
});

function consentOf(req: NextRequest) {
  try { return JSON.parse(decodeURIComponent(req.cookies.get("cb_consent")?.value ?? "")) as { analytics?: boolean; marketing?: boolean }; } catch { return {}; }
}

export async function POST(req: NextRequest) {
  // Server-side consent enforcement: no analytics cookie consent → nothing stored.
  if (!consentOf(req).analytics) return new NextResponse(null, { status: 204 });
  if (!hasDb()) return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;
  const marketing = consentOf(req).marketing === true;

  // Cheap per-visitor throttle (visitor id only — no IP is stored for analytics).
  const hits = await query<{ hits: number }>(
    `INSERT INTO rate_limits(key, window_start, hits) VALUES ($1, date_trunc('minute', now()), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limits.hits + 1 RETURNING hits`, [`track:${d.vid}`]);
  if ((hits[0]?.hits ?? 1) > 60) return new NextResponse(null, { status: 429 });

  const ref = classifyPath(d.path);
  // Campaign/UTM attribution requires marketing consent; source/medium alone are treated as analytics.
  const campaign = marketing ? d.campaign ?? null : null;
  await query(
    `INSERT INTO visitors(id, first_source, first_medium, first_campaign, first_landing, device, country)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET last_seen = now()`,
    [d.vid, d.source ?? null, d.medium ?? null, campaign, d.path, d.device ?? null, req.headers.get("cf-ipcountry") ?? req.headers.get("x-country") ?? null]);
  await query(
    `INSERT INTO events(visitor_id, type, path, content_type, content_slug, theme, source, medium, campaign, value, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [d.vid, d.type, d.path, ref.type, ref.slug, ref.theme, d.source ?? null, d.medium ?? null, campaign, d.value ?? null, JSON.stringify(d.meta ?? {})]);
  return new NextResponse(null, { status: 204 });
}
