export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-5">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800/80 p-8 shadow-glow backdrop-blur">
        <p className="mb-6 font-display text-2xl font-semibold text-white">curios<span className="gradient-text">bot</span> <span className="text-sm font-normal text-slate-400">Admin</span></p>
        {children}
      </div>
    </div>
  );
}
