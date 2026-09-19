import type { Role } from "./auth";

/** Workflow transitions enforced server-side: draft → in_review → approved → published. Publishing needs an admin. */
export const TRANSITIONS: Record<string, { to: string[]; roles: Role[] }[]> = {
  draft: [{ to: ["in_review"], roles: ["admin", "marketing"] }, { to: ["archived"], roles: ["admin"] }],
  in_review: [{ to: ["draft"], roles: ["admin", "marketing"] }, { to: ["approved"], roles: ["admin"] }],
  approved: [{ to: ["draft"], roles: ["admin"] }, { to: ["published"], roles: ["admin"] }],
  published: [{ to: ["draft", "archived"], roles: ["admin"] }],
  archived: [{ to: ["draft"], roles: ["admin"] }],
};
export function canTransition(from: string, to: string, role: Role) { return (TRANSITIONS[from] ?? []).some((t) => t.to.includes(to) && t.roles.includes(role)); }

