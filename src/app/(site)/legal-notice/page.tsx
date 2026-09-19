import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Legal Notice", description: "Legal information about Curiosbot Digital S.L. (LSSI-CE).", alternates: { canonical: "/legal-notice" } };

export default function LegalNotice() {
  return (
    <article className="container-x prose-cb max-w-3xl py-20">
      <p role="note" className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">DRAFT — the bracketed fields must be completed by the owner and the text reviewed by a Spanish lawyer (Ley 34/2002 LSSI-CE).</p>
      <h1 className="mt-8 text-4xl font-semibold">Legal Notice</h1>
      <ul>
        <li>Company name: {SITE.name}</li><li>Registered office: [FULL REGISTERED ADDRESS], {SITE.address}</li>
        <li>CIF: [TO BE PROVIDED]</li><li>Commercial Registry: [REGISTRY DETAILS TO BE PROVIDED]</li>
        <li>Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li><li>Phone: {SITE.phone}</li>
      </ul>
      <h2>Intellectual property</h2><p>Content on this website is owned by or licensed to {SITE.name}. Reproduction without permission is not allowed.</p>
      <h2>Liability</h2><p>Information is provided for general purposes and does not constitute professional advice. [LEGAL REVIEW REQUIRED]</p>
      <h2>Governing law</h2><p>Spanish law applies; courts of Zaragoza, unless mandatory consumer rules provide otherwise. [LEGAL REVIEW REQUIRED]</p>
    </article>
  );
}
