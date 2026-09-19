import { query, one } from "./db";

// All figures come from first-party, consented events + leads in PostgreSQL, or from
// external_metrics rows pushed by n8n from connected platforms. Nothing is estimated or fabricated.

export type Period = "7d" | "30d" | "90d" | "year" | "custom";
export interface Range { from: Date; to: Date; prevFrom: Date; prevTo: Date; label: string }
export interface Filters { campaign?: string; source?: string; device?: string; country?: string; path?: string }

export function resolveRange(period: string | undefined, from?: string, to?: string): Range {
  const now = new Date();
  let end = now;
  let start: Date;
  if (period === "custom" && from && to && !isNaN(Date.parse(from)) && !isNaN(Date.parse(to))) {
    start = new Date(from);
    end = new Date(new Date(to).getTime() + 86_400_000 - 1);
  } else {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "year" ? 365 : 30;
    start = new Date(now.getTime() - days * 86_400_000);
  }
  const span = end.getTime() - start.getTime();
  return { from: start, to: end, prevFrom: new Date(start.getTime() - span), prevTo: start, label: period ?? "30d" };
}

export const pctChange = (cur: number, prev: number): number | null => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / prev) * 100);

/** SQL fragment mapping (source, medium) to a channel label. */
export const CHANNEL_SQL = (s: string, m: string) => `(CASE
  WHEN ${s} IS NULL OR ${s} = '' OR ${s} = '(direct)' THEN 'Direct'
  WHEN ${m} IN ('cpc','ppc','paid','paidsearch') AND ${s} ILIKE '%google%' THEN 'Google Ads'
  WHEN ${s} ILIKE '%linkedin%' THEN 'LinkedIn'
  WHEN ${m} = 'email' THEN 'Email'
  WHEN ${m} = 'organic' OR ${s} ILIKE ANY (ARRAY['google','bing','duckduckgo','ecosia','yahoo']) THEN 'Organic Search'
  WHEN ${m} IN ('social','social-network') OR ${s} ILIKE ANY (ARRAY['facebook','instagram','youtube','x','twitter']) THEN 'Social'
  ELSE 'Referral' END)`;

function eventFilter(f: Filters, startIdx: number): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  const add = (col: string, v?: string) => { if (v) { params.push(v); parts.push(`${col} = $${startIdx + params.length - 1}`); } };
  add("e.campaign", f.campaign); add("e.source", f.source); add("v.device", f.device); add("v.country", f.country); add("e.path", f.path);
  return { sql: parts.length ? " AND " + parts.join(" AND ") : "", params };
}

export interface Kpis {
  visitors: number; pageViews: number; engagedVisitors: number; newLeads: number;
  qualifiedLeads: number; demoRequests: number; leadConversionRate: number; marketingLeads: number;
}

async function kpiFor(from: Date, to: Date, f: Filters): Promise<Kpis> {
  const ef = eventFilter(f, 3);
  // Engaged visitor = 15+ seconds active OR 2+ page views (identical to the funnel definition).
  const ev = await one<{ visitors: string; page_views: string; engaged: string }>(
    `WITH per AS (
       SELECT e.visitor_id, COUNT(*) FILTER (WHERE e.type='page_view') pv, BOOL_OR(e.type='engaged') eng
       FROM events e JOIN visitors v ON v.id = e.visitor_id
       WHERE e.created_at >= $1 AND e.created_at < $2 ${ef.sql}
       GROUP BY e.visitor_id)
     SELECT COUNT(*) FILTER (WHERE pv>0) AS visitors, COALESCE(SUM(pv),0) AS page_views, COUNT(*) FILTER (WHERE eng OR pv>=2) AS engaged FROM per`, [from, to, ...ef.params]);
  const ld = await one<{ n: string; q: string; d: string; m: string }>(
    `SELECT COUNT(*) n,
            COUNT(*) FILTER (WHERE stage IN ('high_intent','sales_ready')) q,
            COUNT(*) FILTER (WHERE kind='demo') d,
            COUNT(*) FILTER (WHERE campaign IS NOT NULL OR utm_medium IN ('cpc','paid','email','social')) m
     FROM leads WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2
       AND ($3::text IS NULL OR campaign = $3) AND ($4::text IS NULL OR original_source = $4)`,
    [from, to, f.campaign ?? null, f.source ?? null]);
  const visitors = Number(ev?.visitors ?? 0);
  const newLeads = Number(ld?.n ?? 0);
  return {
    visitors, pageViews: Number(ev?.page_views ?? 0), engagedVisitors: Number(ev?.engaged ?? 0),
    newLeads, qualifiedLeads: Number(ld?.q ?? 0), demoRequests: Number(ld?.d ?? 0),
    leadConversionRate: visitors ? (newLeads / visitors) * 100 : 0, marketingLeads: Number(ld?.m ?? 0),
  };
}

