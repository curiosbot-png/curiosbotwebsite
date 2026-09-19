import { getAudience } from "@/lib/analytics";
import { parseRange, type SP } from "@/lib/params";
import { Empty, PageHeader, Panel, PeriodPicker, Table, fmt } from "@/components/admin/ui";

export const metadata = { title: "Audience" };
type Row = { label: string; leads: number; qualified: number; demos: number };

export default async function Audience({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range } = await parseRange(searchParams);
  const a = await getAudience(range);
  const sections: [string, Row[]][] = [["Industry", a.industry], ["Company size", a.companySize], ["Country / region", a.country], ["Job title (as entered)", a.jobTitle], ["Service interest", a.service], ["Product interest", a.product]];
  const empty = sections.every(([, r]) => r.length === 0);
  return (
    <>
      <PageHeader title="Audience intelligence" sub="Aggregated from professional details voluntarily submitted in forms. No sensitive personal characteristics are collected or inferred. Small groups should be interpreted cautiously." actions={<PeriodPicker base="/audience" period={period} from={from} to={to} />} />
      {empty ? <Empty>No leads in this period yet. Audience breakdowns appear as enquiries arrive.</Empty> : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sections.map(([t, rows]) => (
            <Panel key={t} title={t}><Table head={["Segment", "Leads", "Qualified", "Demos"]} rows={rows.map((r) => [r.label, fmt(r.leads), fmt(r.qualified), fmt(r.demos)])} empty="No data." /></Panel>
          ))}
        </div>
      )}
    </>
  );
}
