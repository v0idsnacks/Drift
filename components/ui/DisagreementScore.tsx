'use client';

import { motion } from 'framer-motion';

interface DisagreementScoreProps {
  score: number;
}

function getScoreInfo(score: number) {
  if (score > 60) {
    return {
      label: 'High disagreement — ambiguous source',
      color: 'text-red-500',
      bgClass: 'bg-red-500',
    };
  } else if (score > 30) {
    return {
      label: 'Mixed signals — contested content',
      color: 'text-yellow-500',
      bgClass: 'bg-yellow-500',
    };
  } else {
    return {
      label: 'High consensus — clear decay pattern',
      color: 'text-green-500',
      bgClass: 'bg-green-500',
    };
  }
}

export default function DisagreementScore({ score }: DisagreementScoreProps) {
  const { label, color, bgClass } = getScoreInfo(score);

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.4)]">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <div className="flex items-baseline gap-1">
          <span className={`text-5xl font-bold tracking-tight ${color}`}>{Math.round(score)}</span>
          <span className="text-xl font-medium text-slate-400">/100</span>
        </div>
        <p className="mt-1 text-sm font-medium tracking-wide uppercase text-slate-500">{label}</p>
        
        <div className="mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={`h-full rounded-full ${bgClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </section>
  );
}
