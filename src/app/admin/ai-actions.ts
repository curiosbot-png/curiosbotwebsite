"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, rateLimit, requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { AiNotConfigured, aiModel, generateContent, generateProductMarketing, runAnalyst } from "@/lib/ai";
import { askCuriosbot, buildSnapshot } from "@/lib/analyst-data";
import { resolveRange } from "@/lib/analytics";
import { parseLike } from "@/lib/genedit";
import { ah } from "@/lib/admin-nav";
import { notifyN8n } from "@/lib/leads";

const back = (path: string, error: string): never => redirect(`${ah(path)}?error=${encodeURIComponent(error)}`);
const msg = (e: unknown) => (e instanceof AiNotConfigured ? e.message : `Generation failed: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";

async function throttle(userId: string) {
  if (!(await rateLimit(`ai:${userId}`, 30, 3600))) back("/ai-studio", "AI usage limit reached for this hour.");
}

// ───────── AI Product Creator ─────────
export async function generateProductAction(fd: FormData) {
  const u = await requireUser();
  await throttle(u.id);
  const input = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(10).max(3000), target_customer: z.string().trim().max(500).default(""), industry: z.string().trim().max(200).default(""), problem: z.string().trim().max(3000).default(""), features: z.string().trim().max(4000).default(""), notes: z.string().trim().max(6000).default("") }).safeParse(Object.fromEntries(fd));
  if (!input.success) return back("/ai-studio/product", "Please provide at least a product name and a description (10+ characters).");
  let id: string;
  try {
    const output = await generateProductMarketing(input.data);
    id = (await one<{ id: string }>("INSERT INTO ai_generations(kind,input,output,model,created_by) VALUES ('product_marketing',$1,$2,$3,$4) RETURNING id", [JSON.stringify(input.data), JSON.stringify(output), aiModel(), u.id]))!.id;
  } catch (e) { return back("/ai-studio/product", msg(e)); }
  await audit(u.id, "ai_generate_product", "ai_generation", id);
  redirect(ah(`/ai-studio/generations/${id}`));
}

// ───────── AI Content Factory ─────────
export async function generateContentAction(fd: FormData) {
  const u = await requireUser();
  await throttle(u.id);
  const input = z.object({ topic: z.string().trim().min(3).max(1000), audience: z.string().trim().max(200).default("CIOs and CTOs"), channel: z.string().trim().max(100).default("Website + LinkedIn"), tone: z.string().trim().max(100).default("Authoritative, practical"), campaign: z.string().trim().max(150).default(""), product: z.string().trim().max(150).default(""), service: z.string().trim().max(150).default(""), notes: z.string().trim().max(4000).default("") }).safeParse(Object.fromEntries(fd));
  if (!input.success) return back("/ai-studio/content", "Please enter an idea or topic.");
  let id: string;
  try {
    const output = await generateContent(input.data);
    id = (await one<{ id: string }>("INSERT INTO ai_generations(kind,input,output,model,created_by) VALUES ('content_factory',$1,$2,$3,$4) RETURNING id", [JSON.stringify(input.data), JSON.stringify(output), aiModel(), u.id]))!.id;
  } catch (e) { return back("/ai-studio/content", msg(e)); }
  await audit(u.id, "ai_generate_content", "ai_generation", id);
  redirect(ah(`/ai-studio/generations/${id}`));
}

// ───────── Generation review workflow: PREVIEW → EDIT → APPROVE → (create draft) → publish via normal workflow ─────────
export async function saveGenerationEdits(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const gen = await one<{ output: Record<string, unknown>; status: string }>("SELECT output, status FROM ai_generations WHERE id=$1", [id]);
  if (!gen || gen.status === "published") return;
  const out: Record<string, unknown> = { ...gen.output };
  for (const k of Object.keys(gen.output)) { const t = fd.get(`f_${k}`); if (typeof t === "string") out[k] = parseLike(gen.output[k], t); }
  await query("UPDATE ai_generations SET output=$2, status='draft', approved_by=NULL WHERE id=$1", [id, JSON.stringify(out)]);
  await audit(u.id, "ai_edit", "ai_generation", id);
  revalidatePath(ah(`/ai-studio/generations/${id}`));
}

export async function approveGeneration(fd: FormData) {
  const u = await requireUser(["admin"]);
  const id = z.string().uuid().parse(fd.get("id"));
  await query("UPDATE ai_generations SET status='approved', approved_by=$2 WHERE id=$1 AND status='draft'", [id, u.id]);
  await audit(u.id, "ai_approve", "ai_generation", id);
  revalidatePath(ah(`/ai-studio/generations/${id}`));
}

async function uniqueSlug(table: "products" | "insights", base: string) {
  let s = base, n = 2;
  while (await one(`SELECT 1 FROM ${table} WHERE slug=$1`, [s])) s = `${base}-${n++}`;
  return s;
}

/** Turns an approved product generation into a DRAFT product. It is never published automatically. */
export async function createProductDraft(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const g = await one<{ input: { name: string }; output: Record<string, any>; status: string }>("SELECT input, output, status FROM ai_generations WHERE id=$1 AND kind='product_marketing'", [id]);
  if (!g) return;
  if (g.status !== "approved") return back(`/ai-studio/generations/${id}`, "Approve the generation before creating a product draft.");
  const o = g.output;
  const slug = await uniqueSlug("products", slugify(g.input.name));
  const p = await one<{ id: string }>(`INSERT INTO products(name,slug,tagline,short_description,long_description,business_problem,solution,features,benefits,use_cases,how_it_works,faq,seo_title,seo_description,created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [g.input.name, slug, o.tagline || null, o.short_description || null, o.long_description || null, o.business_problem || null, o.solution || null, JSON.stringify(o.capabilities ?? []), JSON.stringify(o.benefits ?? []), JSON.stringify(o.use_cases ?? []), JSON.stringify(o.how_it_works ?? []), JSON.stringify(o.faq ?? []), o.seo_title || null, o.seo_description || null, u.id]);
  await query("UPDATE ai_generations SET product_id=$2 WHERE id=$1", [id, p!.id]);
  await audit(u.id, "ai_create_product_draft", "product", p!.id);
  void notifyN8n("product-created", { productId: p!.id, name: g.input.name, slug });
  redirect(ah(`/products/${p!.id}`));
}

