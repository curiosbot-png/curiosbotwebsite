import type { Metadata } from "next";
import { ServicePage } from "@/components/ServicePage";
import { SERVICES } from "@/content/services";

const c = SERVICES["salesforce-consulting"];
export const metadata: Metadata = { title: c.seoTitle, description: c.seoDescription, alternates: { canonical: c.path }, openGraph: { title: c.seoTitle, description: c.seoDescription, url: c.path } };
export default function Page() { return <ServicePage c={c} />; }