export async function getKpis(r: Range, f: Filters = {}) {
  const [cur, prev] = await Promise.all([kpiFor(r.from, r.to, f), kpiFor(r.prevFrom, r.prevTo, f)]);
  return { cur, prev };
}

export interface FunnelStage { key: string; label: string; count: number; stageConv: number | null; dropOff: number | null; prevCount: number }

async function funnelCounts(from: Date, to: Date, f: Filters): Promise<number[]> {
  const ef = eventFilter(f, 3);
  const ev = await one<{ visitors: string; engaged: string; high: string }>(
    `WITH per AS (
       SELECT e.visitor_id,
              COUNT(*) FILTER (WHERE e.type='page_view') pv,
              BOOL_OR(e.type='engaged') eng,
              BOOL_OR(e.type IN ('cta_click','download')) act
       FROM events e JOIN visitors v ON v.id=e.visitor_id
       WHERE e.created_at >= $1 AND e.created_at < $2 ${ef.sql}
       GROUP BY e.visitor_id)
     SELECT COUNT(*) FILTER (WHERE pv>0) visitors,
            COUNT(*) FILTER (WHERE eng OR pv>=2) engaged,
            COUNT(*) FILTER (WHERE act OR pv>=4) high FROM per`, [from, to, ...ef.params]);
  const ld = await one<{ leads: string; q: string; d: string; o: string; c: string }>(
    `SELECT COUNT(*) leads,
            COUNT(*) FILTER (WHERE stage IN ('high_intent','sales_ready') OR status IN ('qualified','opportunity','customer')) q,
            COUNT(*) FILTER (WHERE kind IN ('demo','consultation')) d,
            COUNT(*) FILTER (WHERE status IN ('opportunity','customer')) o,
            COUNT(*) FILTER (WHERE status='customer') c
     FROM leads WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2
       AND ($3::text IS NULL OR campaign = $3) AND ($4::text IS NULL OR original_source = $4)`,
    [from, to, f.campaign ?? null, f.source ?? null]);
  return [ev?.visitors, ev?.engaged, ev?.high, ld?.leads, ld?.q, ld?.d, ld?.o, ld?.c].map((x) => Number(x ?? 0));
}

const FUNNEL_LABELS: [string, string][] = [
  ["visitors", "Visitors"], ["engaged", "Engaged visitors"], ["high_intent", "High-intent visitors"], ["leads", "Leads"],
  ["qualified", "Qualified leads"], ["demo", "Demo / consultation requests"], ["opps", "Opportunities"], ["customers", "Customers"],
];

export async function getFunnel(r: Range, f: Filters = {}): Promise<FunnelStage[]> {
  const [cur, prev] = await Promise.all([funnelCounts(r.from, r.to, f), funnelCounts(r.prevFrom, r.prevTo, f)]);
  return FUNNEL_LABELS.map(([key, label], i) => ({
    key, label, count: cur[i], prevCount: prev[i],
    stageConv: i === 0 ? null : cur[i - 1] ? (cur[i] / cur[i - 1]) * 100 : null,
    dropOff: i === 0 ? null : cur[i - 1] ? Math.max(0, 100 - (cur[i] / cur[i - 1]) * 100) : null,
  }));
}

