import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedInsights } from "@/lib/content";
import { TiltCard } from "@/components/motion";

export const revalidate = 60;
export const metadata: Metadata = { title: "Insights", description: "Executive insights on enterprise AI, AI agents, PLM and Salesforce from Curiosbot.", alternates: { canonical: "/insights" } };

export default async function Insights() {
  const items = await listPublishedInsights();
  return (
    <section className="container-x py-20">
      <p className="eyebrow">Insights</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-6xl">Perspectives for enterprise technology leaders</h1>
      {items.length ? (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.slug} href={`/insights/${a.slug}`} className="block"><TiltCard className="h-full"><h2 className="text-lg">{a.title}</h2><p className="mt-2 text-sm text-slate-400">{a.summary}</p>
              {a.published_at && <p className="mt-4 text-xs text-slate-500"><time dateTime={a.published_at}>{new Date(a.published_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</time></p>}</TiltCard></Link>
          ))}
        </div>
      ) : <p className="mt-8 max-w-xl text-slate-400">Our first insights are on the way.</p>}
    </section>
  );
}
