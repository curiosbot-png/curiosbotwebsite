import Link from "next/link";
import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Product } from "@/lib/content";
import { setProductStatus } from "../../../content-actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { StatusControls } from "@/components/admin/StatusControls";

export const metadata = { title: "Edit product" };
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await one<Product>("SELECT * FROM products WHERE id=$1", [id]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.name} sub={`/products/${p.slug}`} actions={p.status === "published" ? <Link href={`/products/${p.slug}`} className="btn-ghost !py-2" target="_blank">View live</Link> : undefined} />
      <Panel title="Publishing workflow" className="mb-5"><StatusControls id={p.id} status={p.status} role={user.role} action={setProductStatus} /></Panel>
      <Panel><ProductForm p={p} /></Panel>
    </>
  );
}