export async function getContentPerformance(r: Range, sort: string) {
  const rows = await query<{ content_type: string; content_slug: string; path: string; views: string; uniques: string; avg_engaged: string | null; avg_scroll: string | null; cta_clicks: string; leads: string; demos: string; prev_views: string }>(
    `SELECT e.content_type, e.content_slug, MIN(e.path) path,
        COUNT(*) FILTER (WHERE e.type='page_view' AND e.created_at >= $1 AND e.created_at < $2) views,
        COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.type='page_view' AND e.created_at >= $1 AND e.created_at < $2) uniques,
        AVG(e.value) FILTER (WHERE e.type='engaged' AND e.created_at >= $1 AND e.created_at < $2) avg_engaged,
        AVG(e.value) FILTER (WHERE e.type='scroll' AND e.created_at >= $1 AND e.created_at < $2) avg_scroll,
        COUNT(*) FILTER (WHERE e.type='cta_click' AND e.created_at >= $1 AND e.created_at < $2) cta_clicks,
        COUNT(*) FILTER (WHERE e.type IN ('form_submit','demo_request') AND e.created_at >= $1 AND e.created_at < $2) leads,
        COUNT(*) FILTER (WHERE e.type='demo_request' AND e.created_at >= $1 AND e.created_at < $2) demos,
        COUNT(*) FILTER (WHERE e.type='page_view' AND e.created_at >= $3 AND e.created_at < $1) prev_views
     FROM events e
     WHERE e.content_type IS NOT NULL AND e.content_slug IS NOT NULL AND e.created_at >= $3 AND e.created_at < $2
     GROUP BY e.content_type, e.content_slug`, [r.from, r.to, r.prevFrom]);
  const items = rows.map((x) => {
    const views = Number(x.views); const leads = Number(x.leads);
    return {
      type: x.content_type, slug: x.content_slug, path: x.path, views, uniques: Number(x.uniques),
      avgEngagedSec: x.avg_engaged === null ? null : Number(x.avg_engaged),
      avgScrollPct: x.avg_scroll === null ? null : Number(x.avg_scroll),
      ctaClicks: Number(x.cta_clicks), leads, demos: Number(x.demos),
      conversion: views ? (leads / views) * 100 : 0,
      trend: pctChange(views, Number(x.prev_views)),
    };
  }).filter((x) => x.views > 0 || x.leads > 0);
  const keyFn: Record<string, (x: (typeof items)[number]) => number> = {
    viewed: (x) => x.views, trending: (x) => x.trend ?? -Infinity, engagement: (x) => x.avgEngagedSec ?? 0,
    leads: (x) => x.leads, conversion: (x) => x.conversion, demos: (x) => x.demos,
  };
  const fn = keyFn[sort] ?? keyFn.viewed;
  return items.sort((a, b) => fn(b) - fn(a));
}

/** "What people care about": a weighted aggregate, deliberately NOT raw page views. */
const WEIGHTS = { page_view: 1, engaged: 3, cta_click: 5, download: 8, form_submit: 15, demo_request: 20 } as const;

