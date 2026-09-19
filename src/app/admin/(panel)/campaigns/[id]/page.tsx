import { notFound } from "next/navigation";
import { getCampaigns } from "@/lib/analytics";
import { one } from "@/lib/db";
import { parseRange, type SP } from "@/lib/params";
import { SITE } from "@/lib/site";
import { setCampaignStatus } from "../../../actions";
import { Kpi, PageHeader, Panel, PeriodPicker, fmt, fmtEur, fmtPct } from "@/components/admin/ui";

export const metadata = { title: "Campaign" };
type C = { id: string; name: string; utm_campaign: string; channel: string | null; objective: string | null; status: string; budget_eur: string | null };

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await one<C>("SELECT * FROM campaigns WHERE id=$1", [id]);
  if (!c) notFound();
  const { period, from, to, range } = await parseRange(searchParams);
  const s = (await getCampaigns(range)).find((x) => x.campaign === c.utm_campaign);
  const tagged = `${SITE.url}/?utm_source=${encodeURIComponent((c.channel ?? "source").toLowerCase())}&utm_medium=cpc&utm_campaign=${c.utm_campaign}`;
  return (
    <>
      <PageHeader title={c.name} sub={c.objective ?? undefined} actions={<PeriodPicker base={`/campaigns/${c.id}`} period={period} from={from} to={to} />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Impressions" value={fmt(s?.impressions)} change={null} hint="From ad platform when connected" />
        <Kpi label="Clicks" value={fmt(s?.clicks)} change={null} />
        <Kpi label="Visits" value={fmt(s?.visits ?? 0)} change={null} />
        <Kpi label="Engaged visits" value={fmt(s?.engaged ?? 0)} change={null} />
        <Kpi label="Leads" value={fmt(s?.leads ?? 0)} change={null} />
        <Kpi label="Qualified leads" value={fmt(s?.qualified ?? 0)} change={null} />
        <Kpi label="Demos" value={fmt(s?.demos ?? 0)} change={null} />
        <Kpi label="Opportunities" value={fmt(s?.opportunities ?? 0)} change={null} />
        <Kpi label="Spend" value={fmtEur(s?.spend)} change={null} hint="Ad-platform spend; planned budget is separate" />
        <Kpi label="Conversion" value={fmtPct(s?.conversion ?? 0)} change={null} />
      </div>
      <Panel title="Tagged URL template" className="mt-5"><code className="block break-all rounded bg-white/5 p-3 text-xs text-slate-300">{tagged}</code><p className="mt-2 text-xs text-slate-500">Adjust utm_source/utm_medium per channel. Keep utm_campaign exactly as defined.</p></Panel>
      <Panel title="Status" className="mt-5"><form action={setCampaignStatus} className="flex gap-2"><input type="hidden" name="id" value={c.id} /><select name="status" defaultValue={c.status} className="field max-w-xs !py-2" aria-label="Status">{["planned", "active", "paused", "completed"].map((x) => <option key={x}>{x}</option>)}</select><button className="btn-ghost !py-2">Save</button></form>
        <p className="mt-2 text-xs text-slate-500">Changing status here does not start or stop spend on any ad platform. Launching and budget changes always require explicit human action in the platform.</p></Panel>
    </>
  );
}
