import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProduct } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { Reveal, TiltCard } from "@/components/motion";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const revalidate = 60;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPublishedProduct((await params).slug);
  if (!p) return {};
  const title = p.seo_title || `${p.name} — ${p.tagline ?? "Curiosbot AI product"}`;
  const description = p.seo_description || p.short_description || undefined;
  return { title, description, alternates: { canonical: `/products/${p.slug}` }, openGraph: { title, description, url: `/products/${p.slug}`, images: p.social_image_url ? [p.social_image_url] : undefined } };
}

function Grid({ items, title }: { items: { title: string; description: string }[]; title: string }) {
  if (!items?.length) return null;
  return (
    <section className="container-x py-14">
      <Reveal><h2 className="text-3xl font-semibold">{title}</h2></Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => <Reveal key={it.title + i} delay={i * 0.04}><TiltCard className="h-full"><h3 className="text-lg">{it.title}</h3><p className="mt-2 text-sm text-slate-400">{it.description}</p></TiltCard></Reveal>)}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: P) {
  const p = await getPublishedProduct((await params).slug);
  if (!p) notFound();
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: p.name, description: p.short_description, applicationCategory: "BusinessApplication", operatingSystem: "Web", url: `${SITE.url}/products/${p.slug}`, image: p.social_image_url ?? undefined, publisher: { "@type": "Organization", name: SITE.name } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "AI Products", item: `${SITE.url}/products` }, { "@type": "ListItem", position: 3, name: p.name, item: `${SITE.url}/products/${p.slug}` }] },
        ...(p.faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
      ]} />
      {/* 1. Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-fade" aria-hidden />
        <div className="container-x relative py-20 sm:py-28">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-400"><Link href="/products" className="hover:text-white">AI Products</Link> / {p.name}</nav>
          <p className="eyebrow">{p.name}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl">{p.tagline ?? p.name}</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">{p.short_description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#request-demo" data-cta="request-demo" className="btn-primary">{p.cta_label}</a>
            {p.demo_url && <a href={p.demo_url} rel="noopener noreferrer" className="btn-ghost">Open live demo</a>}
          </div>
          {p.hero_media_url && /\.(mp4|webm)$/i.test(p.hero_media_url)
            ? <video className="mt-12 w-full max-w-4xl rounded-2xl border border-white/10" src={p.hero_media_url} muted loop playsInline autoPlay preload="none" aria-label={`${p.name} overview`} />
            : p.hero_media_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.hero_media_url} alt={`${p.name} product overview`} className="mt-12 w-full max-w-4xl rounded-2xl border border-white/10" loading="eager" />}
        </div>
      </section>
      {/* 2. Problem / 3. Solution */}
      {(p.business_problem || p.solution) && (
        <section className="container-x grid gap-10 py-16 md:grid-cols-2">
          {p.business_problem && <Reveal><h2 className="text-2xl">The problem</h2><p className="mt-3 text-slate-300">{p.business_problem}</p></Reveal>}
          {p.solution && <Reveal delay={0.1}><h2 className="text-2xl">The solution</h2><p className="mt-3 text-slate-300">{p.solution}</p></Reveal>}
        </section>
      )}
      {/* 4. How it works / 5. Capabilities / 6. Business value / 7. Use cases */}
      <Grid title="How it works" items={p.how_it_works} />
      <Grid title="Capabilities" items={p.features} />
      <Grid title="Business value" items={p.benefits} />
      <Grid title="Use cases" items={p.use_cases} />
      {p.industries.length > 0 && <section className="container-x py-6"><p className="text-sm text-slate-400">Industries: {p.industries.join(" · ")}</p></section>}
      {/* 8. Demo / screenshots */}
      {p.screenshots.length > 0 && (
        <section className="container-x py-14"><h2 className="text-3xl font-semibold">See it in action</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">{p.screenshots.map((s) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={s.url} src={s.url} alt={s.alt} loading="lazy" className="rounded-xl border border-white/10" />)}</div>
        </section>
      )}
      {p.faq.length > 0 && (
        <section className="container-x py-14"><h2 className="text-3xl font-semibold">FAQ</h2>
          <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">{p.faq.map((f) => <details key={f.q} className="p-5"><summary className="cursor-pointer font-medium text-white">{f.q}</summary><p className="mt-3 text-slate-300">{f.a}</p></details>)}</div>
        </section>
      )}
      {/* 9. Request demo */}
      <section id="request-demo" className="container-x py-20">
        <div className="mx-auto max-w-3xl"><h2 className="text-3xl font-semibold">Request a demo of {p.name}</h2><p className="mt-2 mb-6 text-slate-400">Tell us a little about your team and we&apos;ll arrange a walkthrough.</p>
          <ContactForm kind="demo" productInterest={p.name} landing={`/products/${p.slug}`} /></div>
      </section>
    </>
  );
}
