'use client';

import { useState } from 'react';
import Link from 'next/link';
import ViewSwitcher from '@/components/ViewSwitcher';
import DisagreementScore from '@/components/ui/DisagreementScore';
import ShareButton from '@/components/ui/ShareButton';
import DamageReport from '@/components/views/DamageReport';
import RiverView from '@/components/views/RiverView';
import TimelineView from '@/components/views/TimelineView';
import { formatTimestamp } from '@/lib/utils';
import type { ActiveView, CascadeResult } from '@/types';

interface ResultViewsProps {
  result: CascadeResult;
  isExample?: boolean;
}

function fateClasses(fate: string): string {
  switch (fate) {
    case 'survived':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'paraphrased':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'lost':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'fabricated':
      return 'border-sky-200 bg-sky-50 text-sky-800';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export default function ResultViews({ result, isExample = false }: ResultViewsProps) {
  const [activeView, setActiveView] = useState<ActiveView>('timeline');
  const finalNode = result.nodes.at(-1);
  const finalMetrics = result.metrics.at(-1);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-sky-500/20 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(3,7,18,0.96)_38%,_rgba(3,7,18,1)_100%)] shadow-[0_40px_120px_-60px_rgba(37,99,235,0.65)]">
          <div className="border-b border-slate-800/80 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                  {isExample ? 'Pinned Demo Session' : 'Shareable Result'}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {result.chainSpec.contentSummary}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  Drift tracked this source through {result.chainSpec.chainDepth} personas and preserved every view for
                  playback.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <ShareButton sessionId={result.sessionId} />
                <Link
                  href="/analyze"
                  className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
                >
                  Run another cascade
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
            <article className="rounded-[1.5rem] border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Computed At</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatTimestamp(result.computedAt)}</p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Session ID</p>
              <p className="mt-2 break-all font-mono text-sm text-slate-200">{result.sessionId}</p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Final Persona</p>
              <p className="mt-2 text-lg font-semibold text-white">{finalNode?.personaName ?? 'Unavailable'}</p>
            </article>

            <article className="rounded-[1.5rem] border border-amber-500/25 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Expiry Warning</p>
              <p className="mt-2 text-sm leading-6 text-amber-50">
                {isExample
                  ? 'This demo session is pinned, but user-generated sessions live in ephemeral temp storage and can expire after a short time.'
                  : 'This permalink is backed by ephemeral temp storage. It may disappear after a few hours, so copy anything you need now.'}
              </p>
            </article>
          </div>
        </section>

        <DisagreementScore score={result.disagreementScore} />

        <section className="rounded-[2rem] border border-slate-800 bg-white/96 p-4 text-slate-950 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.75)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Views</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Replay the full distortion chain</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Switch between the river, timeline, and damage report to inspect how the message changed at each step.
              </p>
            </div>
            <ViewSwitcher activeView={activeView} onChange={setActiveView} />
          </div>

          <div className="mt-6">
            {activeView === 'timeline' ? (
              <div id="timeline-tab-panel" role="tabpanel" aria-labelledby="timeline-tab">
                <TimelineView
                  source={result.source}
                  chainSpec={result.chainSpec}
                  nodes={result.nodes}
                  metrics={result.metrics}
                />
              </div>
            ) : null}

            {activeView === 'river' ? (
              <div id="river-tab-panel" role="tabpanel" aria-labelledby="river-tab" className="space-y-6">
                <RiverView chainSpec={result.chainSpec} nodes={result.nodes} metrics={result.metrics} />
                {finalMetrics ? (
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Final Fidelity</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{Math.round(finalMetrics.fidelityScore)}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence Inflation</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">
                        {Math.round(finalMetrics.confidenceInflation)}
                      </p>
                    </article>
                    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Detail Survival</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">
                        {Math.round(finalMetrics.detailSurvivalRate)}
                      </p>
                    </article>
                    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Primary Distortion</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{finalMetrics.primaryDistortionObserved}</p>
                    </article>
                  </section>
                ) : null}
              </div>
            ) : null}

            {activeView === 'damage' ? (
              <div id="damage-tab-panel" role="tabpanel" aria-labelledby="damage-tab" className="space-y-6">
                {(result.damageSegments ?? []).length > 0 ? (
                  <section className="grid gap-4 lg:grid-cols-2">
                    {result.damageSegments?.map((segment, index) => (
                      <article
                        key={`${segment.text}-${index}`}
                        className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-sm leading-7 text-slate-700">{segment.text}</p>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${fateClasses(segment.fate)}`}
                          >
                            {segment.fate}
                          </span>
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                          Visible in nodes:{' '}
                          {segment.appearsInNodeIndices.length > 0
                            ? segment.appearsInNodeIndices.map((nodeIndex) => nodeIndex + 1).join(', ')
                            : 'None'}
                        </p>
                      </article>
                    ))}
                  </section>
                ) : finalNode ? (
                  <DamageReport source={result.source} finalOutput={finalNode.transformedText} />
                ) : (
                  <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
                    Damage data is unavailable for this session.
                  </section>
                )}

                {finalMetrics ? (
                  <section className="grid gap-4 md:grid-cols-2">
                    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distorted Claims</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        {finalMetrics.distortedClaims.length > 0 ? (
                          finalMetrics.distortedClaims.map((claim) => <p key={claim}>{claim}</p>)
                        ) : (
                          <p>None recorded in the final hop.</p>
                        )}
                      </div>
                    </article>

                    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Added Claims</p>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        {finalMetrics.addedClaims.length > 0 ? (
                          finalMetrics.addedClaims.map((claim) => <p key={claim}>{claim}</p>)
                        ) : (
                          <p>No fabricated claims were captured in the final hop.</p>
                        )}
                      </div>
                    </article>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
