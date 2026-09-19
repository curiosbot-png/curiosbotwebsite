// Maps a URL path to a content classification used by analytics. Pure; safe on client and server.
export interface ContentRef { type: "home" | "service" | "product" | "insight" | "landing" | "about" | "contact" | "other"; slug: string | null; theme: string | null }

const SERVICE_THEMES: Record<string, string> = {
  "/ai-consulting": "ai-strategy", "/ai-strategy-adoption": "ai-adoption", "/cxo-ai-advisory": "cxo",
  "/plm-consulting": "plm", "/salesforce-consulting": "salesforce",
};

export function classifyPath(pathname: string): ContentRef {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return { type: "home", slug: "home", theme: null };
  if (SERVICE_THEMES[p]) return { type: "service", slug: p.slice(1), theme: SERVICE_THEMES[p] };
  if (p === "/products") return { type: "landing", slug: "products", theme: "products" };
  if (p.startsWith("/products/")) return { type: "product", slug: p.split("/")[2], theme: "products" };
  if (p === "/insights") return { type: "landing", slug: "insights", theme: null };
  if (p.startsWith("/insights/")) return { type: "insight", slug: p.split("/")[2], theme: null };
  if (p.startsWith("/lp/")) return { type: "landing", slug: p.split("/")[2], theme: null };
  if (p === "/about") return { type: "about", slug: "about", theme: null };
  if (p === "/contact") return { type: "contact", slug: "contact", theme: null };
  return { type: "other", slug: null, theme: null };
}
