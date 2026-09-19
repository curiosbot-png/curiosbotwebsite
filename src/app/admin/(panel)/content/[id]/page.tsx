import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Insight } from "@/lib/content";
import { setInsightStatus } from "../../../content-actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { InsightForm } from "@/components/admin/InsightForm";
import { StatusControls } from "@/components/admin/StatusControls";

export const metadata = { title: "Edit article" };
export default async function EditInsight({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const a = await one<Insight & { status: string }>("SELECT * FROM insights WHERE id=$1", [id]);
  if (!a) notFound();
  return (
    <>
      <PageHeader title={a.title} sub={`/insights/${a.slug}`} />
      <Panel title="Publishing workflow" className="mb-5"><StatusControls id={a.id} status={a.status} role={user.role} action={setInsightStatus} /></Panel>
      <Panel><InsightForm a={a} /></Panel>
    </>
  );
}
