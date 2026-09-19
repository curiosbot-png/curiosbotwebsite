import { PageHeader, Panel } from "@/components/admin/ui";
import { InsightForm } from "@/components/admin/InsightForm";
export const metadata = { title: "New article" };
export default function NewInsight() { return (<><PageHeader title="New article" /><Panel><InsightForm /></Panel></>); }
