import { query, one } from "./db";

// Pure detectors (unit tested) + a runner that applies them to real data and stores de-duplicated alerts.
export const detectSpike = (last24h: number, prevDailyAvg: number, multiple: number, minVolume = 20) => last24h >= minVolume && prevDailyAvg > 0 && last24h / prevDailyAvg >= multiple;
export const detectConversionDrop = (curRate: number, prevRate: number, curVisitors: number, prevVisitors: number, dropPct: number, minVisitors = 50) =>
  curVisitors >= minVisitors && prevVisitors >= minVisitors && prevRate > 0 && ((prevRate - curRate) / prevRate) * 100 >= dropPct;
export const detectTrending = (cur: number, prev: number, multiple: number, minViews = 20) => cur >= minViews && prev > 0 && cur / prev >= multiple;

interface Rule { key: string; enabled: boolean; threshold: string | null }

async function raise(ruleKey: string, message: string, ref: string) {
  const dup = await one("SELECT 1 FROM alerts WHERE rule_key=$1 AND ref=$2 AND created_at > now() - interval '24 hours'", [ruleKey, ref]);
  if (dup) return null;
  await query("INSERT INTO alerts(rule_key,message,ref) VALUES ($1,$2,$3)", [ruleKey, message, ref]);
  return { rule_key: ruleKey, message };
}

/** Evaluate all enabled rules. Returns only NEW alerts (for n8n to notify). Uses only real, consented first-party data. */
export async function evaluateAlerts() {
  const rules = new Map((await query<Rule>("SELECT key, enabled, threshold FROM alert_rules")).map((r) => [r.key, r]));
  const on = (k: string) => rules.get(k)?.enabled;
  const thr = (k: string, d: number) => Number(rules.get(k)?.threshold ?? d);
  const created: { rule_key: string; message: string }[] = [];
  const push = (x: { rule_key: string; message: string } | null) => { if (x) created.push(x); };

  if (on("traffic_spike")) {
    const r = await one<{ last24: string; prev_avg: string }>(
      `SELECT COUNT(DISTINCT visitor_id) FILTER (WHERE created_at > now() - interval '24 hours') last24,
              COUNT(*) FILTER (WHERE created_at <= now() - interval '24 hours') / 7.0 prev_avg
       FROM (SELECT DISTINCT visitor_id, date_trunc('day', created_at) d, MIN(created_at) created_at FROM events
             WHERE type='page_view' AND created_at > now() - interval '8 days' GROUP BY 1,2) x`);
    if (r && detectSpike(Number(r.last24), Number(r.prev_avg), thr("traffic_spike", 2))) push(await raise("traffic_spike", `Traffic spike: ${r.last24} visitors in the last 24h vs a ${Number(r.prev_avg).toFixed(1)}/day average over the previous 7 days.`, "24h"));
  }
  if (on("conversion_drop")) {
    const r = await one<{ cv: string; pv: string; cl: string; pl: string }>(
      `SELECT (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE type='page_view' AND created_at > now() - interval '7 days') cv,
              (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE type='page_view' AND created_at <= now() - interval '7 days' AND created_at > now() - interval '14 days') pv,
              (SELECT COUNT(*) FROM leads WHERE erased_at IS NULL AND created_at > now() - interval '7 days') cl,
              (SELECT COUNT(*) FROM leads WHERE erased_at IS NULL AND created_at <= now() - interval '7 days' AND created_at > now() - interval '14 days') pl`);
    if (r) {
      const cv = Number(r.cv), pv = Number(r.pv), cur = cv ? Number(r.cl) / cv : 0, prev = pv ? Number(r.pl) / pv : 0;
      if (detectConversionDrop(cur, prev, cv, pv, thr("conversion_drop", 30))) push(await raise("conversion_drop", `Lead conversion fell from ${(prev * 100).toFixed(2)}% to ${(cur * 100).toFixed(2)}% week over week (${cv} vs ${pv} visitors).`, "7d"));
    }
  }
  if (on("product_trending")) {
    const rows = await query<{ slug: string; cur: string; prev: string }>(
      `SELECT content_slug slug, COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') cur,
              COUNT(*) FILTER (WHERE created_at <= now() - interval '7 days') prev
       FROM events WHERE type='page_view' AND content_type='product' AND created_at > now() - interval '14 days' GROUP BY 1`);
    for (const p of rows) if (detectTrending(Number(p.cur), Number(p.prev), thr("product_trending", 2))) push(await raise("product_trending", `Product "${p.slug}" is trending: ${p.cur} views this week vs ${p.prev} last week.`, p.slug));
  }
  if (on("campaign_threshold") && rules.get("campaign_threshold")?.threshold) {
    const n = thr("campaign_threshold", 0);
    const rows = await query<{ campaign: string; leads: string }>("SELECT campaign, COUNT(*) leads FROM leads WHERE erased_at IS NULL AND campaign IS NOT NULL AND created_at > now() - interval '7 days' GROUP BY 1 HAVING COUNT(*) >= $1", [n]);
    for (const c of rows) push(await raise("campaign_threshold", `Campaign "${c.campaign}" reached ${c.leads} leads in 7 days (threshold ${n}).`, c.campaign));
  }
  return created;
}
