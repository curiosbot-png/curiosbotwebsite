import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ADMIN_NAV, ah } from "@/lib/admin-nav";
import { logoutAction } from "../auth-actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = ADMIN_NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-white/10 bg-ink-800/60 p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <p className="mb-4 font-display text-xl font-semibold text-white">curios<span className="gradient-text">bot</span></p>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map((n) => <Link key={n.path} href={ah(n.path)} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">{n.label}</Link>)}
        </nav>
        <div className="mt-6 hidden border-t border-white/10 pt-4 text-xs text-slate-400 lg:block">
          <p className="truncate text-slate-200">{user.name}</p><p className="capitalize">{user.role}</p>
          <form action={logoutAction}><button className="mt-2 text-brand-400 hover:underline">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-5 lg:p-8">{children}
        <form action={logoutAction} className="mt-10 lg:hidden"><button className="text-sm text-brand-400">Sign out</button></form>
      </div>
    </div>
  );
}
