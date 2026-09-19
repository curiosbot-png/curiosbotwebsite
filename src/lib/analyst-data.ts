import { z } from "zod";
import * as A from "./analytics";
import { chatJson, snapshotNumbers, unverifiedNumbers } from "./ai";

// Whitelisted data tools. The model can only choose among these — it never writes SQL.
const TOOLS = {
  kpis: async (r: A.Range) => { const { cur, prev } = await A.getKpis(r); return { cur, prev, change: Object.fromEntries((Object.keys(cur) as (keyof A.Kpis)[]).map((k) => [k, A.pctChange(cur[k], prev[k])])) }; },
  funnel: (r: A.Range) => A.getFunnel(r),
  content: (r: A.Range) => A.getContentPerformance(r, "viewed").then((x) => x.slice(0, 15)),
  themes: (r: A.Range) => A.getInterestThemes(r).then((x) => x.map(({ series, ...rest }) => rest)),
  acquisition: (r: A.Range) => A.getAcquisition(r),
  campaigns: (r: A.Range) => A.getCampaigns(r),
  products: (r: A.Range) => A.getProductIntel(r),
  audience: (r: A.Range) => A.getAudience(r),
  attribution: (r: A.Range) => A.getAttribution(r),
  search_console: (r: A.Range) => A.getSearchConsole(r),
} as const;
export type ToolName = keyof typeof TOOLS;
export const TOOL_NAMES = Object.keys(TOOLS) as ToolName[];

export async function buildSnapshot(r: A.Range, names: ToolName[] = TOOL_NAMES) {
  const entries = await Promise.all(names.map(async (n) => [n, await TOOLS[n](r)] as const));
  return { period: { from: r.from.toISOString().slice(0, 10), to: r.to.toISOString().slice(0, 10), previous_from: r.prevFrom.toISOString().slice(0, 10) }, ...Object.fromEntries(entries) };
}

const planSchema = z.object({ tools: z.array(z.string()).default([]) });
const answerSchema = z.object({ answer: z.string(), used: z.array(z.string()).default([]), data_gaps: z.array(z.string()).default([]) });

export async function askCuriosbot(question: string, r: A.Range) {
  const plan = await chatJson(
    `Choose which analytics data tools are needed to answer the marketing question. Available: ${TOOL_NAMES.join(", ")}. Return JSON {"tools":[names]} with at most 4 names.`,
    question, planSchema, 0);
  const names = (plan.tools ?? []).filter((t): t is ToolName => (TOOL_NAMES as string[]).includes(t)).slice(0, 4);
  const chosen = names.length ? names : (["kpis", "content"] as ToolName[]);
  const data = await buildSnapshot(r, chosen);
  const out = await chatJson(
    `You are Ask Curiosbot. Answer ONLY from the provided JSON data. Never invent metrics; if data is empty or missing say so in data_gaps. Do not state causation. Use provided change values rather than computing new percentages. Return JSON {"answer": string (concise, may use short paragraphs), "used": [tool names], "data_gaps": [strings]}.`,
    `Question: ${question}\n\nData:\n${JSON.stringify(data)}`, answerSchema, 0.1);
  const bad = unverifiedNumbers(out.answer, snapshotNumbers(data));
  return { ...out, tools: chosen, data, untraceableNumbers: bad };
}
