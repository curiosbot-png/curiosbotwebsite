import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Privacy Policy", description: "How Curiosbot Digital S.L. processes personal data.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <article className="container-x prose-cb max-w-3xl py-20">
      <p role="note" className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">DRAFT — this policy was prepared as a starting point and requires review by a qualified Spanish/EU data-protection lawyer before production use.</p>
      <h1 className="mt-8 text-4xl font-semibold">Privacy Policy</h1>
      <p>Version {SITE.policyVersion}.</p>
      <h2>1. Controller</h2>
      <p>{SITE.name}, {SITE.address}. Company tax ID (CIF): [TO BE PROVIDED BY OWNER]. Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <h2>2. Data we process and why</h2>
      <ul>
        <li><b>Enquiry and demo forms</b> (name, business email, company, job title, industry, company size, country, interests, message): to respond to your request. Legal basis: your consent / pre-contractual steps (Art. 6(1)(a),(b) GDPR).</li>
        <li><b>Marketing communications</b>: only if you tick the optional opt-in. Legal basis: consent. You can withdraw at any time.</li>
        <li><b>First-party analytics</b> (random visitor identifier, pages viewed, engagement time, scroll depth, clicks, coarse device type, campaign parameters): only after you accept analytics cookies. Legal basis: consent (Art. 6(1)(a); Art. 22 LSSI). We do not fingerprint devices and we do not store IP addresses in analytics events.</li>
        <li><b>Journey linking</b>: if you accept both analytics and marketing and then submit a form, we may link your earlier consented visits to your enquiry to understand which content was helpful and to prioritise our response.</li>
        <li><b>Security logs</b> for the administration area: legitimate interest in securing our systems.</li>
      </ul>
      <p>We do not use special-category data and do not infer sensitive personal characteristics. Lead scoring uses only behavioural signals and professional information you provide.</p>
      <h2>3. Recipients</h2>
      <p>Service providers acting as processors, such as hosting (Hostinger), email delivery, analytics (Google Analytics 4 and Search Console, where enabled and consented), CRM and AI providers (OpenAI, used only for internal drafting and analysis of aggregated data — [CONFIRM DPA and transfer mechanism]). International transfers rely on adequacy decisions or standard contractual clauses where applicable.</p>
      <h2>4. Retention</h2>
      <p>Enquiries: up to 24 months after last contact unless a business relationship exists. Analytics events: 14 months. Consent records: for as long as needed to demonstrate compliance. [CONFIRM RETENTION PERIODS]</p>
      <h2>5. Your rights</h2>
      <p>You may request access, rectification, erasure, restriction, portability, or object to processing, and withdraw consent at any time, by writing to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. You may also lodge a complaint with the Spanish Data Protection Agency (AEPD, www.aepd.es).</p>
      <h2>6. Changes</h2><p>We will update this page and its version date when the policy changes.</p>
    </article>
  );
}
