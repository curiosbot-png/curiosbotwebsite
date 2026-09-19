import Link from "next/link";
import { AuthForm } from "../../AuthForm";
import { loginAction } from "../../auth-actions";
import { ah } from "@/lib/admin-nav";
export const metadata = { title: "Sign in" };
export default function Login() {
  return (<>
    <h1 className="mb-5 text-xl">Sign in</h1>
    <AuthForm action={loginAction} submit="Sign in" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "username" }, { name: "password", label: "Password", type: "password", autoComplete: "current-password" }]} />
    <p className="mt-4 text-center text-sm"><Link className="text-brand-400 hover:underline" href={ah("/forgot")}>Forgot password?</Link></p>
  </>);
}
