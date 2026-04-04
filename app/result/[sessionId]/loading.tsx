export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-slate-100">
      <div className="rounded-[1.75rem] border border-sky-500/20 bg-slate-950/80 px-8 py-6 shadow-[0_30px_80px_-60px_rgba(59,130,246,0.85)]">
        <p className="animate-pulse text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
          Loading drift result...
        </p>
      </div>
    </main>
  );
}
