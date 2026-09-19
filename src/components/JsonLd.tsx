export function JsonLd({ data }: { data: object }) {
  // JSON is serialised server-side from trusted data; "<" is escaped to prevent script-tag breakout.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
