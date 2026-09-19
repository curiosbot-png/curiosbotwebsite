import { one } from "@/lib/db";
import { askAction } from "../../../ai-actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";

export const metadata = { title: "Ask Curiosbot" };
const EXAMPLES = ["What are visitors interested in?", "What generated the most qualified leads this month?", "Which content converts?", "Which industries are interested in AI?", "Which product is gaining interest?", "What changed this week?", "Where should we investigate declining conversion?", "Which campaign generated demo requests?"];
type Out = { answer: string; used: string[]; data_gaps: string[]; tools: string[]; untraceableNumbers: number[] };

export default async function Ask({ searchParams }: { searchParams: Promise<{ error?: string; run?: string }> }) {
  const { error, run } = await searchParams;
  const res = run && /^[0-9a-f-]{36}$/.test(run) ? await one<{ input: { question: string }; output: Out }>("SELECT input,output FROM ai_generations WHERE id=$1 AND kind='ask'", [run]) : null;
  return (
    <>
      <PageHeader title="Ask Curiosbot" sub="Questions are answered by querying your authorised analytics data through a fixed set of read-only data tools — the model never writes SQL and cannot see data you haven't collected." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <Panel><form action={askAction} className="space-y-3"><label htmlFor="q" className="sr-only">Question</label><input id="q" name="question" required maxLength={500} defaultValue={res?.input.question ?? ""} placeholder="Ask about traffic, content, leads, campaigns…" className="field" list="ex" /><datalist id="ex">{EXAMPLES.map((e) => <option key={e} value={e} />)}</datalist>
        <div className="flex items-center gap-3"><select name="p" aria-label="Period" className="field max-w-[10rem] !py-2" defaultValue="30d"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option><option value="year">Year</option></select><SubmitButton pending="Querying data…">Ask</SubmitButton></div></form>
        <div className="mt-4 flex flex-wrap gap-2">{EXAMPLES.slice(0, 4).map((e) => <span key={e} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{e}</span>)}</div></Panel>
      {res && (
        <Panel title="Answer" className="mt-5">
          <p className="whitespace-pre-wrap text-slate-200">{res.output.answer}</p>
          {res.output.untraceableNumbers?.length > 0 && <p role="alert" className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">Warning: this answer contains numbers that could not be matched to the data ({res.output.untraceableNumbers.join(", ")}). Do not rely on them.</p>}
          {res.output.data_gaps?.length > 0 && <p className="mt-3 text-sm text-slate-400">Data gaps: {res.output.data_gaps.join("; ")}</p>}
          <p className="mt-3 text-xs text-slate-500">Data tools used: {res.output.tools.join(", ")}</p>
        </Panel>
      )}
    </>
  );
}
