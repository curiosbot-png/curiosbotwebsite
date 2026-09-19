import Link from "next/link";
import { getCampaigns } from "@/lib/analytics";
import { query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { parseRange, type SP } from "@/lib/params";
import { createCampaign } from "../../actions";
import { Badge, PageHeader, Panel, PeriodPicker, Table, fmt, fmtEur, fmtPct } from "@/components/admin/ui";

export const metadata = { title: "Campaigns" };

export default async function Campaigns({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range } = await parseRange(searchParams);
  const [stats, defs] = await Promise.all([getCampaigns(range), query<{ id: string; name: string; utm_campaign: string; status: string; channel: string | null }>("SELECT id,name,utm_campaign,status,channel FROM campaigns ORDER BY created_at DESC")]);
  return (
    <>
      <PageHeader title="Campaigns" sub="Attribution uses consistent UTM parameters. Campaign identifiers are only recorded for visitors who gave marketing consent." actions={<PeriodPicker base="/campaigns" period={period} from={from} to={to} />} />
      <Panel title="Defined campaigns"><Table head={["Name", "utm_campaign", "Channel", "Status"]} rows={defs.map((c) => [<Link key={c.id} className="text-brand-400 hover:underline" href={ah(`/campaigns/${c.id}`)}>{c.name}</Link>, c.utm_campaign, c.channel ?? "—", <Badge key="s">{c.status}</Badge>])} empty="No campaigns yet." /></Panel>
      <Panel title="Performance" className="mt-5"><Table head={["utm_campaign", "Impressions", "Clicks", "Visits", "Engaged", "Leads", "Qualified", "Demos", "Opps", "Spend", "Conv."]}
        rows={stats.map((s) => [s.campaign, fmt(s.impressions), fmt(s.clicks), fmt(s.visits), fmt(s.engaged), fmt(s.leads), fmt(s.qualified), fmt(s.demos), fmt(s.opportunities), fmtEur(s.spend), fmtPct(s.conversion)])} empty="No campaign-tagged traffic yet." />
        <p className="mt-3 text-xs text-slate-500">Impressions, clicks and spend come from connected ad platforms; “—” means not connected.</p></Panel>
      <Panel title="New campaign" className="mt-5">
        <form action={createCampaign} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Name<input name="name" required className="field mt-1" /></label>
          <label className="text-sm">utm_campaign (slug)<input name="utm_campaign" required pattern="[a-z0-9_-]{2,60}" className="field mt-1" placeholder="ai-agents-q4" /></label>
          <label className="text-sm">Channel<input name="channel" className="field mt-1" placeholder="LinkedIn" /></label>
          <label className="text-sm">Planned budget (EUR)<input name="budget_eur" type="number" min="0" step="1" className="field mt-1" /></label>
          <label className="text-sm sm:col-span-2">Objective<input name="objective" className="field mt-1" /></label>
          <button className="btn-primary sm:col-span-2 sm:justify-self-start">Create campaign</button>
        </form>
      </Panel>
    </>
  );
}
