import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SERVICES } from "@/content/services";
import { listPublishedInsights, listPublishedProducts } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, insights] = await Promise.all([listPublishedProducts(), listPublishedInsights()]);
  const u = (p: string) => `${SITE.url}${p}`;
  return [
    { url: u("/"), priority: 1 },
    ...Object.values(SERVICES).map((s) => ({ url: u(s.path), priority: 0.9 })),
    { url: u("/products"), priority: 0.9 }, { url: u("/insights"), priority: 0.8 }, { url: u("/about"), priority: 0.6 }, { url: u("/contact"), priority: 0.7 },
    ...products.map((p) => ({ url: u(`/products/${p.slug}`), lastModified: p.published_at ?? undefined, priority: 0.8 })),
    ...insights.map((a) => ({ url: u(`/insights/${a.slug}`), lastModified: a.updated_at, priority: 0.7 })),
    { url: u("/privacy"), priority: 0.2 }, { url: u("/cookie-policy"), priority: 0.2 }, { url: u("/legal-notice"), priority: 0.2 },
  ];
}
