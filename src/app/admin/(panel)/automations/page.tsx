import { query } from "@/lib/db";
import { ackAlert } from "../../actions";
import { Badge, PageHeader, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "Automations" };
const WORKFLOWS = [
  ["product-creation", "Product creation", "Notifies the team when a product draft is created."],
  ["content-generation", "Content generation", "Scheduled topic ideas → drafts for review."],
  ["content-distribution", "Content distribution", "Approved content → social channels (approval gate before posting)."],
  ["lead-captured", "Lead capture + notification + CRM sync", "Confirmation email, internal alert, Salesforce lead (CRM write behind an approval switch)."],
  ["password-reset", "Password reset email", "Sends admin reset links via the transactional email provider."],
  ["analytics-ingestion", "Analytics ingestion", "Daily GA4, Search Console and ad-platform metrics → /api/ingest."],
  ["alerts", "Alerts", "Traffic spike, conversion drop, product trending, campaign thresholds."],
  ["ai-analysis", "AI analysis", "Weekly analyst run and digest to the team."],
];
export default async function Automations() {
  const [runs, alerts] = await Promise.all([
    query<{ workflow: string; status: string; created_at: Date; detail: Record<string, unknown> }>("SELECT workflow,status,created_at,detail FROM automation_runs ORDER BY created_at DESC LIMIT 25"),
    query<{ id: string; rule_key: string; message: string; created_at: Date; acknowledged: boolean }>("SELECT id,rule_key,message,created_at,acknowledged FROM alerts ORDER BY acknowledged, created_at DESC LIMIT 30"),
  ]);
  return (
    <>
      <PageHeader title="Automations" sub="n8n orchestrates workflows. Consequential external actions (publishing, CRM writes, campaigns) stop at an approval gate. Workflow JSON lives in the repository under n8n/workflows." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Workflows"><Table head={["Workflow", "Purpose"]} rows={WORKFLOWS.map(([k, n, d]) => [<span key={k}>{n}<br /><code className="text-xs text-slate-500">{k}</code></span>, <span key="d" className="text-left text-slate-400">{d}</span>])} /></Panel>
        <Panel title="Alerts" note="unacknowledged first">
          <Table head={["Alert", "When", ""]} rows={alerts.map((a) => [<span key={a.id} className={a.acknowledged ? "text-slate-500" : ""}><Badge tone={a.rule_key === "automation_failure" ? "red" : "violet"}>{a.rule_key.replace(/_/g, " ")}</Badge> {a.message}</span>, a.created_at.toISOString().slice(0, 16).replace("T", " "),
            a.acknowledged ? "" : <form key="f" action={ackAlert}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-brand-400 hover:underline">Acknowledge</button></form>])} empty="No alerts." />
        </Panel>
      </div>
      <Panel title="Recent runs" className="mt-5"><Table head={["Workflow", "Status", "When"]} rows={runs.map((r) => [r.workflow, <Badge key="s" tone={r.status === "success" ? "green" : r.status === "error" ? "red" : "amber"}>{r.status.replace("_", " ")}</Badge>, r.created_at.toISOString().slice(0, 16).replace("T", " ")])} empty="No workflow runs recorded yet." /></Panel>
    </>
  );
}
