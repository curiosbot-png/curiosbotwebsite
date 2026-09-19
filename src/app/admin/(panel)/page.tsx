import Link from "next/link";
import { getAcquisition, getContentPerformance, getDailyVisitors, getFunnel, getInterestThemes, getKpis, getTopLeads, investigateNext, pctChange } from "@/lib/analytics";
import { parseRange, type SP } from "@/lib/params";
import { ah } from "@/lib/admin-nav";
import { Badge, Empty, Kpi, PageHeader, Panel, PeriodPicker, Table, fmt, fmtPct, stageTone } from "@/components/admin/ui";
import { HBars, LineChart } from "@/components/admin/charts";

export const metadata = { title: "Marketing Command Center" };

export default async function Overview({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range } = await parseRange(searchParams);
  const [k, funnel, content, themes, acq, leads, daily] = await Promise.all([
    getKpis(range), getFunnel(range), getContentPerformance(range, "viewed"), getInterestThemes(range), getAcquisition(range), getTopLeads(range), getDailyVisitors(range),
  ]);
  const c = k.cur, p = k.prev;
  const next = investigateNext(k, funnel, themes);
  const noData = c.pageViews === 0 && c.newLeads === 0;
  return (
    <>
      <PageHeader title="Marketing Command Center" sub="First-party, consent-based data from curiosbot.com. Connected platforms (GA4, Search Console, ad platforms) appear in SEO and Advertising when synced." actions={<PeriodPicker base="" period={period} from={from} to={to} />} />
      {noData && <div className="mb-6"><Empty>No consented visitor data has been recorded for this period yet. Data appears once visitors accept analytics cookies.</Empty></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Visitors" value={fmt(c.visitors)} change={pctChange(c.visitors, p.visitors)} hint="Consented visitors with at least one page view" />
        <Kpi label="Page views" value={fmt(c.pageViews)} change={pctChange(c.pageViews, p.pageViews)} />
        <Kpi label="Engaged visitors" value={fmt(c.engagedVisitors)} change={pctChange(c.engagedVisitors, p.engagedVisitors)} hint="15+ seconds active, or 2+ page views" />
        <Kpi label="New leads" value={fmt(c.newLeads)} change={pctChange(c.newLeads, p.newLeads)} />
        <Kpi label="Qualified leads" value={fmt(c.qualifiedLeads)} change={pctChange(c.qualifiedLeads, p.qualifiedLeads)} hint="High intent or sales ready" />
        <Kpi label="Demo requests" value={fmt(c.demoRequests)} change={pctChange(c.demoRequests, p.demoRequests)} />
        <Kpi label="Lead conversion" value={fmtPct(c.leadConversionRate)} change={pctChange(c.leadConversionRate, p.leadConversionRate)} hint="Leads ÷ consented visitors" />
        <Kpi label="Marketing-sourced leads" value={fmt(c.marketingLeads)} change={pctChange(c.marketingLeads, p.marketingLeads)} hint="Leads with campaign or paid/email/social attribution" />
      </div>
      <p className="mt-2 text-xs text-slate-500">Analytics counts only visitors who consented, so they understate total traffic. Use GA4 for total-traffic reporting.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Panel title="Are we attracting attention?" className="lg:col-span-2" note="daily consented visitors"><LineChart series={daily} label="Daily visitors" /></Panel>
        <Panel title="What should marketing investigate next?"><ul className="space-y-3 text-sm text-slate-300">{next.map((n) => <li key={n} className="flex gap-2"><span className="text-signal" aria-hidden>→</span>{n}</li>)}</ul></Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Who is converting? — funnel" note="stage conversion in brackets">
          <HBars rows={funnel.map((s) => ({ label: s.label, value: s.count, sub: s.stageConv === null ? undefined : `${s.stageConv.toFixed(0)}%` }))} />
          <Link href={ah("/marketing")} className="mt-4 inline-block text-sm text-brand-400 hover:underline">Full funnel with filters →</Link>
        </Panel>
        <Panel title="What are people interested in?" note="weighted interest, not raw views">
          {themes.filter((t) => t.interest > 0).length ? <HBars rows={themes.filter((t) => t.interest > 0).slice(0, 7).map((t) => ({ label: t.label, value: t.interest, sub: t.change === null ? "new" : `${t.change >= 0 ? "+" : ""}${t.change.toFixed(0)}%` }))} /> : <Empty>No theme activity yet.</Empty>}
          <Link href={ah("/analytics")} className="mt-4 inline-block text-sm text-brand-400 hover:underline">What people care about →</Link>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Which content is working?">
          <Table head={["Content", "Views", "CTA clicks", "Leads"]} rows={content.slice(0, 6).map((x) => [<Link key={x.slug} className="hover:text-white" href={ah("/content")}>{x.type}/{x.slug}</Link>, fmt(x.views), fmt(x.ctaClicks), fmt(x.leads)])} />
        </Panel>
        <Panel title="Where are visitors coming from?">
          <Table head={["Channel", "Visitors", "Leads", "Conv."]} rows={acq.filter((a) => a.visitors || a.leads).map((a) => [a.channel, fmt(a.visitors), fmt(a.leads), fmtPct(a.conversion)])} />
        </Panel>
      </div>

      <Panel title="Which leads show the strongest business intent?" className="mt-5">
        <Table head={["Lead", "Company", "Score", "Stage"]} rows={leads.map((l) => [<Link key={l.id} className="text-brand-400 hover:underline" href={ah(`/leads/${l.id}`)}>{l.name}</Link>, l.company ?? "—", fmt(l.score), <Badge key="s" tone={stageTone(l.stage)}>{l.stage.replace("_", " ")}</Badge>])} empty="No leads in this period." />
      </Panel>
    </>
  );
}