export async function getInterestThemes(r: Range) {
  const themes = await query<{ key: string; label: string; path_prefixes: string[] }>("SELECT key,label,path_prefixes FROM interest_themes ORDER BY sort");
  const rows = await query<{ theme_key: string; day: string; type: string; visitors: string; events: string }>(
    `SELECT t.key theme_key, to_char(date_trunc('day', e.created_at),'YYYY-MM-DD') AS day, e.type,
            COUNT(DISTINCT e.visitor_id) visitors, COUNT(*) events
     FROM events e JOIN interest_themes t
       ON (e.theme = t.key OR EXISTS (SELECT 1 FROM unnest(t.path_prefixes) p WHERE e.path LIKE p || '%'))
     WHERE e.created_at >= $1 AND e.created_at < $2
     GROUP BY 1,2,3`, [r.prevFrom, r.to]);
  const repeat = await query<{ theme_key: string; n: string }>(
    `SELECT theme_key, COUNT(*) n FROM (
       SELECT t.key theme_key, e.visitor_id FROM events e JOIN interest_themes t
         ON (e.theme = t.key OR EXISTS (SELECT 1 FROM unnest(t.path_prefixes) p WHERE e.path LIKE p || '%'))
       WHERE e.type='page_view' AND e.created_at >= $1 AND e.created_at < $2
       GROUP BY 1,2 HAVING COUNT(DISTINCT date_trunc('day', e.created_at)) > 1) s GROUP BY 1`, [r.from, r.to]);
  const repeatMap = new Map(repeat.map((x) => [x.theme_key, Number(x.n)]));
  return themes.map((t) => {
    const mine = rows.filter((x) => x.theme_key === t.key);
    const inCur = mine.filter((x) => new Date(x.day) >= new Date(r.from.toISOString().slice(0, 10)));
    const inPrev = mine.filter((x) => new Date(x.day) < new Date(r.from.toISOString().slice(0, 10)));
    const w = (arr: typeof mine) => arr.reduce((s, x) => s + Number(x.events) * (WEIGHTS[x.type as keyof typeof WEIGHTS] ?? 0), 0);
    const repeatBonus = (repeatMap.get(t.key) ?? 0) * 5;
    const interest = w(inCur) + repeatBonus;
    const byDay = new Map<string, number>();
    for (const x of inCur) byDay.set(x.day, (byDay.get(x.day) ?? 0) + Number(x.events) * (WEIGHTS[x.type as keyof typeof WEIGHTS] ?? 0));
    return {
      key: t.key, label: t.label, interest, prevInterest: w(inPrev), change: pctChange(interest, w(inPrev)),
      views: inCur.filter((x) => x.type === "page_view").reduce((s, x) => s + Number(x.events), 0),
      ctaClicks: inCur.filter((x) => x.type === "cta_click").reduce((s, x) => s + Number(x.events), 0),
      repeatVisitors: repeatMap.get(t.key) ?? 0,
      series: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => ({ day, value })),
    };
  }).sort((a, b) => b.interest - a.interest);
}

export async function getAcquisition(r: Range) {
  const ch = CHANNEL_SQL("e.source", "e.medium");
  const traffic = await query<{ channel: string; visitors: string; engaged: string }>(
    `SELECT ${ch} channel, COUNT(DISTINCT e.visitor_id) visitors,
            COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.type='engaged') engaged
     FROM events e WHERE e.created_at >= $1 AND e.created_at < $2 GROUP BY 1`, [r.from, r.to]);
  const lch = CHANNEL_SQL("original_source", "utm_medium");
  const leads = await query<{ channel: string; leads: string; qualified: string; demos: string }>(
    `SELECT ${lch} channel, COUNT(*) leads,
            COUNT(*) FILTER (WHERE stage IN ('high_intent','sales_ready')) qualified,
            COUNT(*) FILTER (WHERE kind='demo') demos
     FROM leads WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2 GROUP BY 1`, [r.from, r.to]);
  const spend = await query<{ source: string; spend: string | null; clicks: string | null }>(
    `SELECT source, SUM((metrics->>'spend')::numeric) spend, SUM((metrics->>'clicks')::numeric) clicks
     FROM external_metrics WHERE source IN ('google_ads','linkedin_ads','meta_ads') AND metric_date >= $1 AND metric_date < $2 GROUP BY source`, [r.from, r.to]);
  const spendByChannel: Record<string, { spend: number; clicks: number }> = {};
  for (const s of spend) {
    const name = s.source === "google_ads" ? "Google Ads" : s.source === "linkedin_ads" ? "LinkedIn" : "Social";
    spendByChannel[name] = { spend: Number(s.spend ?? 0), clicks: Number(s.clicks ?? 0) };
  }
  const names = ["Organic Search", "Direct", "LinkedIn", "Google Ads", "Email", "Referral", "Social"];
  return names.map((name) => {
    const t = traffic.find((x) => x.channel === name); const l = leads.find((x) => x.channel === name);
    const visitors = Number(t?.visitors ?? 0); const nLeads = Number(l?.leads ?? 0); const qual = Number(l?.qualified ?? 0); const demos = Number(l?.demos ?? 0);
    const sp = spendByChannel[name];
    return {
      channel: name, visitors, engaged: Number(t?.engaged ?? 0), leads: nLeads, qualified: qual, demos,
      conversion: visitors ? (nLeads / visitors) * 100 : 0,
      // Cost metrics are null unless an ad platform is connected and has synced.
      spend: sp?.spend ?? null, cpc: sp && sp.clicks ? sp.spend / sp.clicks : null,
      cpl: sp && nLeads ? sp.spend / nLeads : null, costPerQualified: sp && qual ? sp.spend / qual : null, costPerDemo: sp && demos ? sp.spend / demos : null,
    };
  });
}

