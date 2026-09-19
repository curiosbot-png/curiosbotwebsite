import { AuthForm } from "../../AuthForm";
import { resetPasswordAction } from "../../auth-actions";
export const metadata = { title: "Choose a new password" };
export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (<><h1 className="mb-5 text-xl">Choose a new password</h1>
    <AuthForm action={resetPasswordAction} submit="Update password" hidden={{ token: token ?? "" }} fields={[{ name: "password", label: "New password (12+ characters)", type: "password", autoComplete: "new-password" }, { name: "password2", label: "Confirm password", type: "password", autoComplete: "new-password" }]} /></>);
}
