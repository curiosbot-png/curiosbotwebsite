"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { parseFaq, parsePairs } from "@/lib/genedit";
import { canTransition } from "@/lib/workflow";
import { notifyN8n } from "@/lib/leads";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and single hyphens");
const url = z.string().trim().max(500).refine((v) => v === "" || /^(https:\/\/|\/)/.test(v), "URLs must start with https:// or /").optional().default("");
const nul = (s?: string) => (s && s.length ? s : null);

export async function saveProduct(fd: FormData) {
  const u = await requireUser();
  const d = z.object({
    id: z.string().uuid().optional().or(z.literal("")), name: z.string().trim().min(2).max(120), slug,
    tagline: z.string().trim().max(200).optional().default(""), short_description: z.string().trim().max(400).optional().default(""), long_description: z.string().trim().max(8000).optional().default(""),
    business_problem: z.string().trim().max(3000).optional().default(""), solution: z.string().trim().max(3000).optional().default(""),
    features: z.string().optional().default(""), benefits: z.string().optional().default(""), use_cases: z.string().optional().default(""), how_it_works: z.string().optional().default(""), faq: z.string().optional().default(""),
    industries: z.string().optional().default(""), screenshots: z.string().optional().default(""),
    logo_url: url, hero_media_url: url, video_url: url, demo_url: url, social_image_url: url,
    cta_label: z.string().trim().max(60).optional().default("Request a demo"), seo_title: z.string().trim().max(70).optional().default(""), seo_description: z.string().trim().max(170).optional().default(""),
  }).parse(Object.fromEntries(fd));
  const shots = d.screenshots.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [u2, ...alt] = l.split("|"); return { url: u2.trim(), alt: alt.join("|").trim() || "Product screenshot" }; }).filter((s) => /^(https:\/\/|\/)/.test(s.url));
  const vals = [d.name, d.slug, nul(d.logo_url), nul(d.tagline), nul(d.short_description), nul(d.long_description), nul(d.business_problem), nul(d.solution),
    JSON.stringify(parsePairs(d.features)), JSON.stringify(parsePairs(d.benefits)), JSON.stringify(parsePairs(d.use_cases)), JSON.stringify(parsePairs(d.how_it_works)), JSON.stringify(parseFaq(d.faq)),
    d.industries.split(",").map((s) => s.trim()).filter(Boolean), JSON.stringify(shots), nul(d.hero_media_url), nul(d.video_url), nul(d.demo_url), d.cta_label || "Request a demo", nul(d.seo_title), nul(d.seo_description), nul(d.social_image_url)];
  let id = d.id || null;
  if (id) {
    await query(`UPDATE products SET name=$2,slug=$3,logo_url=$4,tagline=$5,short_description=$6,long_description=$7,business_problem=$8,solution=$9,features=$10,benefits=$11,use_cases=$12,how_it_works=$13,faq=$14,
      industries=$15,screenshots=$16,hero_media_url=$17,video_url=$18,demo_url=$19,cta_label=$20,seo_title=$21,seo_description=$22,social_image_url=$23,updated_at=now() WHERE id=$1`, [id, ...vals]);
  } else {
    id = (await one<{ id: string }>(`INSERT INTO products(name,slug,logo_url,tagline,short_description,long_description,business_problem,solution,features,benefits,use_cases,how_it_works,faq,industries,screenshots,hero_media_url,video_url,demo_url,cta_label,seo_title,seo_description,social_image_url,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`, [...vals, u.id]))!.id;
  }
  await audit(u.id, "product_save", "product", id);
  revalidatePath("/products"); revalidatePath(`/products/${d.slug}`);
  redirect(ah(`/products/${id}`));
}

export async function setProductStatus(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const to = z.enum(["draft", "in_review", "approved", "published", "archived"]).parse(fd.get("to"));
  const cur = await one<{ status: string; slug: string }>("SELECT status, slug FROM products WHERE id=$1", [id]);
  if (!cur || !canTransition(cur.status, to, u.role)) throw new Error("This status change is not allowed for your role.");
  await query("UPDATE products SET status=$2::publish_status, published_at = CASE WHEN $3::text='published' THEN now() ELSE published_at END, updated_at=now() WHERE id=$1", [id, to, to]);
  await audit(u.id, "product_status", "product", id, { from: cur.status, to });
  if (to === "published") void notifyN8n("product-published", { productId: id, slug: cur.slug, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/products/${cur.slug}` });
  revalidatePath("/products"); revalidatePath(`/products/${cur.slug}`); revalidatePath("/sitemap.xml");
  revalidatePath(ah(`/products/${id}`));
}

export async function saveInsight(fd: FormData) {
  const u = await requireUser();
  const d = z.object({ id: z.string().uuid().optional().or(z.literal("")), title: z.string().trim().min(3).max(200), slug, summary: z.string().trim().max(500).optional().default(""), body_md: z.string().max(60000).default(""),
    theme: z.string().trim().max(60).optional().default(""), author: z.string().trim().max(100).optional().default(""), hero_image_url: url, seo_title: z.string().trim().max(70).optional().default(""), seo_description: z.string().trim().max(170).optional().default("") }).parse(Object.fromEntries(fd));
  let id = d.id || null;
  const v = [d.title, d.slug, nul(d.summary), d.body_md, nul(d.theme), nul(d.author), nul(d.hero_image_url), nul(d.seo_title), nul(d.seo_description)];
  if (id) await query("UPDATE insights SET title=$2,slug=$3,summary=$4,body_md=$5,theme=$6,author=$7,hero_image_url=$8,seo_title=$9,seo_description=$10,updated_at=now() WHERE id=$1", [id, ...v]);
  else id = (await one<{ id: string }>("INSERT INTO insights(title,slug,summary,body_md,theme,author,hero_image_url,seo_title,seo_description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id", v))!.id;
  await audit(u.id, "insight_save", "insight", id);
  revalidatePath("/insights"); revalidatePath(`/insights/${d.slug}`);
  redirect(ah(`/content/${id}`));
}

export async function setInsightStatus(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const to = z.enum(["draft", "in_review", "approved", "published", "archived"]).parse(fd.get("to"));
  const cur = await one<{ status: string; slug: string }>("SELECT status, slug FROM insights WHERE id=$1", [id]);
  if (!cur || !canTransition(cur.status, to, u.role)) throw new Error("This status change is not allowed for your role.");
  await query("UPDATE insights SET status=$2::publish_status, published_at = CASE WHEN $3::text='published' THEN now() ELSE published_at END, updated_at=now() WHERE id=$1", [id, to, to]);
  await audit(u.id, "insight_status", "insight", id, { from: cur.status, to });
  if (to === "published") void notifyN8n("content-published", { insightId: id, slug: cur.slug, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/insights/${cur.slug}` });
  revalidatePath("/insights"); revalidatePath(`/insights/${cur.slug}`); revalidatePath("/sitemap.xml");
  revalidatePath(ah(`/content/${id}`));
}
