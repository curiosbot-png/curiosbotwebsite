import type { Metadata } from "next";
import Link from "next/link";
import { TiltCard, Reveal } from "@/components/motion";
import { listPublishedProducts } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "AI Products",
  description: "Proprietary Curiosbot AI products for enterprise teams — built from real delivery experience in AI, PLM and Salesforce.",
  alternates: { canonical: "/products" },
};

export default async function Products() {
  const products = await listPublishedProducts();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/products/${p.slug}`, name: p.name })) }} />
      <section className="container-x py-20">
        <p className="eyebrow">Curiosbot AI products</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-6xl">AI products built for enterprise work</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">Proprietary products that turn what we learn delivering AI, PLM and Salesforce programmes into reusable capability.</p>
        {products.length ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <Link href={`/products/${p.slug}`} data-cta={`product-card-${p.slug}`} className="block h-full">
                  <TiltCard className="h-full">
                    <h2 className="text-xl">{p.name}</h2>
                    {p.tagline && <p className="mt-1 text-sm text-signal">{p.tagline}</p>}
                    <p className="mt-3 text-sm text-slate-400">{p.short_description}</p>
                    <span className="mt-5 inline-block text-sm text-brand-400">Learn more →</span>
                  </TiltCard>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card mt-12 max-w-2xl"><h2 className="text-xl">Products launching soon</h2><p className="mt-2 text-slate-400">We&apos;re preparing our first product launches. Get in touch to hear first.</p><Link href="/contact" className="btn-primary mt-5">Talk to us</Link></div>
        )}
      </section>
    </>
  );
}
