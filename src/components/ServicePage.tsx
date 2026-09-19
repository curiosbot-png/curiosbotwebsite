import Link from "next/link";
import type { ServiceContent } from "@/content/services";
import { Reveal, TiltCard } from "./motion";
import { JsonLd } from "./JsonLd";
import { SITE } from "@/lib/site";
import { CxoFramework } from "./CxoFramework";

export function ServicePage({ c }: { c: ServiceContent }) {
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Service", name: c.title, provider: { "@type": "Organization", name: SITE.name, url: SITE.url }, description: c.seoDescription, areaServed: "Worldwide", url: `${SITE.url}${c.path}` },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: c.title, item: `${SITE.url}${c.path}` }] },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-fade" aria-hidden />
        <div className="container-x relative py-20 sm:py-28">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-400"><Link href="/" className="hover:text-white">Home</Link> / <span>{c.title}</span></nav>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl">{c.h1}</h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">{c.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?service=${encodeURIComponent(c.service)}`} data-cta={`${c.slug}-primary`} className="btn-primary">Discuss your AI strategy</Link>
            <Link href="/products" className="btn-ghost">Explore our AI products</Link>
          </div>
        </div>
      </section>

      {c.questions && (
        <section className="container-x py-20">
          <Reveal><h2 className="text-3xl font-semibold">Six questions every executive team asks</h2></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {c.questions.map((q, i) => (
              <Reveal key={q.q} delay={i * 0.05}><TiltCard className="h-full"><p className="text-sm text-signal">0{i + 1}</p><h3 className="mt-2 text-lg">{q.q}</h3><p className="mt-2 text-sm text-slate-400">{q.a}</p></TiltCard></Reveal>
            ))}
          </div>
        </section>
      )}

      {c.approach && <CxoFramework steps={c.approach} />}

      <section className="container-x py-20">
        <Reveal><h2 className="text-3xl font-semibold">What we cover</h2></Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {c.groups.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.05}>
              <TiltCard className="h-full">
                <h3 className="text-xl">{g.title}</h3><p className="mt-1 text-sm text-slate-400">{g.intro}</p>
                <ul className="mt-4 space-y-2 text-sm">{g.items.map((it) => <li key={it} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />{it}</li>)}</ul>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container-x py-20">
          <Reveal><h2 className="text-3xl font-semibold">Outcomes you can expect</h2></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {c.outcomes.map((o, i) => <Reveal key={o.title} delay={i * 0.08}><div><h3 className="gradient-text text-xl">{o.title}</h3><p className="mt-2 text-slate-300">{o.body}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">
          {c.faq.map((f) => (
            <details key={f.q} className="group p-5"><summary className="cursor-pointer list-none font-medium text-white">{f.q}</summary><p className="mt-3 text-slate-300">{f.a}</p></details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4 text-sm">{c.related.map((r) => <Link key={r.href} href={r.href} className="text-brand-400 underline underline-offset-4">{r.label} →</Link>)}</div>
      </section>

      <section className="container-x pb-10">
        <div className="rounded-3xl bg-brand-gradient p-10 text-center sm:p-14">
          <h2 className="text-3xl font-semibold text-white">Start an executive conversation</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Tell us where you want AI, PLM or Salesforce to create value. We&apos;ll respond with a practical view.</p>
          <Link href={`/contact?service=${encodeURIComponent(c.service)}`} data-cta={`${c.slug}-footer`} className="btn mt-6 bg-white text-ink-900 hover:bg-slate-100">Discuss your AI strategy</Link>
        </div>
      </section>
    </>
  );
}
