import { generateContentAction } from "../../../ai-actions";
import { query } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
export const metadata = { title: "AI Content Factory" };
export default async function ContentFactory({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [products, campaigns] = await Promise.all([query<{ name: string }>("SELECT name FROM products ORDER BY name"), query<{ name: string; utm_campaign: string }>("SELECT name, utm_campaign FROM campaigns ORDER BY name")]);
  return (
    <>
      <PageHeader title="AI Content Factory" sub="Enter an idea, topic or product. Output is a draft for review — never published automatically." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <Panel><form action={generateContentAction} className="space-y-4">
        <label className="block text-sm">Idea / topic<textarea name="topic" rows={3} required className="field mt-1" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Audience<input name="audience" defaultValue="CIOs and CTOs" className="field mt-1" /></label>
          <label className="block text-sm">Channel<input name="channel" defaultValue="Website + LinkedIn" className="field mt-1" /></label>
          <label className="block text-sm">Tone<input name="tone" defaultValue="Authoritative, practical" className="field mt-1" /></label>
          <label className="block text-sm">Service<select name="service" className="field mt-1"><option value="">—</option>{["AI Strategy & Adoption", "CXO AI Advisory", "PLM Consulting", "Salesforce Consulting"].map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="block text-sm">Product<select name="product" className="field mt-1"><option value="">—</option>{products.map((p) => <option key={p.name}>{p.name}</option>)}</select></label>
          <label className="block text-sm">Campaign<select name="campaign" className="field mt-1"><option value="">—</option>{campaigns.map((c) => <option key={c.utm_campaign} value={c.utm_campaign}>{c.name}</option>)}</select></label>
        </div>
        <label className="block text-sm">Source facts / notes<textarea name="notes" rows={4} className="field mt-1" placeholder="Facts, quotes or data you want included. Nothing else will be stated as fact." /></label>
        <SubmitButton pending="Generating… this can take a minute">Generate content</SubmitButton>
      </form></Panel>
    </>
  );
}
