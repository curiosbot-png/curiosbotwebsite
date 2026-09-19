import { PageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
export const metadata = { title: "New product" };
export default function NewProduct() { return (<><PageHeader title="New product" /><Panel><ProductForm /></Panel></>); }
