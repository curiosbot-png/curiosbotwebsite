import type { Metadata } from "next";
export const metadata: Metadata = { title: { default: "Curiosbot Admin", template: "%s | Curiosbot Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-ink-900">{children}</div>; }
