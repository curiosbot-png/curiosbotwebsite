import { TRANSITIONS } from "@/lib/workflow";
import type { Role } from "@/lib/auth";
import { Badge } from "./ui";

const LABEL: Record<string, string> = { draft: "Return to draft", in_review: "Submit for review", approved: "Approve", published: "Publish now", archived: "Archive" };

export function StatusControls({ id, status, role, action }: { id: string; status: string; role: Role; action: (fd: FormData) => Promise<void> }) {
  const options = (TRANSITIONS[status] ?? []).filter((t) => t.roles.includes(role)).flatMap((t) => t.to);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge tone={status === "published" ? "green" : status === "approved" ? "blue" : status === "in_review" ? "amber" : "slate"}>{status.replace("_", " ")}</Badge>
      {options.map((to) => (
        <form key={to} action={action}><input type="hidden" name="id" value={id} /><input type="hidden" name="to" value={to} />
          <button className={to === "published" ? "btn-primary !py-2" : "btn-ghost !py-2"}>{LABEL[to]}</button></form>
      ))}
      {status !== "published" && <span className="text-xs text-slate-500">Nothing is public until an admin approves and publishes.</span>}
    </div>
  );
}