export async function createInsightDraft(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const g = await one<{ output: Record<string, any>; status: string }>("SELECT output, status FROM ai_generations WHERE id=$1 AND kind='content_factory'", [id]);
  if (!g) return;
  if (g.status !== "approved") return back(`/ai-studio/generations/${id}`, "Approve the generation before creating an article draft.");
  const o = g.output;
  const slug = await uniqueSlug("insights", slugify(o.article_title || "article"));
  const row = await one<{ id: string }>("INSERT INTO insights(title,slug,summary,body_md,seo_title,seo_description,author) VALUES ($1,$2,$3,$4,$5,$6,'Curiosbot') RETURNING id",
    [o.article_title || "Untitled", slug, o.executive_summary || null, o.article_md || "", o.seo?.title || null, o.seo?.description || null]);
  await audit(u.id, "ai_create_insight_draft", "insight", row!.id);
  redirect(ah(`/content/${row!.id}`));
}

// ───────── AI Marketing Analyst ─────────
export async function runAnalystAction(fd: FormData) {
  const u = await requireUser();
  await throttle(u.id);
  const period = z.enum(["7d", "30d", "90d", "year"]).catch("30d").parse(fd.get("p"));
  const range = resolveRange(period);
  let id: string;
  try {
    const snapshot = await buildSnapshot(range);
    const result = await runAnalyst(snapshot);
    id = (await one<{ id: string }>("INSERT INTO ai_generations(kind,input,output,model,created_by,status) VALUES ('analyst',$1,$2,$3,$4,'approved') RETURNING id", [JSON.stringify({ period, snapshot }), JSON.stringify(result), aiModel(), u.id]))!.id;
  } catch (e) { return back("/ai-studio/analyst", msg(e)); }
  await audit(u.id, "ai_analyst", "ai_generation", id);
  redirect(`${ah("/ai-studio/analyst")}?run=${id}`);
}

// ───────── Ask Curiosbot ─────────
export async function askAction(fd: FormData) {
  const u = await requireUser();
  await throttle(u.id);
  const q = z.string().trim().min(3).max(500).safeParse(fd.get("question"));
  if (!q.success) return back("/ai-studio/ask", "Enter a question (3–500 characters).");
  const period = z.enum(["7d", "30d", "90d", "year"]).catch("30d").parse(fd.get("p"));
  let id: string;
  try {
    const r = await askCuriosbot(q.data, resolveRange(period));
    id = (await one<{ id: string }>("INSERT INTO ai_generations(kind,input,output,model,created_by,status) VALUES ('ask',$1,$2,$3,$4,'approved') RETURNING id", [JSON.stringify({ question: q.data, period }), JSON.stringify(r), aiModel(), u.id]))!.id;
  } catch (e) { return back("/ai-studio/ask", msg(e)); }
  redirect(`${ah("/ai-studio/ask")}?run=${id}`);
}
