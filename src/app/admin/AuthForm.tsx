"use client";
import { useActionState } from "react";
import type { FormState } from "./auth-actions";

export function AuthForm({ action, fields, submit, hidden }: { action: (s: FormState, fd: FormData) => Promise<FormState>; fields: { name: string; label: string; type: string; autoComplete?: string }[]; submit: string; hidden?: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name}><label htmlFor={f.name} className="mb-1 block text-sm text-slate-300">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type} required autoComplete={f.autoComplete} className="field" /></div>
      ))}
      {state?.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-emerald-400">{state.ok}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
