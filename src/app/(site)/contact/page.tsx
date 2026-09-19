import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Talk to Curiosbot about AI strategy, PLM or Salesforce.", alternates: { canonical: "/contact" } };
type SP = { searchParams: Promise<{ service?: string; product?: string }> };

export default async function Contact({ searchParams }: SP) {
  const sp = await searchParams;
  return (
    <section className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Start an executive conversation</h1>
        <p className="mt-5 text-slate-300">Tell us about your goals. We usually respond within one business day.</p>
        <address className="mt-8 space-y-2 text-slate-300 not-italic">
          <p>{SITE.address}</p>
          <p><a className="text-brand-400 hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
          <p>Support: <a className="text-brand-400 hover:underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>
          <p><a className="text-brand-400 hover:underline" href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}>{SITE.phone}</a></p>
        </address>
      </div>
      <ContactForm kind="consultation" serviceInterest={sp.service ?? ""} productInterest={sp.product ?? ""} />
    </section>
  );
}
