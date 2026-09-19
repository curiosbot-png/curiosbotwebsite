import { one } from "@/lib/db";
import { runAnalystAction } from "../../../ai-actions";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const metadata = { title: "AI Marketing Analyst" };
type Out = { insights: { observation: string; evidence: string[]; possible_explanation: string; recommended_experiment: string; confidence: string }[]; investigate_next: string[]; dropped: { index: number; numbers: number[] }[] };

export default async function Analyst({ searchParams }: { searchParams: Promise<{ error?: string; run?: string }> }) {
  const { error, run } = await searchParams;
  const res = run && /^[0-9a-f-]{36}$/.test(run) ? await one<{ output: Out; input: { period: string }; created_at: Date }>("SELECT output,input,created_at FROM ai_generations WHERE id=$1 AND kind='analyst'", [run]) : null;
  return (
    <>
      <PageHeader title="AI Marketing Analyst" sub="Reads your authorised first-party data, Search Console and ad data (when connected). Every number in an insight is checked against the underlying data; insights containing untraceable numbers are discarded. Explanations are hypotheses, not causal claims." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <Panel><form action={runAnalystAction} className="flex flex-wrap items-end gap-3"><label className="text-sm">Period<select name="p" className="field mt-1 !py-2" defaultValue="30d"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option><option value="year">Year</option></select></label><SubmitButton pending="Analysing…">Run analysis</SubmitButton></form></Panel>
      {res && (
        <div className="mt-5 space-y-4">
          {res.output.insights.length === 0 && <Panel><p className="text-sm text-slate-300">No verifiable insights were produced for this period. This usually means there is not enough data yet.</p></Panel>}
          {res.output.insights.map((i, n) => (
            <Panel key={n} title={`Insight ${n + 1}`} note={`confidence: ${i.confidence}`}>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-xs uppercase tracking-wider text-signal">Observation</dt><dd className="mt-1 text-slate-200">{i.observation}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-violet-400">Possible explanation</dt><dd className="mt-1 text-slate-300">{i.possible_explanation}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-emerald-400">Recommended experiment</dt><dd className="mt-1 text-slate-300">{i.recommended_experiment}</dd></div>
                {i.evidence.length > 0 && <div><dt className="text-xs uppercase tracking-wider text-slate-500">Evidence</dt><dd className="mt-1 flex flex-wrap gap-1">{i.evidence.map((e) => <Badge key={e}>{e}</Badge>)}</dd></div>}
              </dl>
            </Panel>
          ))}
          {res.output.investigate_next.length > 0 && <Panel title="Investigate next"><ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{res.output.investigate_next.map((x) => <li key={x}>{x}</li>)}</ul></Panel>}
          {res.output.dropped?.length > 0 && <p className="text-xs text-slate-500">{res.output.dropped.length} insight(s) were withheld because they contained numbers that could not be traced to the data.</p>}
        </div>
      )}
    </>
  );
}