export async function getCampaigns(r: Range) {
  const rows = await query<{ campaign: string; visits: string; engaged: string; leads: string; qualified: string; demos: string; opps: string }>(
    `WITH ev AS (
       SELECT e.campaign, COUNT(DISTINCT e.visitor_id) visits, COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.type='engaged') engaged
       FROM events e WHERE e.campaign IS NOT NULL AND e.created_at >= $1 AND e.created_at < $2 GROUP BY 1),
     ld AS (
       SELECT campaign, COUNT(*) leads, COUNT(*) FILTER (WHERE stage IN ('high_intent','sales_ready')) qualified,
              COUNT(*) FILTER (WHERE kind='demo') demos, COUNT(*) FILTER (WHERE status IN ('opportunity','customer')) opps
       FROM leads WHERE erased_at IS NULL AND campaign IS NOT NULL AND created_at >= $1 AND created_at < $2 GROUP BY 1)
     SELECT COALESCE(ev.campaign, ld.campaign) campaign, COALESCE(visits,0) visits, COALESCE(engaged,0) engaged,
            COALESCE(leads,0) leads, COALESCE(qualified,0) qualified, COALESCE(demos,0) demos, COALESCE(opps,0) opps
     FROM ev FULL JOIN ld ON ev.campaign = ld.campaign ORDER BY leads DESC, visits DESC`, [r.from, r.to]);
  const ext = await query<{ dimension_value: string; impressions: string | null; clicks: string | null; spend: string | null }>(
    `SELECT dimension_value, SUM((metrics->>'impressions')::numeric) impressions, SUM((metrics->>'clicks')::numeric) clicks, SUM((metrics->>'spend')::numeric) spend
     FROM external_metrics WHERE dimension='campaign' AND metric_date >= $1 AND metric_date < $2 GROUP BY 1`, [r.from, r.to]);
  return rows.map((x) => {
    const e = ext.find((y) => y.dimension_value === x.campaign);
    const visits = Number(x.visits); const leads = Number(x.leads);
    return {
      campaign: x.campaign, visits, engaged: Number(x.engaged), leads, qualified: Number(x.qualified), demos: Number(x.demos), opportunities: Number(x.opps),
      conversion: visits ? (leads / visits) * 100 : 0,
      impressions: e?.impressions == null ? null : Number(e.impressions), clicks: e?.clicks == null ? null : Number(e.clicks), spend: e?.spend == null ? null : Number(e.spend),
    };
  });
}

/** First-touch / last-touch / assisted attribution of content to leads (correlational, not causal). */
export async function getAttribution(r: Range) {
  return query<{ content_type: string; content_slug: string; first_touch: string; last_touch: string; assisted: string }>(
    `WITH lead_events AS (
       SELECT l.id lead_id, e.content_type, e.content_slug, e.created_at,
              ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY e.created_at ASC) rn_first,
              ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY e.created_at DESC) rn_last
       FROM leads l JOIN events e ON e.visitor_id = l.visitor_id AND e.created_at <= l.created_at
       WHERE l.erased_at IS NULL AND l.created_at >= $1 AND l.created_at < $2
         AND e.type='page_view' AND e.content_slug IS NOT NULL)
     SELECT content_type, content_slug,
            COUNT(*) FILTER (WHERE rn_first=1) first_touch,
            COUNT(*) FILTER (WHERE rn_last=1) last_touch,
            COUNT(DISTINCT lead_id) assisted
     FROM lead_events GROUP BY 1,2 ORDER BY assisted DESC LIMIT 50`, [r.from, r.to]);
}

