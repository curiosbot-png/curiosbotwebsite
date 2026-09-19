import { generateProductAction } from "../../../ai-actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
export const metadata = { title: "AI Product Creator" };
export default async function ProductCreator({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const L = ({ n, l, rows, req }: { n: string; l: string; rows?: number; req?: boolean }) => <label className="block text-sm">{l}{rows ? <textarea name={n} rows={rows} required={req} className="field mt-1" /> : <input name={n} required={req} className="field mt-1" />}</label>;
  return (
    <>
      <PageHeader title="AI Product Creator" sub="Describe the product. The generator only uses what you provide — add facts you want stated; unknown metrics are left as [METRIC TO CONFIRM]." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <Panel><form action={generateProductAction} className="space-y-4">
        <L n="name" l="Product name" req /><L n="description" l="Basic description" rows={3} req /><L n="target_customer" l="Target customer" /><L n="industry" l="Industry" />
        <L n="problem" l="Problem it solves" rows={3} /><L n="features" l="Features (one per line)" rows={4} /><L n="notes" l="Extra notes / pasted document text" rows={5} />
        <SubmitButton pending="Generating… this can take a minute">Generate product marketing</SubmitButton>
      </form></Panel>
    </>
  );
}
