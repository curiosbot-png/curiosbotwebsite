// Generic serialise/parse so any AI output object can be edited as plain text in the admin, then stored back with its original shape.
type Pair = { title: string; description: string };
const isPairs = (v: unknown): v is Pair[] => Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object" && "title" in x && "description" in x);
const isFaq = (v: unknown): v is { q: string; a: string }[] => Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object" && "q" in x && "a" in x);

export function serialize(v: unknown): string {
  if (typeof v === "string") return v;
  if (isPairs(v)) return v.map((p) => `${p.title} :: ${p.description}`).join("\n");
  if (isFaq(v)) return v.map((p) => `${p.q} :: ${p.a}`).join("\n");
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.join("\n---\n");
  return JSON.stringify(v, null, 2);
}

export function parseLike(original: unknown, text: string): unknown {
  if (typeof original === "string") return text;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (isPairs(original)) return lines.map((l) => { const [t, ...d] = l.split("::"); return { title: t.trim(), description: d.join("::").trim() }; });
  if (isFaq(original)) return lines.map((l) => { const [q, ...a] = l.split("::"); return { q: q.trim(), a: a.join("::").trim() }; });
  if (Array.isArray(original) && original.every((x) => typeof x === "string")) return text.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
  try { return JSON.parse(text); } catch { return original; }
}

/** Parse "Title :: Description" lines for hand-edited product forms. */
export function parsePairs(text: string): Pair[] { return parseLike([{ title: "", description: "" }], text) as Pair[]; }
export function parseFaq(text: string): { q: string; a: string }[] { return parseLike([{ q: "", a: "" }], text) as { q: string; a: string }[]; }