export async function getProductIntel(r: Range) {
  const rows = await query<{ slug: string; name: string; views: string; uniques: string; repeat: string; engaged: string; cta: string; demos: string; leads: string; prev: string }>(
    `SELECT p.slug, p.name,
       COUNT(e.*) FILTER (WHERE e.type='page_view' AND e.created_at >= $1 AND e.created_at < $2) views,
       COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.type='page_view' AND e.created_at >= $1 AND e.created_at < $2) uniques,
       (SELECT COUNT(*) FROM (SELECT visitor_id FROM events x WHERE x.content_type='product' AND x.content_slug=p.slug AND x.type='page_view'
          AND x.created_at >= $1 AND x.created_at < $2 GROUP BY visitor_id HAVING COUNT(DISTINCT date_trunc('day',x.created_at))>1) s) repeat,
       COUNT(e.*) FILTER (WHERE e.type='engaged' AND e.created_at >= $1 AND e.created_at < $2) engaged,
       COUNT(e.*) FILTER (WHERE e.type='cta_click' AND e.created_at >= $1 AND e.created_at < $2) cta,
       COUNT(e.*) FILTER (WHERE e.type='demo_request' AND e.created_at >= $1 AND e.created_at < $2) demos,
       COUNT(e.*) FILTER (WHERE e.type IN ('form_submit','demo_request') AND e.created_at >= $1 AND e.created_at < $2) leads,
       COUNT(e.*) FILTER (WHERE e.type='page_view' AND e.created_at >= $3 AND e.created_at < $1) prev
     FROM products p LEFT JOIN events e ON e.content_type='product' AND e.content_slug = p.slug
     WHERE p.status <> 'archived' GROUP BY p.slug, p.name`, [r.from, r.to, r.prevFrom]);
  return rows.map((x) => ({
    slug: x.slug, name: x.name, views: Number(x.views), uniques: Number(x.uniques), repeat: Number(x.repeat), engaged: Number(x.engaged),
    cta: Number(x.cta), demos: Number(x.demos), leads: Number(x.leads), trend: pctChange(Number(x.views), Number(x.prev)),
  }));
}

export async function getAudience(r: Range) {
  const dim = async (col: string) => query<{ label: string; leads: string; qualified: string; demos: string }>(
    `SELECT COALESCE(NULLIF(${col},''),'Not provided') label, COUNT(*) leads,
            COUNT(*) FILTER (WHERE stage IN ('high_intent','sales_ready')) qualified, COUNT(*) FILTER (WHERE kind='demo') demos
     FROM leads WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY leads DESC LIMIT 12`, [r.from, r.to]);
  const [industry, size, country, role, service, product] = await Promise.all([
    dim("industry"), dim("company_size"), dim("country"), dim("job_title"), dim("service_interest"), dim("product_interest")]);
  const map = (rows: typeof industry) => rows.map((x) => ({ label: x.label, leads: Number(x.leads), qualified: Number(x.qualified), demos: Number(x.demos) }));
  return { industry: map(industry), companySize: map(size), country: map(country), jobTitle: map(role), service: map(service), product: map(product) };
}

