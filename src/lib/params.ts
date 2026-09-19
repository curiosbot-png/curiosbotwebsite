import { resolveRange } from "./analytics";
export type SP = Promise<Record<string, string | string[] | undefined>>;
export async function parseRange(sp: SP) {
  const q = await sp;
  const g = (k: string) => (Array.isArray(q[k]) ? (q[k] as string[])[0] : (q[k] as string | undefined));
  const period = g("p") ?? "30d";
  return { period, from: g("from"), to: g("to"), range: resolveRange(period, g("from"), g("to")), get: g };
}
