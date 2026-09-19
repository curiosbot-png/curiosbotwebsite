import Link from "next/link";
import { getContentPerformance } from "@/lib/analytics";
import { query } from "@/lib/db";
import { parseRange, type SP } from "@/lib/params";
import { ah } from "@/lib/admin-nav";
import { Badge, Delta, PageHeader, Panel, PeriodPicker, Table, fmt, fmtPct } from "@/components/admin/ui";

export const metadata = { title: "Content" };
const SORTS = [["viewed", "Most viewed"], ["trending", "Trending"], ["engagement", "Highest engagement"], ["leads", "Most leads"], ["conversion", "Highest conversion"], ["demos", "Most demos"]];

export default async function Content({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range, get } = await parseRange(searchParams);
  const sort = get("sort") ?? "viewed";
  const [perf, insights] = await Promise.all([getContentPerformance(range, sort), query<{ id: string; title: string; status: string; published_at: Date | null }>("SELECT id,title,status,published_at FROM insights ORDER BY updated_at DESC LIMIT 50")]);
  return (
    <>
      <PageHeader title="Content" sub="Performance of Insights, product, consulting and landing pages." actions={<PeriodPicker base="/content" period={period} from={from} to={to} extra={{ sort }} />} />
      <nav aria-label="Sort" className="mb-4 flex flex-wrap gap-2 text-sm">
        {SORTS.map(([k, l]) => <Link key={k} href={`${ah("/content")}?p=${period}&sort=${k}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`} aria-current={sort === k} className={`rounded-full border px-3 py-1 ${sort === k ? "border-transparent bg-brand-gradient text-white" : "border-white/15 text-slate-300"}`}>{l}</Link>)}
      </nav>
      <Panel title="Performance">
        <Table head={["Content", "Views", "Uniques", "Avg engaged (s)", "Avg scroll", "CTA clicks", "Leads", "Conv.", "Demos", "Trend"]}
          rows={perf.map((x) => [<span key={x.slug}><Badge>{x.type}</Badge> {x.slug}</span>, fmt(x.views), fmt(x.uniques), fmt(x.avgEngagedSec), x.avgScrollPct === null ? "—" : `${x.avgScrollPct.toFixed(0)}%`, fmt(x.ctaClicks), fmt(x.leads), fmtPct(x.conversion), fmt(x.demos), <Delta key="t" value={x.trend} />])} />
        <p className="mt-3 text-xs text-slate-500">Leads = form submissions attributed to the page where the form was submitted. Engagement/scroll are averages over consented visits only.</p>
      </Panel>
      <Panel title="Insights articles" className="mt-5" note="">
        <div className="mb-4"><Link href={ah("/content/new")} className="btn-primary !py-2">New article</Link></div>
        <Table head={["Title", "Status", "Published"]} rows={insights.map((i) => [<Link key={i.id} className="text-brand-400 hover:underline" href={ah(`/content/${i.id}`)}>{i.title}</Link>, <Badge key="s" tone={i.status === "published" ? "green" : "amber"}>{i.status}</Badge>, i.published_at ? i.published_at.toISOString().slice(0, 10) : "—"])} empty="No articles yet. Create one here or with the AI Content Factory." />
      </Panel>
    </>
  );
}
