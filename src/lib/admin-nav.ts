// Admin link helper: on admin.<domain> the app is served at the root; in dev it lives under /admin.
export const ah = (path: string) => (process.env.ADMIN_HOST ? path || "/" : `/admin${path}`);

export const ADMIN_NAV: { path: string; label: string; roles?: ("admin" | "marketing")[] }[] = [
  { path: "", label: "Overview" },
  { path: "/marketing", label: "Marketing" },
  { path: "/content", label: "Content" },
  { path: "/products", label: "Products" },
  { path: "/campaigns", label: "Campaigns" },
  { path: "/leads", label: "Leads" },
  { path: "/audience", label: "Audience" },
  { path: "/email", label: "Email" },
  { path: "/social", label: "Social" },
  { path: "/advertising", label: "Advertising" },
  { path: "/seo", label: "SEO" },
  { path: "/ai-studio", label: "AI Studio" },
  { path: "/automations", label: "Automations" },
  { path: "/analytics", label: "Analytics" },
  { path: "/users", label: "Users", roles: ["admin"] },
  { path: "/settings", label: "Settings", roles: ["admin"] },
];
