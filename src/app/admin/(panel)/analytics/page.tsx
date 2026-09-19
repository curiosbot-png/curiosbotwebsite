import { getInterestThemes, getProductIntel } from "@/lib/analytics";
import { parseRange, type SP } from "@/lib/params";
import { Delta, Empty, PageHeader, Panel, PeriodPicker, Table, fmt } from "@/components/admin/ui";
import { LineChart } from "@/components/admin/charts";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range } = await parseRange(searchParams);
  const [themes, products] = await Promise.all([getInterestThemes(range), getProductIntel(range)]);
  const active = themes.filter((t) => t.interest > 0 || t.prevInterest > 0);
  const top = (fn: (p: (typeof products)[number]) => number, suffix = "") => [...products].sort((a, b) => fn(b) - fn(a)).filter((p) => fn(p) > 0).slice(0, 3).map((p) => `${p.name} (${Math.round(fn(p))}${suffix})`).join(", ") || "—";
  return (
    <>
      <PageHeader title="What people care about" sub="Themes are scored from weighted signals — views ×1, engaged visits ×3, CTA clicks ×5, downloads ×8, form submissions ×15, demo requests ×20 — plus a bonus for repeat visitors. One page view is never treated as commercial intent." actions={<PeriodPicker base="/analytics" period={period} from={from} to={to} />} />
      {active.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((t) => (
            <Panel key={t.key} title={t.label} note={`interest ${fmt(t.interest)}`}>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>{fmt(t.views)} views · {fmt(t.ctaClicks)} CTA clicks · {fmt(t.repeatVisitors)} repeat</span><Delta value={t.change} /></div>
              <LineChart series={t.series} height={70} label={`${t.label} interest over time`} />
            </Panel>
          ))}
        </div>
      ) : <Empty>No theme activity in this period yet.</Empty>}

      <Panel title="Product intelligence" className="mt-6">
        <div className="mb-4 grid gap-3 text-sm md:grid-cols-2">
          <p><span className="text-slate-400">Most viewed:</span> {top((p) => p.views)}</p>
          <p><span className="text-slate-400">Trending:</span> {top((p) => ((p.trend ?? 0) > 0 ? p.trend ?? 0 : 0), "%")}</p>
          <p><span className="text-slate-400">Most engaging:</span> {top((p) => p.engaged)}</p>
          <p><span className="text-slate-400">Most demo requests:</span> {top((p) => p.demos)}</p>
          <p><span className="text-slate-400">Most leads:</span> {top((p) => p.leads)}</p>
        </div>
        <Table head={["Product", "Views", "Unique", "Repeat", "Engaged", "CTA clicks", "Demos", "Leads", "Trend"]} rows={products.map((p) => [p.name, fmt(p.views), fmt(p.uniques), fmt(p.repeat), fmt(p.engaged), fmt(p.cta), fmt(p.demos), fmt(p.leads), <Delta key="t" value={p.trend} />])} empty="No products yet. Add one under Products." />
      </Panel>
    </>
  );
}
