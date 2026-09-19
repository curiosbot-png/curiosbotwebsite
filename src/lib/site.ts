export const SITE = {
  name: "Curiosbot Digital S.L.",
  short: "Curiosbot",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://curiosbot.com",
  email: "sales@curiosbot.com",
  supportEmail: "help@curiosbot.com",
  phone: "(+34) 602 001 201",
  address: "Zaragoza, Spain",
  founder: "Anup Khanvilkar",
  logo: "https://curiosbot.com/wp-content/uploads/2020/06/site-logo-white.svg",
  // Public naming of clients is off until the owner confirms permission (see docs/01-brand-analysis.md).
  showClientNames: process.env.NEXT_PUBLIC_SHOW_CLIENT_NAMES === "true",
  clients: ["Borealis", "Siemens", "Continental", "Essity"],
  policyVersion: "2026-09-19",
};

export const NAV = [
  { href: "/ai-consulting", label: "AI Consulting", children: [
    { href: "/ai-strategy-adoption", label: "AI Strategy & Adoption" },
    { href: "/cxo-ai-advisory", label: "CXO AI Advisory" },
  ] },
  { href: "/plm-consulting", label: "PLM" },
  { href: "/salesforce-consulting", label: "Salesforce" },
  { href: "/products", label: "AI Products" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];
