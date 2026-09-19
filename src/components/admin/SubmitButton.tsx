"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children, pending: label = "Working…", className = "btn-primary" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-busy={pending}>{pending ? label : children}</button>;
}
