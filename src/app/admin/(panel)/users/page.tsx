import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createUser, toggleUser } from "../../actions";
import { Badge, PageHeader, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "Users" };
export default async function Users() {
  const me = await requireUser(["admin"]);
  const [users, logs] = await Promise.all([
    query<{ id: string; name: string; email: string; role: string; disabled: boolean; mfa_enabled: boolean }>("SELECT id,name,email,role,disabled,mfa_enabled FROM users ORDER BY created_at"),
    query<{ action: string; entity: string | null; created_at: Date; name: string | null; ip: string | null }>("SELECT a.action,a.entity,a.created_at,u.name,a.ip FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 40"),
  ]);
  return (
    <>
      <PageHeader title="Users" sub="Roles: admin (everything, publishing, approvals, settings) and marketing (analytics, drafting, review submission). MFA (TOTP) is reserved in the schema and planned as a follow-up." />
      <Panel title="Accounts"><Table head={["Name", "Email", "Role", "MFA", "Status", ""]} rows={users.map((u) => [u.name, u.email, <Badge key="r" tone={u.role === "admin" ? "violet" : "blue"}>{u.role}</Badge>, u.mfa_enabled ? "on" : "off", u.disabled ? <Badge key="d" tone="red">disabled</Badge> : <Badge key="a" tone="green">active</Badge>, u.id === me.id ? "you" : <form key="t" action={toggleUser}><input type="hidden" name="id" value={u.id} /><button className="text-xs text-brand-400 hover:underline">{u.disabled ? "Enable" : "Disable"}</button></form>])} /></Panel>
      <Panel title="Add user" className="mt-5"><form action={createUser} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Name<input name="name" required className="field mt-1" /></label><label className="text-sm">Email<input name="email" type="email" required className="field mt-1" /></label>
        <label className="text-sm">Role<select name="role" className="field mt-1"><option value="marketing">marketing</option><option value="admin">admin</option></select></label>
        <label className="text-sm">Temporary password (12+ chars, mixed)<input name="password" type="password" required minLength={12} autoComplete="new-password" className="field mt-1" /></label>
        <button className="btn-primary sm:justify-self-start">Create user</button></form></Panel>
      <Panel title="Audit log" className="mt-5"><Table head={["When", "User", "Action", "Entity", "IP"]} rows={logs.map((l) => [l.created_at.toISOString().slice(0, 16).replace("T", " "), l.name ?? "—", l.action, l.entity ?? "—", l.ip ?? "—"])} /></Panel>
    </>
  );
}
