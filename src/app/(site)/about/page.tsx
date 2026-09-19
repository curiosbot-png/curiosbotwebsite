import type { Metadata } from "next";
import Link from "next/link";
import { Counter, Reveal } from "@/components/motion";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About Curiosbot", description: "Curiosbot Digital S.L. is a Zaragoza-based consultancy combining AI strategy, PLM and Salesforce expertise with proprietary AI products.", alternates: { canonical: "/about" } };

const STEPS = ["Discover", "Design", "Prove", "Build", "Adopt", "Deliver"];
export default function About() {
  return (
    <>
      <section className="container-x py-20">
        <p className="eyebrow">About Curiosbot</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold sm:text-6xl">Strategy, technology and implementation — as one system</h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-300">Curiosbot Digital S.L. is an AI-led digital transformation consultancy based in {SITE.address}. We help enterprises adopt AI, modernise product lifecycle management and scale Salesforce, and we build proprietary AI products from what we learn.</p>
      </section>
      <section className="border-y border-white/10 bg-white/[0.02]"><div className="container-x grid gap-8 py-16 md:grid-cols-3">
        {[[18, "+", "Years of experience"], [4, "+", "Industry verticals"], [3, "", "Core practices"]].map(([n, s, l]) => <Reveal key={String(l)}><p className="gradient-text font-display text-5xl font-semibold"><Counter to={n as number} suffix={s as string} /></p><p className="mt-1 text-slate-300">{l}</p></Reveal>)}
      </div></section>
      <section className="container-x py-20">
        <h2 className="text-3xl font-semibold">How we deliver</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{STEPS.map((s, i) => <li key={s} className="card list-none"><span className="text-sm text-signal">0{i + 1}</span><h3 className="mt-1 text-lg">{s}</h3></li>)}</ol>
      </section>
      <section className="container-x pb-20">
        <h2 className="text-3xl font-semibold">Leadership</h2>
        <div className="card mt-6 max-w-2xl"><h3 className="text-xl">{SITE.founder}</h3><p className="text-sm text-signal">Founder</p><p className="mt-3 text-slate-300">Leads Curiosbot with more than 18 years of enterprise technology experience across AI, PLM and Salesforce programmes.</p></div>
        <Link href="/contact" className="btn-primary mt-10">Talk to our team</Link>
      </section>
    </>
  );
}
