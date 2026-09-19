import Link from "next/link";
import { query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { Badge, PageHeader, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "Products" };
export default async function ProductsAdmin() {
  const rows = await query<{ id: string; name: string; slug: string; status: string; published_at: Date | null; updated_at: Date }>("SELECT id,name,slug,status,published_at,updated_at FROM products ORDER BY updated_at DESC");
  return (
    <>
      <PageHeader title="Products" sub="Products are database-driven; publishing a product automatically creates /products/[slug]." actions={<div className="flex gap-2"><Link href={ah("/ai-studio/product")} className="btn-primary !py-2">AI Product Creator</Link><Link href={ah("/products/new")} className="btn-ghost !py-2">Add manually</Link></div>} />
      <Panel><Table head={["Product", "Slug", "Status", "Updated"]} rows={rows.map((r) => [<Link key={r.id} className="text-brand-400 hover:underline" href={ah(`/products/${r.id}`)}>{r.name}</Link>, r.slug, <Badge key="s" tone={r.status === "published" ? "green" : "amber"}>{r.status.replace("_", " ")}</Badge>, r.updated_at.toISOString().slice(0, 10)])} empty="No products yet." /></Panel>
    </>
  );
}
