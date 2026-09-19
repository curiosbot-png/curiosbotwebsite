import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedInsight } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const revalidate = 60;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await getPublishedInsight((await params).slug);
  if (!a) return {};
  const title = a.seo_title || a.title, description = a.seo_description || a.summary || undefined;
  return { title, description, alternates: { canonical: `/insights/${a.slug}` }, openGraph: { type: "article", title, description, publishedTime: a.published_at ?? undefined, images: a.hero_image_url ? [a.hero_image_url] : undefined } };
}

export default async function Article({ params }: P) {
  const a = await getPublishedInsight((await params).slug);
  if (!a) notFound();
  return (
    <article className="container-x max-w-3xl py-20">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.summary, datePublished: a.published_at, dateModified: a.updated_at, author: { "@type": "Person", name: a.author || SITE.founder }, publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: SITE.logo } }, mainEntityOfPage: `${SITE.url}/insights/${a.slug}`, image: a.hero_image_url ?? undefined },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Insights", item: `${SITE.url}/insights` }, { "@type": "ListItem", position: 3, name: a.title, item: `${SITE.url}/insights/${a.slug}` }] },
      ]} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-400"><Link href="/insights" className="hover:text-white">Insights</Link></nav>
      <h1 className="text-4xl font-semibold sm:text-5xl">{a.title}</h1>
      <p className="mt-4 text-sm text-slate-400">{a.author || SITE.founder}{a.published_at && <> · <time dateTime={a.published_at}>{new Date(a.published_at).toLocaleDateString("en-GB", { dateStyle: "long" })}</time></>}</p>
      <div className="prose-cb mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body_md) }} />
      <div className="card mt-14"><h2 className="text-xl">Discuss this with our team</h2><p className="mt-2 text-slate-400">Talk to Curiosbot about applying these ideas in your enterprise.</p><Link href="/contact" data-cta="insight-cta" className="btn-primary mt-4">Discuss your AI strategy</Link></div>
    </article>
  );
}
