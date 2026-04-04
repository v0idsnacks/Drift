'use client';

import type { AttentionSpan, ChainSpec } from '@/types';

interface ChainPreviewProps {
  chainSpec: ChainSpec;
  isStarting?: boolean;
  onConfirm: () => void | Promise<void>;
  onBack: () => void;
}

const attentionStyles: Record<AttentionSpan, string> = {
  full: 'bg-emerald-100 text-emerald-700',
  skim: 'bg-amber-100 text-amber-700',
  'headline-only': 'bg-rose-100 text-rose-700',
};

function formatLabel(value: string) {
  return value.replace(/-/g, ' ');
}

function vulnerabilityClasses(score: number) {
  if (score >= 75) return 'bg-rose-500';
  if (score >= 45) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function ChainPreview({ chainSpec, isStarting = false, onConfirm, onBack }: ChainPreviewProps) {
  return (
    <section className="w-full max-w-6xl rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Chain Preview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">This is the sequence Drift will run.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{chainSpec.contentSummary}</p>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Primary distortion</p>
            <span className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white">
              {formatLabel(chainSpec.primaryDistortionMode)}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vulnerability</p>
              <span className="text-sm font-medium text-slate-700">{chainSpec.vulnerabilityScore}/100</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${vulnerabilityClasses(chainSpec.vulnerabilityScore)}`}
                style={{ width: `${chainSpec.vulnerabilityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {chainSpec.keyClaimsToTrack.map((claim) => (
          <span key={claim} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700">
            {claim}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {chainSpec.personas.map((persona, index) => (
          <article
            key={persona.id}
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Node {index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{persona.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{persona.role}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${attentionStyles[persona.attentionSpan]}`}>
                {formatLabel(persona.attentionSpan)}
              </span>
            </div>

            <dl className="mt-5 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-700">Platform</dt>
                <dd className="mt-1">{persona.platform}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Incentive</dt>
                <dd className="mt-1">{persona.incentive}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Biases</dt>
                <dd className="mt-1">{persona.biases.join(', ')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          disabled={isStarting}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isStarting}
        >
          {isStarting ? 'Preparing Cascade...' : 'Run Cascade'}
        </button>
      </div>
    </section>
  );
}
