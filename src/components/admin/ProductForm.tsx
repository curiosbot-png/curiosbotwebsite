import { serialize } from "@/lib/genedit";
import type { Product } from "@/lib/content";
import { saveProduct } from "../../app/admin/content-actions";

const ta = (name: string, label: string, v: unknown, rows = 4, help?: string) => (
  <label className="block text-sm">{label}{help && <span className="ml-2 text-xs text-slate-500">{help}</span>}
    <textarea name={name} rows={rows} defaultValue={v ? serialize(v) : ""} className="field mt-1" /></label>
);
const inp = (name: string, label: string, v?: string | null, extra = "") => (
  <label className="block text-sm">{label}<input name={name} defaultValue={v ?? ""} className="field mt-1" {...(extra ? { placeholder: extra } : {})} /></label>
);

export function ProductForm({ p }: { p?: Partial<Product> }) {
  return (
    <form action={saveProduct} className="space-y-4">
      {p?.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-4 sm:grid-cols-2">{inp("name", "Name", p?.name)}{inp("slug", "Slug (URL)", p?.slug, "my-product")}</div>
      {inp("tagline", "Tagline", p?.tagline)}
      {ta("short_description", "Short description", p?.short_description, 2)}
      {ta("long_description", "Long description", p?.long_description, 5)}
      {ta("business_problem", "Business problem", p?.business_problem, 3)}
      {ta("solution", "Solution", p?.solution, 3)}
      {ta("how_it_works", "How it works", p?.how_it_works, 4, "one per line: Title :: Description")}
      {ta("features", "Capabilities", p?.features, 5, "Title :: Description")}
      {ta("benefits", "Business value", p?.benefits, 4, "Title :: Description")}
      {ta("use_cases", "Use cases", p?.use_cases, 4, "Title :: Description")}
      {ta("faq", "FAQ", p?.faq, 4, "Question :: Answer")}
      <div className="grid gap-4 sm:grid-cols-2">
        {inp("industries", "Industries (comma separated)", p?.industries?.join(", "))}{inp("cta_label", "CTA label", p?.cta_label ?? "Request a demo")}
        {inp("logo_url", "Logo URL", p?.logo_url)}{inp("hero_media_url", "Hero image/video URL (.mp4/.webm for video)", p?.hero_media_url)}
        {inp("video_url", "Video URL", p?.video_url)}{inp("demo_url", "Demo URL", p?.demo_url)}
        {inp("social_image_url", "Social (OpenGraph) image URL", p?.social_image_url)}
      </div>
      <label className="block text-sm">Screenshots<span className="ml-2 text-xs text-slate-500">one per line: https://url | alt text</span>
        <textarea name="screenshots" rows={3} defaultValue={(p?.screenshots ?? []).map((s) => `${s.url} | ${s.alt}`).join("\n")} className="field mt-1" /></label>
      <div className="grid gap-4 sm:grid-cols-2">{inp("seo_title", "SEO title (≤60 chars)", p?.seo_title)}{inp("seo_description", "SEO description (≤155 chars)", p?.seo_description)}</div>
      <button className="btn-primary">Save product</button>
    </form>
  );
}
