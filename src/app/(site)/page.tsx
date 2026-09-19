import Link from "next/link";
import type { Metadata } from "next";
import { HeroVisual } from "@/components/HeroVisual";
import { Counter, Reveal, TiltCard } from "@/components/motion";
import { SITE } from "@/lib/site";
import { listPublishedProducts, listPublishedInsights } from "@/lib/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "Curiosbot — Turn AI into business value" },
  description: "Curiosbot helps enterprises identify, implement and scale AI and enterprise technology solutions — AI strategy, PLM and Salesforce — that create measurable business impact.",
  alternates: { canonical: "/" },
};

const STORY = [
  { n: "01", t: "The AI opportunity", b: "Every enterprise sees the potential. Few can say where AI will change their economics — or what to do first." },
  { n: "02", t: "The business challenge", b: "Pilots that never reach production, disconnected systems, uneven data and teams that never adopt what was built." },
  { n: "03", t: "The Curiosbot approach", b: "Strategy, technology and implementation as one system — measured against operational outcomes, not slide decks." },
];

const PRACTICES = [
  { href: "/ai-consulting", t: "AI Consulting", b: "Strategy, use-case prioritisation, business cases, agents and automation — delivered to production." },
  { href: "/plm-consulting", t: "PLM Transformation", b: "A connected digital thread across engineering and operations: product data, artwork, DAM, MLR and integration." },
  { href: "/salesforce-consulting", t: "Salesforce", b: "Architecture, integration, data and AI around the outcomes your sales and service teams need." },
];

export default async function Home() {
  const [products, insights] = await Promise.all([listPublishedProducts(3), listPublishedInsights(3)]);
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-fade" aria-hidden />
        <div className="absolute -right-40 top-10 -z-10 h-[32rem] w-[32rem] rounded-full bg-violet/20 blur-[120px]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-ink-900" aria-hidden />
        <div className="container-x grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">AI-led digital transformation</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">Turn AI into <span className="gradient-text">business value.</span></h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">Curiosbot helps enterprises identify, implement and scale AI and enterprise technology solutions that create measurable business impact.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" data-cta="home-hero-primary" className="btn-primary">Discuss your AI strategy</Link>
              <Link href="/products" data-cta="home-hero-secondary" className="btn-ghost">Explore our AI products</Link>
            </div>
          </div>
          <div className="relative"><HeroVisual /></div>
        </div>
      </section>

      <section className="container-x py-20" aria-labelledby="story-h">
        <Reveal><p className="eyebrow">Why now</p><h2 id="story-h" className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">From AI ambition to enterprise results</h2></Reveal>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STORY.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}><li className="card h-full list-none"><span className="gradient-text font-display text-3xl">{s.n}</span><h3 className="mt-3 text-xl">{s.t}</h3><p className="mt-2 text-slate-400">{s.b}</p></li></Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container-x py-20">
          <Reveal><p className="eyebrow">Three practices, one delivery model</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">AI, PLM and Salesforce — as one integrated system</h2></Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PRACTICES.map((p, i) => (
              <Reveal key={p.href} delay={i * 0.08}>
                <Link href={p.href} data-cta={`home-practice-${p.href.slice(1)}`} className="block h-full"><TiltCard className="h-full"><h3 className="text-xl">{p.t}</h3><p className="mt-2 text-slate-400">{p.b}</p><span className="mt-5 inline-block text-sm text-brand-400">Explore →</span></TiltCard></Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[["Integrated AI systems", "AI woven into existing enterprise workflows and data, not isolated models."], ["Agentic workflows", "Autonomous workflows engineered to run continuously in production, with human approval where it matters."], ["Measurable operational ROI", "Delivery measured against operational outcomes."]].map(([t, b]) => (
              <Reveal key={t}><div><h3 className="text-lg text-white">{t}</h3><p className="mt-1 text-sm text-slate-400">{b}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20" aria-labelledby="prod-h">
        <Reveal><p className="eyebrow">Curiosbot AI products</p><h2 id="prod-h" className="mt-3 text-3xl font-semibold sm:text-4xl">Proprietary AI products built from delivery experience</h2></Reveal>
        {products.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {products.map((p) => (
              <Link key={p.slug} href={`/products/${p.slug}`} className="block"><TiltCard className="h-full"><h3 className="text-xl">{p.name}</h3><p className="mt-1 text-sm text-signal">{p.tagline}</p><p className="mt-3 text-sm text-slate-400">{p.short_description}</p></TiltCard></Link>
            ))}
          </div>
        ) : <p className="mt-6 max-w-2xl text-slate-400">New products are launching soon. <Link href="/contact" className="text-brand-400 underline">Talk to us</Link> about early access.</p>}
        <div className="mt-8"><Link href="/products" className="btn-ghost">All AI products</Link></div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container-x grid gap-10 py-20 md:grid-cols-3">
          {[[18, "+", "Years of enterprise technology experience"], [4, "+", "Industry verticals served"], [3, "", "Core consulting practices"]].map(([n, s, l]) => (
            <Reveal key={String(l)}><p className="gradient-text font-display text-6xl font-semibold"><Counter to={n as number} suffix={s as string} /></p><p className="mt-2 text-slate-300">{l}</p></Reveal>
          ))}
        </div>
        {SITE.showClientNames && (
          <p className="container-x pb-14 text-sm text-slate-400">Our programmes support engineering and manufacturing enterprises across Europe, including teams at {SITE.clients.join(", ")}.</p>
        )}
      </section>

      <section className="container-x py-20">
        <blockquote className="mx-auto max-w-3xl text-center">
          <p className="font-display text-3xl font-medium leading-snug text-white sm:text-4xl">“We don&apos;t sell AI pilots that sit in a slide deck.”</p>
          <footer className="mt-4 text-slate-400">{SITE.founder}, Founder, Curiosbot Digital S.L.</footer>
        </blockquote>
      </section>

      {insights.length > 0 && (
        <section className="container-x pb-20" aria-labelledby="ins-h">
          <h2 id="ins-h" className="text-3xl font-semibold">Latest insights</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {insights.map((a) => (
              <Link key={a.slug} href={`/insights/${a.slug}`} className="block"><TiltCard className="h-full"><h3 className="text-lg">{a.title}</h3><p className="mt-2 text-sm text-slate-400">{a.summary}</p></TiltCard></Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-x pb-10">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center sm:p-16">
          <h2 className="text-3xl font-semibold text-white sm:text-5xl">Ready for an executive conversation?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">Tell us what you want AI, PLM or Salesforce to achieve. We&apos;ll come back with a practical view.</p>
          <Link href="/contact" data-cta="home-final" className="btn mt-8 bg-white text-ink-900 hover:bg-slate-100">Discuss your AI strategy</Link>
        </div>
      </section>
    </>
  );
}
