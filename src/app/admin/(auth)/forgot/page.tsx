import { AuthForm } from "../../AuthForm";
import { requestResetAction } from "../../auth-actions";
export const metadata = { title: "Reset password" };
export default function Forgot() {
  return (<><h1 className="mb-5 text-xl">Reset your password</h1><AuthForm action={requestResetAction} submit="Send reset link" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "username" }]} /></>);
}
