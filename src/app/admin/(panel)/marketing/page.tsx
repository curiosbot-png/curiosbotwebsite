import { getAcquisition, getAttribution, getFunnel } from "@/lib/analytics";
import { query } from "@/lib/db";
import { parseRange, type SP } from "@/lib/params";
import { Delta, Empty, PageHeader, Panel, PeriodPicker, Table, fmt, fmtEur, fmtPct } from "@/components/admin/ui";
import { pctChange } from "@/lib/analytics";

export const metadata = { title: "Marketing funnel" };

export default async function Marketing({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range, get } = await parseRange(searchParams);
  const filters = { campaign: get("campaign"), source: get("source"), device: get("device"), country: get("country") };
  const [funnel, acq, attribution, campaigns] = await Promise.all([
    getFunnel(range, filters), getAcquisition(range), getAttribution(range), query<{ utm_campaign: string }>("SELECT utm_campaign FROM campaigns ORDER BY name"),
  ]);
  const extra = Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>;
  const top = funnel[0]?.count || 0;
  return (
    <>
      <PageHeader title="Marketing funnel" sub="Visitors to customers. Stages 1–3 come from consented first-party events; stages 4–8 from leads and their status." actions={<PeriodPicker base="/marketing" period={period} from={from} to={to} extra={extra} />} />
      <form className="mb-5 flex flex-wrap items-end gap-3 text-sm" method="get">
        <input type="hidden" name="p" value={period} />{from && <input type="hidden" name="from" value={from} />}{to && <input type="hidden" name="to" value={to} />}
        <label>Campaign<select name="campaign" defaultValue={filters.campaign ?? ""} className="field mt-1 !py-2"><option value="">All</option>{campaigns.map((c) => <option key={c.utm_campaign}>{c.utm_campaign}</option>)}</select></label>
        <label>Source<input name="source" defaultValue={filters.source ?? ""} placeholder="e.g. linkedin" className="field mt-1 !py-2" /></label>
        <label>Device<select name="device" defaultValue={filters.device ?? ""} className="field mt-1 !py-2"><option value="">All</option><option>desktop</option><option>mobile</option><option>tablet</option></select></label>
        <label>Country<input name="country" defaultValue={filters.country ?? ""} placeholder="ES" className="field mt-1 !py-2" /></label>
        <button className="btn-ghost !py-2">Apply</button>
      </form>
      <Panel title="Funnel">
        <Table head={["Stage", "Count", "Stage conv.", "Drop-off", "Trend vs prev."]} rows={funnel.map((s) => [
          <div key={s.key} className="min-w-[10rem]"><div>{s.label}</div><div className="mt-1 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-brand-gradient" style={{ width: `${top ? (s.count / top) * 100 : 0}%` }} /></div></div>,
          fmt(s.count), fmtPct(s.stageConv), fmtPct(s.dropOff), <Delta key="d" value={pctChange(s.count, s.prevCount)} />])} />
        <p className="mt-3 text-xs text-slate-500">Engaged = 15+ seconds active or 2+ page views. High-intent = CTA click, download or 4+ page views. Campaign/source filters also filter leads; device/country filter visitor stages only.</p>
      </Panel>
      <Panel title="Acquisition by channel" className="mt-5" note="cost columns require a connected ad platform">
        <Table head={["Channel", "Visitors", "Engaged", "Leads", "Qualified", "Demos", "Conv.", "Spend", "CPC", "CPL", "Cost/qualified", "Cost/demo"]}
          rows={acq.map((a) => [a.channel, fmt(a.visitors), fmt(a.engaged), fmt(a.leads), fmt(a.qualified), fmt(a.demos), fmtPct(a.conversion), fmtEur(a.spend), fmtEur(a.cpc), fmtEur(a.cpl), fmtEur(a.costPerQualified), fmtEur(a.costPerDemo)])} />
        <p className="mt-3 text-xs text-slate-500">“—” means the platform is not connected or has no data. Nothing is estimated.</p>
      </Panel>
      <Panel title="Content attribution" className="mt-5" note="associations, not proof of causation">
        {attribution.length ? <Table head={["Content", "First touch", "Last touch", "Assisted (leads)"]} rows={attribution.map((a) => [`${a.content_type}/${a.content_slug}`, fmt(Number(a.first_touch)), fmt(Number(a.last_touch)), fmt(Number(a.assisted))])} />
          : <Empty>Attribution needs leads whose visitors gave analytics and marketing consent before submitting a form.</Empty>}
      </Panel>
    </>
  );
}
