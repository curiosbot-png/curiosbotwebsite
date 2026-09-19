// Page content for the consulting practices. No customer results, certifications or partnership claims are made
// beyond what the owner has supplied (18+ yrs experience, 3 practices). Anything else needs owner verification.
export interface Faq { q: string; a: string }
export interface ServiceContent {
  slug: string; path: string; title: string; eyebrow: string; h1: string; lead: string;
  seoTitle: string; seoDescription: string; service: string;
  questions?: { q: string; a: string }[];
  groups: { title: string; intro: string; items: string[] }[];
  outcomes: { title: string; body: string }[];
  approach?: { step: string; body: string }[];
  faq: Faq[];
  related: { href: string; label: string }[];
}

export const SERVICES: Record<string, ServiceContent> = {
  "ai-consulting": {
    slug: "ai-consulting", path: "/ai-consulting", title: "AI Consulting", eyebrow: "AI Consulting",
    h1: "Where should we use AI — and what will it be worth?",
    lead: "Curiosbot helps executive teams move from AI ambition to prioritised, governed and measured AI programmes: the right use cases, a defensible business case, an architecture that fits your enterprise, and delivery that reaches production.",
    seoTitle: "AI Consulting for Enterprises — Strategy to Production",
    seoDescription: "Enterprise AI consulting: opportunity discovery, use-case prioritisation, business cases, AI architecture, governance, agents and automation — delivered to production and measured against business value.",
    service: "AI Strategy & Adoption",
    questions: [
      { q: "Where should we use AI?", a: "Opportunity discovery across functions, scored against value, feasibility and data readiness." },
      { q: "What value will it create?", a: "Business cases with explicit assumptions, ROI logic and a measurement plan agreed up front." },
      { q: "What should we prioritise?", a: "A ranked portfolio: quick wins, strategic bets and what to deliberately not do." },
      { q: "How do we implement it?", a: "Architecture, integration with existing enterprise systems, and delivery into production." },
      { q: "How do we scale it?", a: "Governance, platform patterns, operating model and change management that survive beyond the pilot." },
      { q: "How do we measure value?", a: "Baselines, KPIs and a review cadence so value is evidenced, not asserted." },
    ],
    groups: [
      { title: "Strategy & value", intro: "Decide where AI belongs in your business.", items: ["AI strategy", "AI maturity assessment", "AI opportunity discovery", "Use-case identification and prioritisation", "Business cases and ROI"] },
      { title: "Architecture & governance", intro: "Build on foundations that scale safely.", items: ["AI architecture", "AI governance and risk", "Responsible AI", "Data readiness"] },
      { title: "Build & automate", intro: "Turn priorities into running systems.", items: ["Generative AI solutions", "AI agents and agentic workflows", "Enterprise automation", "Integration with PLM, CRM and ERP"] },
      { title: "Adopt & scale", intro: "Make the change stick.", items: ["Adoption and change management", "Scaling AI across the enterprise", "Measurement and value tracking"] },
    ],
    outcomes: [
      { title: "A prioritised AI portfolio", body: "Use cases ranked on value, feasibility and risk — with clear reasons for what is in and out." },
      { title: "Business cases leadership can defend", body: "ROI models with transparent assumptions, so investment decisions rest on evidence." },
      { title: "AI that runs in production", body: "Integrated into how your enterprise operates, not isolated proofs of concept." },
    ],
    faq: [
      { q: "What is enterprise AI consulting?", a: "Enterprise AI consulting helps an organisation decide where AI creates value, choose and prioritise use cases, design the architecture and governance, and implement and scale solutions while measuring business impact." },
      { q: "How is Curiosbot different from a typical IT services firm?", a: "Curiosbot combines executive-level advisory with hands-on implementation and its own AI products, so recommendations are grounded in what can be delivered and measured." },
      { q: "Do you build AI agents?", a: "Yes. We design and implement agentic workflows integrated with enterprise systems, with human approval gates for consequential actions." },
    ],
    related: [{ href: "/ai-strategy-adoption", label: "AI Strategy & Adoption" }, { href: "/cxo-ai-advisory", label: "CXO AI Advisory" }, { href: "/products", label: "Curiosbot AI Products" }],
  },
  "ai-strategy-adoption": {
    slug: "ai-strategy-adoption", path: "/ai-strategy-adoption", title: "AI Strategy & Adoption", eyebrow: "AI Strategy & Adoption",
    h1: "From AI strategy to adoption that actually sticks",
    lead: "Most AI programmes stall between the strategy deck and daily work. We connect the two: a clear strategy, a governed roadmap, and the change management that gets people and processes to use what is built.",
    seoTitle: "AI Strategy & Adoption for Enterprises",
    seoDescription: "Build an enterprise AI strategy and drive adoption: maturity assessment, roadmap, governance, change management and value measurement.",
    service: "AI Strategy & Adoption",
    groups: [
      { title: "Strategy", intro: "A roadmap tied to business priorities.", items: ["AI maturity assessment", "Vision and ambition", "Use-case portfolio and roadmap", "Investment and business case"] },
      { title: "Adoption", intro: "Where value is actually realised.", items: ["Stakeholder alignment", "Skills and operating model", "Change management", "Usage and value tracking"] },
      { title: "Governance", intro: "Confidence to scale.", items: ["Responsible AI principles", "Risk and compliance alignment (including EU AI Act readiness)", "Model and data governance"] },
    ],
    outcomes: [
      { title: "Alignment", body: "Leadership, business and technology agree what AI is for and what success looks like." },
      { title: "Adoption", body: "Teams change how they work because the solutions fit how they work." },
      { title: "Evidence", body: "Value is tracked against baselines agreed before delivery starts." },
    ],
    faq: [
      { q: "Why do AI pilots fail to scale?", a: "Common causes are unclear business ownership, poor data readiness, weak integration with existing systems, and no adoption plan. Addressing these early is the core of AI strategy and adoption work." },
      { q: "How long does an AI strategy engagement take?", a: "It depends on scope; we agree a scoped plan and timeline after an initial conversation." },
    ],
    related: [{ href: "/ai-consulting", label: "AI Consulting" }, { href: "/cxo-ai-advisory", label: "CXO AI Advisory" }],
  },
  "cxo-ai-advisory": {
    slug: "cxo-ai-advisory", path: "/cxo-ai-advisory", title: "CXO AI Advisory", eyebrow: "CXO AI Advisory",
    h1: "Executive advisory for the AI decisions that matter",
    lead: "Senior-level partnership for CEOs, CIOs, CTOs, CDOs and Chief AI Officers: cut through the noise, make sound investment decisions, and lead the organisation through AI-driven change.",
    seoTitle: "CXO AI Advisory — Executive AI Leadership Support",
    seoDescription: "AI advisory for CEOs, CIOs, CTOs and Chief AI Officers: prioritise, prove, implement, adopt, scale and measure AI value.",
    service: "CXO AI Advisory",
    groups: [
      { title: "What executives ask us", intro: "Decisions, not technology tours.", items: ["Where will AI change our economics?", "What should we build, buy or partner on?", "How do we govern risk without slowing down?", "How do we know it is working?"] },
    ],
    approach: [
      { step: "Discover", body: "Understand strategy, constraints and where AI could matter. Output: opportunity map." },
      { step: "Prioritize", body: "Rank opportunities by value, feasibility and risk. Output: decision-ready portfolio." },
      { step: "Prove", body: "Test the highest-value hypotheses quickly with clear success criteria. Output: evidence." },
      { step: "Implement", body: "Deliver into production with the right architecture and integration. Output: running solution." },
      { step: "Adopt", body: "Bring people and processes with the change. Output: sustained usage." },
      { step: "Scale", body: "Repeat what works on a governed platform. Output: repeatable capability." },
      { step: "Measure", body: "Track value against the baseline. Output: an evidence-based case for the next investment." },
    ],
    outcomes: [
      { title: "Clear decisions", body: "A prioritised set of bets with rationale executives can defend to boards." },
      { title: "Reduced risk", body: "Governance and responsible-AI practices designed in from the start." },
      { title: "Faster progress", body: "A structured path from idea to measured value." },
    ],
    faq: [
      { q: "Who is CXO AI advisory for?", a: "CEOs, CIOs, CTOs, CDOs, Chief AI Officers and other senior leaders accountable for AI investment and outcomes." },
    ],
    related: [{ href: "/ai-consulting", label: "AI Consulting" }, { href: "/contact", label: "Start an executive conversation" }],
  },
  "plm-consulting": {
    slug: "plm-consulting", path: "/plm-consulting", title: "PLM Consulting", eyebrow: "PLM Consulting",
    h1: "PLM transformation that speeds up product delivery",
    lead: "Product lifecycle management is where product data, processes and compliance meet. We help enterprises modernise PLM — strategy, platform selection, integration and AI — to shorten time to market and improve data quality.",
    seoTitle: "PLM Consulting — Strategy, Transformation & Integration",
    seoDescription: "PLM consulting for enterprises: PLM strategy, product data, artwork & labelling, DAM, MLR, workflow optimisation, integration and AI within PLM.",
    service: "PLM Consulting",
    groups: [
      { title: "Strategy & selection", intro: "The right foundation.", items: ["PLM strategy", "PLM transformation roadmap", "Platform selection", "Implementation strategy"] },
      { title: "Product data & content", intro: "One trusted version of product truth.", items: ["Product data and product information", "Data quality and governance", "Artwork & labelling", "DAM (digital asset management)", "MLR (medical, legal, regulatory) review"] },
      { title: "Process & integration", intro: "Connect the thread.", items: ["Workflow optimisation", "Product development processes", "Enterprise integration architecture", "Legacy modernisation"] },
      { title: "AI within PLM", intro: "Applied where it pays back.", items: ["Classification and enrichment", "Document and specification intelligence", "Workflow assistance with human approval"] },
    ],
    outcomes: [
      { title: "Time to market", body: "Fewer hand-offs and clearer workflows between engineering, quality and commercial teams." },
      { title: "Data quality & compliance", body: "Governed product data supporting regulatory and labelling requirements." },
      { title: "Productivity", body: "Less rework and manual effort through simplified processes and automation." },
    ],
    faq: [
      { q: "What is PLM consulting?", a: "PLM consulting helps organisations define PLM strategy, select platforms, improve product data and workflows, and integrate PLM with enterprise systems to speed product development and improve compliance." },
      { q: "Do you work with specific PLM platforms?", a: "We advise on platform selection based on your requirements. We do not claim vendor partnerships or certifications on this site unless stated explicitly." },
    ],
    related: [{ href: "/ai-consulting", label: "AI Consulting" }, { href: "/salesforce-consulting", label: "Salesforce Consulting" }],
  },
  "salesforce-consulting": {
    slug: "salesforce-consulting", path: "/salesforce-consulting", title: "Salesforce Consulting", eyebrow: "Salesforce Consulting",
    h1: "Salesforce built around outcomes, not tickets",
    lead: "We approach Salesforce as a business platform: strategy and architecture first, then implementation, integration, data, automation and AI — with adoption and value realisation designed in.",
    seoTitle: "Salesforce Consulting — Strategy, Architecture & Value Realisation",
    seoDescription: "Outcome-focused Salesforce consulting: strategy, architecture, implementation, integration, automation, AI, data, analytics, adoption and optimisation.",
    service: "Salesforce Consulting",
    groups: [
      { title: "Strategy & architecture", intro: "Design for the business you run.", items: ["Salesforce strategy", "Solution architecture", "Data model and integration architecture"] },
      { title: "Implementation & integration", intro: "Deliver and connect.", items: ["Implementation", "Integration with enterprise systems", "Workflow automation"] },
      { title: "Data, AI & analytics", intro: "Intelligence on your customer data.", items: ["Data quality and management", "AI and agent use cases", "Analytics and reporting"] },
      { title: "Experience & value", intro: "Make it worth it.", items: ["Customer experience", "User adoption", "Optimisation", "Value realisation tracking"] },
    ],
    outcomes: [
      { title: "Adoption", body: "A platform sales and service teams want to use because it fits how they work." },
      { title: "Connected data", body: "Salesforce integrated with the systems that hold the rest of the customer picture." },
      { title: "Measured value", body: "Business KPIs tracked so improvements are visible." },
    ],
    faq: [
      { q: "Is Curiosbot a Salesforce staffing provider?", a: "No. We deliver consulting and implementation outcomes; we do not position ourselves as supplying developers by the hour." },
      { q: "Are you a Salesforce partner?", a: "This site does not claim a Salesforce partnership. Any partner status will only be shown once verified." },
    ],
    related: [{ href: "/ai-consulting", label: "AI Consulting" }, { href: "/plm-consulting", label: "PLM Consulting" }],
  },
};
