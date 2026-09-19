import { hasDb, one, query } from "./db";

export interface Item { title: string; description: string }
export interface Product {
  id: string; name: string; slug: string; logo_url: string | null; tagline: string | null; short_description: string | null; long_description: string | null;
  business_problem: string | null; solution: string | null; features: Item[]; benefits: Item[]; use_cases: Item[]; how_it_works: Item[]; faq: { q: string; a: string }[];
  industries: string[]; screenshots: { url: string; alt: string }[]; hero_media_url: string | null; video_url: string | null; demo_url: string | null; cta_label: string;
  seo_title: string | null; seo_description: string | null; social_image_url: string | null; status: string; published_at: string | null;
}
export interface Insight { id: string; title: string; slug: string; summary: string | null; body_md: string; theme: string | null; author: string | null; hero_image_url: string | null; seo_title: string | null; seo_description: string | null; published_at: string | null; updated_at: string }

// Public pages degrade to empty lists when no DB is reachable (e.g. during `next build` in CI).
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDb()) return fallback;
  try { return await fn(); } catch (e) { console.error("db read failed", String(e).slice(0, 200)); return fallback; }
}

export const listPublishedProducts = (limit = 100) => safe(() => query<Product>(
  "SELECT * FROM products WHERE status='published' AND (published_at IS NULL OR published_at <= now()) ORDER BY published_at DESC NULLS LAST, name LIMIT $1", [limit]), [] as Product[]);
export const getPublishedProduct = (slug: string) => safe(() => one<Product>("SELECT * FROM products WHERE slug=$1 AND status='published'", [slug]), null as Product | null);
export const listPublishedInsights = (limit = 100) => safe(() => query<Insight>(
  "SELECT * FROM insights WHERE status='published' ORDER BY published_at DESC NULLS LAST LIMIT $1", [limit]), [] as Insight[]);
export const getPublishedInsight = (slug: string) => safe(() => one<Insight>("SELECT * FROM insights WHERE slug=$1 AND status='published'", [slug]), null as Insight | null);
