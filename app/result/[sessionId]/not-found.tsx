import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-sky-500/20 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_rgba(2,6,23,0.96)_45%,_rgba(2,6,23,1)_100%)] p-10 text-center shadow-[0_40px_140px_-70px_rgba(59,130,246,0.75)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Result Unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Session expired</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          This Drift result no longer exists in temp storage, or the link was never valid.
        </p>
        <Link
          href="/analyze"
          className="mt-8 inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Run a new analysis →
        </Link>
      </div>
    </main>
  );
}
