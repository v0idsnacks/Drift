'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MetricBar from '@/components/ui/MetricBar';
import { fidelityToColor, truncate } from '@/lib/utils';
import type { NodeMetrics, NodeOutput, PersonaSpec } from '@/types';

interface PersonaCardProps {
  persona: PersonaSpec;
  output: NodeOutput;
  metrics: NodeMetrics;
}

const claimSectionStyles = {
  survivingClaims: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  lostClaims: 'border-slate-200 bg-slate-100 text-slate-700',
  distortedClaims: 'border-amber-200 bg-amber-50 text-amber-800',
  addedClaims: 'border-rose-200 bg-rose-50 text-rose-800',
} as const;

export default function PersonaCard({ persona, output, metrics }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article layout className="w-[22rem] shrink-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.55)]">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{persona.platform}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">{persona.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{persona.role}</p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {expanded ? 'Collapse' : 'Expand'}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-700">{truncate(output.transformedText, 120)}</p>

        <div className="mt-5 grid gap-3">
          <MetricBar label="Fidelity" value={metrics.fidelityScore} color={fidelityToColor(metrics.fidelityScore)} />
          <MetricBar label="Confidence" value={metrics.confidenceInflation} color="#f59e0b" />
          <MetricBar label="Detail" value={metrics.detailSurvivalRate} color="#10b981" />
          <MetricBar label="Framing" value={metrics.framingPolarity} min={-100} max={100} color="#e11d48" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-slate-200 pt-5"
          >
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full transformed text</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{output.transformedText}</p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <p className="font-semibold text-sky-900">Primary distortion observed</p>
                  <p className="mt-1 leading-6">{metrics.primaryDistortionObserved}</p>
                </div>

                {(
                  [
                    ['survivingClaims', 'Surviving claims', metrics.survivingClaims],
                    ['lostClaims', 'Lost claims', metrics.lostClaims],
                    ['distortedClaims', 'Distorted claims', metrics.distortedClaims],
                    ['addedClaims', 'Added claims', metrics.addedClaims],
                  ] as const
                ).map(([key, label, items]) => (
                  <section key={key} className={`rounded-2xl border px-4 py-3 text-sm ${claimSectionStyles[key]}`}>
                    <p className="font-semibold">{label}</p>
                    <div className="mt-2 space-y-2">
                      {items.length > 0 ? (
                        items.map((item) => (
                          <p key={item} className="leading-6">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="leading-6 opacity-80">None recorded at this step.</p>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
