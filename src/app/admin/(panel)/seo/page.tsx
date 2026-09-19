import { getSearchConsole } from "@/lib/analytics";
import { parseRange, type SP } from "@/lib/params";
import { Delta, Empty, PageHeader, Panel, PeriodPicker, Table, fmt, fmtPct } from "@/components/admin/ui";
import { query } from "@/lib/db";

export const metadata = { title: "SEO" };

export default async function Seo({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range } = await parseRange(searchParams);
  const [g, integ] = await Promise.all([getSearchConsole(range), query<{ status: string; last_sync_at: Date | null }>("SELECT status,last_sync_at FROM integrations WHERE key='gsc'")]);
  const q = (rows: typeof g.queries) => rows.map((r) => [r.value, fmt(r.impressions), fmt(r.clicks), fmtPct(r.ctr), fmt(r.position, 1), <Delta key="d" value={r.change} />]);
  return (
    <>
      <PageHeader title="SEO — Search Console" sub="Data is synchronised by the n8n “Analytics ingestion” workflow using an authorised Google Search Console connection." actions={<PeriodPicker base="/seo" period={period} from={from} to={to} />} />
      {!g.connected ? (
        <Empty>Search Console is {integ[0]?.status === "connected" ? "connected but no rows have synced yet" : "not connected"}. Follow docs/integrations.md (Google Search Console) to authorise access; queries, pages, CTR and position will appear here.</Empty>
      ) : (
        <div className="grid gap-5">
          <Panel title="Top queries"><Table head={["Query", "Impressions", "Clicks", "CTR", "Avg. position", "Clicks vs prev."]} rows={q(g.queries)} /></Panel>
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Rising queries"><Table head={["Query", "Impr.", "Clicks", "CTR", "Pos.", "Change"]} rows={q(g.rising)} empty="None detected." /></Panel>
            <Panel title="Declining queries"><Table head={["Query", "Impr.", "Clicks", "CTR", "Pos.", "Change"]} rows={q(g.declining)} empty="None detected." /></Panel>
            <Panel title="Content opportunities" note="≥50 impr., CTR <3%, pos. 4–15"><Table head={["Query", "Impr.", "Clicks", "CTR", "Pos.", "Change"]} rows={q(g.opportunities)} empty="None detected." /></Panel>
          </div>
          <Panel title="Landing pages"><Table head={["Page", "Impressions", "Clicks", "CTR", "Avg. position", "Clicks vs prev."]} rows={q(g.pages)} /></Panel>
        </div>
      )}
    </>
  );
}