export async function getSearchConsole(r: Range) {
  const rows = await query<{ dimension: string; q: string; impressions: string; clicks: string; pos: string; cur_clicks: string; prev_clicks: string }>(
    `SELECT dimension, dimension_value q,
       SUM((metrics->>'impressions')::numeric) FILTER (WHERE metric_date >= $1 AND metric_date < $2) impressions,
       SUM((metrics->>'clicks')::numeric) FILTER (WHERE metric_date >= $1 AND metric_date < $2) clicks,
       AVG((metrics->>'position')::numeric) FILTER (WHERE metric_date >= $1 AND metric_date < $2) pos,
       SUM((metrics->>'clicks')::numeric) FILTER (WHERE metric_date >= $1 AND metric_date < $2) cur_clicks,
       SUM((metrics->>'clicks')::numeric) FILTER (WHERE metric_date >= $3 AND metric_date < $1) prev_clicks
     FROM external_metrics WHERE source='gsc' AND dimension IN ('query','page') AND metric_date >= $3 AND metric_date < $2
     GROUP BY dimension, dimension_value`, [r.from, r.to, r.prevFrom]);
  const items = rows.map((x) => {
    const imp = Number(x.impressions ?? 0), clicks = Number(x.clicks ?? 0);
    return { dimension: x.dimension, value: x.q, impressions: imp, clicks, ctr: imp ? (clicks / imp) * 100 : 0, position: Number(x.pos ?? 0),
      change: pctChange(Number(x.cur_clicks ?? 0), Number(x.prev_clicks ?? 0)) };
  });
  const queries = items.filter((x) => x.dimension === "query");
  return {
    connected: rows.length > 0,
    queries: queries.sort((a, b) => b.clicks - a.clicks).slice(0, 25),
    pages: items.filter((x) => x.dimension === "page").sort((a, b) => b.clicks - a.clicks).slice(0, 15),
    rising: queries.filter((x) => (x.change ?? 0) > 20 && x.clicks > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 8),
    declining: queries.filter((x) => x.change !== null && x.change < -20).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 8),
    // Opportunity heuristic: many impressions, weak CTR, average position 4–15
    opportunities: queries.filter((x) => x.impressions >= 50 && x.ctr < 3 && x.position >= 4 && x.position <= 15).sort((a, b) => b.impressions - a.impressions).slice(0, 8),
  };
}

export async function getDailyVisitors(r: Range) {
  const rows = await query<{ day: string; visitors: string }>(
    `SELECT to_char(d.day,'YYYY-MM-DD') AS day, COUNT(DISTINCT e.visitor_id) visitors
     FROM generate_series(date_trunc('day',$1::timestamptz), date_trunc('day',$2::timestamptz), interval '1 day') d(day)
     LEFT JOIN events e ON e.type='page_view' AND e.created_at >= d.day AND e.created_at < d.day + interval '1 day'
     GROUP BY d.day ORDER BY d.day`, [r.from, r.to]);
  return rows.map((x) => ({ day: x.day, value: Number(x.visitors) }));
}

export async function getTopLeads(r: Range, limit = 8) {
  return query<{ id: string; name: string; company: string | null; score: number; stage: string; kind: string; created_at: Date }>(
    "SELECT id,name,company,score,stage,kind,created_at FROM leads WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2 ORDER BY score DESC, created_at DESC LIMIT $3", [r.from, r.to, limit]);
}

/** Deterministic "what to investigate next" prompts derived only from computed data (no AI, no invention). */
export function investigateNext(kpis: { cur: Kpis; prev: Kpis }, funnel: FunnelStage[], themes: { label: string; change: number | null; interest: number }[]): string[] {
  const out: string[] = [];
  const keys: [keyof Kpis, string][] = [["visitors", "Visitors"], ["engagedVisitors", "Engaged visitors"], ["newLeads", "New leads"], ["leadConversionRate", "Lead conversion rate"]];
  for (const [k, label] of keys) {
    const ch = pctChange(kpis.cur[k], kpis.prev[k]);
    if (ch !== null && ch <= -20 && kpis.prev[k] > 0) out.push(`${label} fell ${Math.abs(ch).toFixed(1)}% versus the previous period — check acquisition sources and recent content changes.`);
  }
  const worst = funnel.filter((s) => s.dropOff !== null && funnel[funnel.indexOf(s) - 1]?.count >= 10).sort((a, b) => (b.dropOff ?? 0) - (a.dropOff ?? 0))[0];
  if (worst) out.push(`Largest funnel drop-off: ${worst.label} (${worst.dropOff!.toFixed(0)}% lost from the previous stage).`);
  const rising = themes.filter((t) => t.change !== null && t.change >= 25 && t.interest > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0))[0];
  if (rising) out.push(`Interest in "${rising.label}" rose ${rising.change!.toFixed(0)}% — consider new content or a CTA for this theme.`);
  if (!out.length) out.push("No significant changes detected in this period, or not enough data yet.");
  return out;
}
