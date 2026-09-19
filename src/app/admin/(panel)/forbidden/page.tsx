import { PageHeader, Panel } from "@/components/admin/ui";
export const metadata = { title: "Not permitted" };
export default function Forbidden() { return (<><PageHeader title="Not permitted" /><Panel><p className="text-slate-300">Your role does not have access to this area. Ask an administrator if you need it.</p></Panel></>); }
