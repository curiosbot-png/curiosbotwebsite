import Link from "next/link";
import { query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { Badge, PageHeader, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "AI Studio" };
const TOOLS = [
  ["/ai-studio/product", "AI Product Creator", "Turn a product brief into a complete launch kit: positioning, page copy, SEO, social, email, ads, video script and sales pitch."],
  ["/ai-studio/content", "AI Content Factory", "From an idea to an article, LinkedIn content, newsletter, SEO metadata, ad concepts and a video script."],
  ["/ai-studio/analyst", "AI Marketing Analyst", "Observation → possible explanation → recommended experiment, verified against your real data."],
  ["/ai-studio/ask", "Ask Curiosbot", "Ask questions in natural language; answers are computed from your authorised data."],
];
export default async function AiStudio() {
  const recent = await query<{ id: string; kind: string; status: string; created_at: Date; input: Record<string, string> }>("SELECT id,kind,status,created_at,input FROM ai_generations WHERE kind IN ('product_marketing','content_factory') ORDER BY created_at DESC LIMIT 15");
  return (
    <>
      <PageHeader title="AI Studio" sub="All generated content stays a draft until a human reviews, edits and approves it. Nothing is published or sent automatically." />
      <div className="grid gap-4 md:grid-cols-2">{TOOLS.map(([h, t, d]) => <Link key={h} href={ah(h)} className="card block"><h2 className="text-lg text-white">{t}</h2><p className="mt-2 text-sm text-slate-400">{d}</p></Link>)}</div>
      <Panel title="Recent generations" className="mt-6"><Table head={["Type", "Subject", "Status", "Created"]} rows={recent.map((r) => [<Link key={r.id} className="text-brand-400 hover:underline" href={ah(`/ai-studio/generations/${r.id}`)}>{r.kind.replace("_", " ")}</Link>, r.input.name ?? r.input.topic ?? "—", <Badge key="s" tone={r.status === "approved" ? "green" : "amber"}>{r.status}</Badge>, r.created_at.toISOString().slice(0, 10)])} empty="Nothing generated yet." /></Panel>
    </>
  );
}
