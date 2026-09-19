import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
export const metadata: Metadata = { title: "Cookie Policy", description: "Cookies and similar technologies used by curiosbot.com.", alternates: { canonical: "/cookie-policy" } };

const ROWS: [string, string, string, string][] = [
  ["cb_consent", "Necessary", "Stores your cookie choices", "180 days"],
  ["cb_session", "Necessary", "Administrator sign-in (admin area only)", "12 hours"],
  ["cb_vid (local storage)", "Analytics", "Random identifier for first-party analytics", "Until you withdraw consent or clear storage"],
  ["cb_attr (session storage)", "Analytics / Marketing", "Remembers campaign parameters for the visit", "Browser session"],
];

export default function Cookies() {
  return (
    <article className="container-x prose-cb max-w-3xl py-20">
      <p role="note" className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">DRAFT — requires legal review. Update this table whenever tools (e.g. GA4) are enabled.</p>
      <h1 className="mt-8 text-4xl font-semibold">Cookie Policy</h1>
      <p>Version {SITE.policyVersion}. Optional cookies and storage are never set until you opt in. Your choice can be changed at any time: <span className="text-brand-400 underline"><CookieSettingsButton /></span></p>
      <div className="overflow-x-auto"><table className="mt-6 w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-white"><th className="py-2 pr-4">Name</th><th className="pr-4">Category</th><th className="pr-4">Purpose</th><th>Duration</th></tr></thead>
        <tbody>{ROWS.map((r) => <tr key={r[0]} className="border-b border-white/5 align-top">{r.map((c, i) => <td key={i} className="py-2 pr-4">{c}</td>)}</tr>)}</tbody></table></div>
      <p className="mt-6">If Google Analytics 4 is enabled in future, it will load only after analytics consent and will be listed here. We honour the Global Privacy Control signal by disabling marketing consent.</p>
    </article>
  );
}
