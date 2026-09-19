import { z } from "zod";

// Thin OpenAI Chat Completions client (fetch only — no SDK dependency). JSON-mode outputs are validated with zod.
export class AiNotConfigured extends Error {
  constructor() { super("OPENAI_API_KEY is not set. Add it to the server environment to enable AI features."); }
}

export const aiModel = () => process.env.OPENAI_MODEL || "gpt-4.1";

export async function chatJson<T>(system: string, user: string, schema: z.ZodType<T>, temperature = 0.4): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiNotConfigured();
  const res = await fetch(`${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: aiModel(), temperature, response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return schema.parse(JSON.parse(data.choices[0].message.content));
}

const BRAND_VOICE = `You write for Curiosbot Digital S.L., a Spain-based premium AI, PLM and Salesforce consultancy that advises senior executives (CEO, CIO, CTO, CDO, Chief AI Officer).
Voice: precise, confident, business-outcome-led, no hype, no buzzword stuffing, no invented statistics, no invented customers, no unverified partnership or certification claims.
If a fact is not in the input, do not state it. Use placeholders like [METRIC TO CONFIRM] instead of fabricating numbers.`;

const str = z.string().default("");
const pair = z.array(z.object({ title: str, description: str })).default([]);

export const productMarketingSchema = z.object({
  tagline: str, hero_copy: str, short_description: str, long_description: str,
  business_problem: str, solution: str, how_it_works: pair, capabilities: pair, benefits: pair, use_cases: pair,
  faq: z.array(z.object({ q: str, a: str })).default([]),
  seo_title: str, seo_description: str,
  linkedin_announcement: str, social_posts: z.array(z.string()).default([]), email_announcement: str, newsletter: str,
  ad_copy: z.array(z.object({ headline: str, description: str })).default([]),
  video_script: str, image_prompts: z.array(z.string()).default([]), sales_pitch: str, executive_summary: str,
});
export type ProductMarketing = z.infer<typeof productMarketingSchema>;

export async function generateProductMarketing(input: Record<string, string>) {
  return chatJson(
    `${BRAND_VOICE}\nReturn ONLY JSON with keys: ${Object.keys(productMarketingSchema.shape).join(", ")}. Arrays of {title,description} for how_it_works/capabilities/benefits/use_cases; faq is [{q,a}]; ad_copy is [{headline (<=30 chars),description (<=90 chars)}]; seo_title <=60 chars; seo_description <=155 chars.`,
    `Product input:\n${JSON.stringify(input, null, 2)}`, productMarketingSchema);
}

export const contentFactorySchema = z.object({
  article_title: str, article_md: str, executive_summary: str, linkedin_article: str, linkedin_post: str,
  social_posts: z.array(z.string()).default([]), newsletter: str, email: z.object({ subject: str, body: str }).default({ subject: "", body: "" }),
  seo: z.object({ title: str, description: str, keywords: z.array(z.string()).default([]) }).default({ title: "", description: "", keywords: [] }),
  ad_concepts: z.array(z.object({ concept: str, headline: str, description: str })).default([]),
  video_script: str, image_prompts: z.array(z.string()).default([]), cta: str,
});
export type ContentFactoryOutput = z.infer<typeof contentFactorySchema>;

export async function generateContent(input: Record<string, string>) {
  return chatJson(
    `${BRAND_VOICE}\nReturn ONLY JSON with keys: ${Object.keys(contentFactorySchema.shape).join(", ")}. article_md is Markdown, 700-1000 words, with a clear H2 structure, definitions of key terms, and an FAQ section when useful. Respect the requested audience, channel and tone.`,
    `Brief:\n${JSON.stringify(input, null, 2)}`, contentFactorySchema, 0.6);
}

// ───────── Numeric traceability guard (AI Marketing Analyst / Ask Curiosbot) ─────────
/** Extract every number-like token from text ("31%", "1,204", "12.5"). */
export function extractNumbers(text: string): number[] {
  return (text.match(/-?\d[\d,]*\.?\d*/g) ?? []).map((t) => Number(t.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
}

/** Flatten every number that exists in the data snapshot (plus rounded variants) so statements can be verified. */
export function snapshotNumbers(snapshot: unknown): Set<number> {
  const set = new Set<number>();
  const walk = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) {
      set.add(v); set.add(Math.round(v)); set.add(Math.round(v * 10) / 10); set.add(Math.round(v * 100) / 100); set.add(Math.abs(Math.round(v)));
    } else if (typeof v === "string") {
      for (const n of extractNumbers(v)) set.add(n);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(snapshot);
  return set;
}

/** Returns numbers in `text` that do not appear in the snapshot (small integers ≤ 12 are ignored: "3 articles", "top 5"). */
export function unverifiedNumbers(text: string, allowed: Set<number>): number[] {
  return extractNumbers(text).filter((n) => !(Math.abs(n) <= 12 && Number.isInteger(n)) && !allowed.has(n) && !allowed.has(Math.abs(n)));
}

export const analystSchema = z.object({
  insights: z.array(z.object({
    observation: z.string(),
    evidence: z.array(z.string()).default([]),        // snapshot field paths, e.g. "kpis.cur.visitors"
    possible_explanation: z.string(),
    recommended_experiment: z.string(),
    confidence: z.enum(["low", "medium", "high"]).default("low"),
  })).max(8),
  investigate_next: z.array(z.string()).default([]),
});
export type AnalystOutput = z.infer<typeof analystSchema>;

export async function runAnalyst(snapshot: unknown) {
  const raw = await chatJson(
    `You are the Curiosbot AI Marketing Analyst. You receive a JSON data snapshot from first-party analytics, leads, campaigns and (if connected) Search Console and ad platforms.
Rules (strict):
1. Every quantitative statement MUST use numbers present in the snapshot. Never estimate, extrapolate or invent a metric.
2. If data is missing, empty or null, say the data is unavailable — do not fill gaps.
3. Never present correlation as causation. "possible_explanation" must use hedged language (may, could, is consistent with).
4. Small sample sizes (under ~30 events) must be flagged as low confidence.
5. Each insight has: observation, evidence (dot-paths into the snapshot), possible_explanation, recommended_experiment (a concrete testable action), confidence.
Return ONLY JSON: {"insights":[...], "investigate_next":[...strings]}.`,
    `Snapshot:\n${JSON.stringify(snapshot)}`, analystSchema, 0.2);
  const allowed = snapshotNumbers(snapshot);
  const flagged: { index: number; numbers: number[] }[] = [];
  raw.insights.forEach((ins, index) => {
    const bad = unverifiedNumbers(`${ins.observation} ${ins.possible_explanation} ${ins.recommended_experiment}`, allowed);
    if (bad.length) flagged.push({ index, numbers: bad });
  });
  // Drop insights containing untraceable numbers rather than show them.
  const insights = raw.insights.filter((_, i) => !flagged.some((f) => f.index === i));
  return { ...raw, insights, dropped: flagged };
}
