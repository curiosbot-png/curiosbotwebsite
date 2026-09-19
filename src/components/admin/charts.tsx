// Dependency-free SVG charts (server-renderable, accessible via <title>/<desc> and adjacent tables/labels).
export function LineChart({ series, height = 120, label }: { series: { day: string; value: number }[]; height?: number; label: string }) {
  if (series.length < 2) return <p className="text-xs text-slate-500">Not enough data points yet.</p>;
  const w = 600, pad = 4, max = Math.max(...series.map((s) => s.value), 1);
  const pts = series.map((s, i) => [pad + (i / (series.length - 1)) * (w - pad * 2), height - pad - (s.value / max) * (height - pad * 2)] as const);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label={`${label}: ${series[0].day} to ${series[series.length - 1].day}, peak ${Math.round(max)}`}>
      <defs><linearGradient id="lc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0067FF" stopOpacity=".35" /><stop offset="1" stopColor="#0067FF" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`${pad},${height - pad} ${line} ${w - pad},${height - pad}`} fill="url(#lc)" />
      <polyline points={line} fill="none" stroke="#5CA0FF" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function HBars({ rows, unit = "" }: { rows: { label: string; value: number; sub?: string }[]; unit?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="text-slate-200">{r.label}</span><span className="tabular-nums text-slate-300">{r.value.toLocaleString("en-GB")}{unit}{r.sub && <span className="ml-2 text-xs text-slate-500">{r.sub}</span>}</span></div>
          <div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full rounded bg-brand-gradient" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
