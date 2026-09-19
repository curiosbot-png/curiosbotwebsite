import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Preserves the scraper-bot blocks from the existing WordPress robots.txt.
export default function robots(): MetadataRoute.Robots {
  const blocked = ["Baiduspider", "AhrefsBot", "MJ12bot", "BLEXBot", "DotBot", "SemrushBot", "YandexBot"];
  return {
    rules: [
      ...blocked.map((userAgent) => ({ userAgent, disallow: "/" })),
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
