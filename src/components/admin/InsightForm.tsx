import { saveInsight } from "../../app/admin/content-actions";
type I = { id?: string; title?: string; slug?: string; summary?: string | null; body_md?: string; theme?: string | null; author?: string | null; hero_image_url?: string | null; seo_title?: string | null; seo_description?: string | null };
export function InsightForm({ a }: { a?: I }) {
  return (
    <form action={saveInsight} className="space-y-4">
      {a?.id && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Title<input name="title" required defaultValue={a?.title} className="field mt-1" /></label>
        <label className="block text-sm">Slug<input name="slug" required defaultValue={a?.slug} className="field mt-1" placeholder="ai-agents-in-the-enterprise" /></label>
      </div>
      <label className="block text-sm">Summary<textarea name="summary" rows={2} defaultValue={a?.summary ?? ""} className="field mt-1" /></label>
      <label className="block text-sm">Body (Markdown)<textarea name="body_md" rows={18} defaultValue={a?.body_md} className="field mt-1 font-mono text-xs" /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">Theme key<input name="theme" defaultValue={a?.theme ?? ""} className="field mt-1" placeholder="ai-agents" /></label>
        <label className="block text-sm">Author<input name="author" defaultValue={a?.author ?? ""} className="field mt-1" /></label>
        <label className="block text-sm">Hero image URL<input name="hero_image_url" defaultValue={a?.hero_image_url ?? ""} className="field mt-1" /></label>
        <label className="block text-sm">SEO title<input name="seo_title" defaultValue={a?.seo_title ?? ""} className="field mt-1" /></label>
        <label className="block text-sm sm:col-span-2">SEO description<input name="seo_description" defaultValue={a?.seo_description ?? ""} className="field mt-1" /></label>
      </div>
      <button className="btn-primary">Save article</button>
    </form>
  );
}
