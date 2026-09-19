// Decision-intelligence network: enterprise systems → data → AI core → automation → decisions → outcomes.
// Pure SVG + CSS animation (no JS loop, no canvas) so it costs nothing on Core Web Vitals.
const SRC = [
  { y: 90, label: "PLM" }, { y: 170, label: "Salesforce" }, { y: 250, label: "ERP & data" }, { y: 330, label: "Documents" },
];
const OUT = [
  { y: 110, label: "AI agents" }, { y: 210, label: "Automation" }, { y: 310, label: "Decisions" },
];

export function HeroVisual() {
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Diagram: enterprise systems such as PLM and Salesforce feed data into an AI core that drives agents, automation and decisions, producing measurable business outcomes." className="h-auto w-full">
      <defs>
        <linearGradient id="hv-g" x1="0" x2="1"><stop offset="0" stopColor="#0067FF" /><stop offset="1" stopColor="#7C3AED" /></linearGradient>
        <radialGradient id="hv-core" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#7C3AED" stopOpacity=".55" /><stop offset="1" stopColor="#0067FF" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="320" cy="210" r="150" fill="url(#hv-core)" />
      {SRC.map((s) => (
        <path key={s.label} d={`M150 ${s.y} C 230 ${s.y}, 230 210, 285 210`} fill="none" stroke="url(#hv-g)" strokeWidth="1.5" className="flow-line" opacity=".8" />
      ))}
      {OUT.map((o) => (
        <path key={o.label} d={`M355 210 C 410 210, 410 ${o.y}, 490 ${o.y}`} fill="none" stroke="#22D3EE" strokeWidth="1.5" className="flow-line" opacity=".8" />
      ))}
      {SRC.map((s, i) => (
        <g key={s.label} className="pulse-node" style={{ animationDelay: `${i * 0.4}s` }}>
          <rect x="30" y={s.y - 18} width="120" height="36" rx="18" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.18)" />
          <text x="90" y={s.y + 5} textAnchor="middle" fontSize="13" fill="#E2E8F0" fontFamily="var(--font-open-sans), sans-serif">{s.label}</text>
        </g>
      ))}
      <g>
        <circle cx="320" cy="210" r="42" fill="#070614" stroke="url(#hv-g)" strokeWidth="2" />
        <circle cx="320" cy="210" r="58" fill="none" stroke="rgba(124,58,237,.5)" strokeDasharray="2 8" className="flow-line" />
        <text x="320" y="206" textAnchor="middle" fontSize="15" fontWeight="600" fill="#fff" fontFamily="var(--font-poppins), sans-serif">AI</text>
        <text x="320" y="224" textAnchor="middle" fontSize="10" fill="#94A3B8" letterSpacing="1.5">CORE</text>
      </g>
      {OUT.map((o, i) => (
        <g key={o.label} className="pulse-node" style={{ animationDelay: `${i * 0.5}s` }}>
          <rect x="490" y={o.y - 18} width="120" height="36" rx="18" fill="rgba(34,211,238,.07)" stroke="rgba(34,211,238,.4)" />
          <text x="550" y={o.y + 5} textAnchor="middle" fontSize="13" fill="#E2E8F0" fontFamily="var(--font-open-sans), sans-serif">{o.label}</text>
        </g>
      ))}
      <text x="90" y="390" textAnchor="middle" fontSize="10" fill="#64748B" letterSpacing="2">SYSTEMS &amp; DATA</text>
      <text x="320" y="390" textAnchor="middle" fontSize="10" fill="#64748B" letterSpacing="2">INTELLIGENCE</text>
      <text x="550" y="390" textAnchor="middle" fontSize="10" fill="#64748B" letterSpacing="2">BUSINESS OUTCOMES</text>
    </svg>
  );
}
