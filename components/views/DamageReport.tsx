'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TextSegment } from '@/types';

interface DamageReportProps {
  source: string;
  finalOutput: string;
}

export default function DamageReport({ source, finalOutput }: DamageReportProps) {
  const [segments, setSegments] = useState<TextSegment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchDamage() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/damage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, finalOutput }),
        });

        if (!response.ok) {
          throw new Error('Failed to compute damage analysis');
        }

        const data = await response.json();
        if (active) {
          setSegments(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to compute damage analysis');
          setLoading(false);
        }
      }
    }

    fetchDamage();
    return () => { active = false; };
  }, [source, finalOutput]);

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex animate-pulse space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 rounded bg-slate-200 w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 rounded bg-slate-200 col-span-2"></div>
                <div className="h-4 rounded bg-slate-200 col-span-1"></div>
              </div>
              <div className="h-4 rounded bg-slate-200"></div>
            </div>
            <div className="h-4 rounded bg-slate-200 w-5/6"></div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-500">
          Running comparative text analysis...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">
        <p className="font-semibold">Analysis Failed</p>
        <p className="text-sm">{error}</p>
      </section>
    );
  }

  const legend = [
    { label: 'Survived', fate: 'survived', classes: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Paraphrased', fate: 'paraphrased', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { label: 'Lost', fate: 'lost', classes: 'bg-red-50 text-red-500 line-through border-red-200' },
    { label: 'Fabricated', fate: 'fabricated', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  const getStyleForFate = (fate: string) => {
    switch (fate) {
      case 'survived': return 'bg-green-50 text-green-800 border-green-200';
      case 'paraphrased': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'lost': return 'bg-red-50 text-red-500 line-through border-red-200 opacity-70';
      case 'fabricated': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-slate-50 text-slate-800';
    }
  };

  const originalSegments = segments?.filter(s => s.fate !== 'fabricated') || [];
  const fabricatedSegments = segments?.filter(s => s.fate === 'fabricated') || [];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      {/* Legend */}
      <div className="mb-8 flex flex-wrap gap-4 border-b border-slate-100 pb-6 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded border leading-none ${item.classes}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Document Reconstruction */}
      <div className="prose prose-slate max-w-none">
        <h3 className="text-slate-400 uppercase tracking-widest text-sm font-semibold mb-4">Original Material Breakdown</h3>
        <p className="leading-relaxed md:leading-loose text-base md:text-lg">
          {originalSegments.map((seg, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`mr-1 inline-block rounded border px-1.5 py-0.5 transition-colors ${getStyleForFate(seg.fate)}`}
              title={`Fate: ${seg.fate}`}
            >
              {seg.text}
            </motion.span>
          ))}
        </p>

        {fabricatedSegments.length > 0 && (
          <div className="mt-12 rounded-xl bg-purple-50/50 p-6 border border-purple-100">
            <h3 className="text-purple-400 uppercase tracking-widest text-sm font-semibold mb-4">Fabricated Additions</h3>
            <ul className="space-y-3">
              {fabricatedSegments.map((seg, i) => (
                <motion.li 
                  key={`fab-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1 rounded-full bg-purple-200 p-1 flex-shrink-0 text-purple-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  </span>
                  <span className={`inline-block rounded border px-2 py-1 ${getStyleForFate('fabricated')}`}>
                    {seg.text}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
