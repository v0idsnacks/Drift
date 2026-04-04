import Link from 'next/link';
import { getExampleResults } from '@/lib/examples';

function formatContentType(contentType: string): string {
  return contentType.charAt(0).toUpperCase() + contentType.slice(1);
}

export default function Home() {
  const examples = getExampleResults().map((result) => {
    const firstPersona = result.chainSpec.personas[0];
    const lastPersona = result.chainSpec.personas.at(-1);
    const firstFidelity = result.metrics[0]?.fidelityScore ?? 100;
    const lastFidelity = result.metrics.at(-1)?.fidelityScore ?? firstFidelity;

    return {
      sessionId: result.sessionId,
      contentType: formatContentType(result.chainSpec.contentType),
      vulnerabilityScore: result.chainSpec.vulnerabilityScore,
      firstPersonaName: firstPersona?.name ?? 'Unknown',
      lastPersonaName: lastPersona?.name ?? 'Unknown',
      fidelityDrop: Math.max(0, Math.round(firstFidelity - lastFidelity)),
      summary: result.chainSpec.contentSummary,
    };
  });

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-sky-500/20 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_rgba(2,6,23,0.96)_34%,_rgba(2,6,23,1)_100%)] px-6 py-16 shadow-[0_45px_140px_-70px_rgba(59,130,246,0.7)] sm:px-10 sm:py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-sky-300">Public Launch Preview</p>
            <h1 className="mt-5 text-6xl font-semibold tracking-[0.2em] text-white sm:text-7xl md:text-8xl">DRIFT</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300 sm:text-2xl">
              Paste any text. Watch truth decay.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Try it yourself →
              </Link>
              <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                Sequential persona cascades. Real-time drift metrics. Shareable result links.
              </span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Examples</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Three realistic cascades, ready to open
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {examples.map((example) => (
              <Link
                key={example.sessionId}
                href={`/result/${example.sessionId}`}
                className="group rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6 transition hover:-translate-y-1 hover:border-sky-400/50 hover:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                    {example.contentType}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Open Result</span>
                </div>

                <p className="mt-5 text-lg font-medium leading-7 text-white transition group-hover:text-sky-200">
                  {example.summary}
                </p>

                <dl className="mt-8 grid gap-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
                    <dt className="text-slate-500">Vulnerability score</dt>
                    <dd className="font-semibold text-white">{example.vulnerabilityScore}/100</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
                    <dt className="text-slate-500">Persona path</dt>
                    <dd className="text-right font-medium text-white">
                      {example.firstPersonaName} → {example.lastPersonaName}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
                    <dt className="text-slate-500">Fidelity drop</dt>
                    <dd className="font-semibold text-sky-300">{example.fidelityDrop} pts</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
