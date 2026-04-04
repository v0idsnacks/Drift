'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fidelityToColor } from '@/lib/utils';
import type { ChainSpec, NodeMetrics, NodeOutput } from '@/types';

interface RiverViewProps {
  chainSpec: ChainSpec;
  nodes: NodeOutput[];
  metrics: NodeMetrics[];
}

export default function RiverView({ chainSpec, nodes, metrics }: RiverViewProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // If we don't have metrics yet (still streaming), render what we have
  if (!metrics || metrics.length === 0) {
    return (
      <section className="flex h-32 items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50/80">
        <p className="text-slate-500 font-medium">River flowing...</p>
      </section>
    );
  }

  // Calculate points
  // We include the 'source' as the first point
  const totalPoints = metrics.length + 1;
  const viewBoxWidth = 1000;
  const viewBoxHeight = 300;
  const startX = 50;
  const endX = viewBoxWidth - 50;
  const gap = (endX - startX) / Math.max(1, totalPoints - 1);

  const getWidth = (fidelity: number) => {
    // Width at each node = (100 - fidelityScore) mapped to range 10px to 100px
    return 10 + ((100 - Math.max(0, fidelity)) / 100) * 90;
  };

  const points = Array.from({ length: totalPoints }).map((_, i) => {
    const x = startX + i * gap;
    // Add a slight wave to make it a "river"
    const y = viewBoxHeight / 2 + Math.sin(i * 1.5) * 30;
    
    if (i === 0) {
      return { id: 'source', x, y, width: getWidth(100), color: fidelityToColor(100), metric: null };
    }
    const metric = metrics[i - 1];
    const fidelity = metric?.fidelityScore ?? 100;
    return {
      id: metric?.personaId ?? `unknown-${i}`,
      x,
      y,
      width: getWidth(fidelity),
      color: fidelityToColor(fidelity),
      metric,
      persona: chainSpec.personas.find((p) => p.id === metric?.personaId),
    };
  });

  const handleSegmentClick = (personaId: string) => {
    if (personaId === 'source') return;
    const element = document.getElementById(`persona-${personaId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 p-8 shadow-inner">
      <div className="absolute inset-x-0 top-0 h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900/10 to-transparent pointer-events-none" />
      
      <svg 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
        className="w-full h-auto overflow-visible"
        aria-label="Information Decay River"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {points.map((pt, i) => {
          if (i === 0) return null; // We draw from previous to current
          
          const prevPt = points[i - 1];
          // Use cubic bezier for smooth curves
          const cpX1 = prevPt.x + gap / 2;
          const cpY1 = prevPt.y;
          const cpX2 = pt.x - gap / 2;
          const cpY2 = pt.y;
          
          const pathD = `M ${prevPt.x} ${prevPt.y} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
          const isHovered = hoveredNode === pt.id;

          return (
            <g key={pt.id} className="group cursor-pointer">
              {/* Invisible thicker path for easier hovering/clicking */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={pt.width + 30}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredNode(pt.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleSegmentClick(pt.id)}
              />
              {/* Actual river segment */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={pt.color}
                strokeWidth={pt.width}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.2 }}
                filter={isHovered ? "url(#glow)" : undefined}
                className="transition-all duration-300"
                style={{
                  strokeOpacity: isHovered ? 1 : 0.85
                }}
              />
            </g>
          );
        })}

        {/* Node dots */}
        {points.map((pt, i) => (
          <motion.circle
            key={`dot-${pt.id}`}
            cx={pt.x}
            cy={pt.y}
            r={i === 0 ? 8 : 4}
            fill="#ffffff"
            className="pointer-events-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.2 + 1.2, type: "spring" }}
            filter="drop-shadow(0 0 4px rgba(255,255,255,0.5))"
          />
        ))}
      </svg>

      {/* Tooltip Layer */}
      <div className="pointer-events-none absolute inset-0 z-10 flex">
        {hoveredNode && hoveredNode !== 'source' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-md text-white border border-slate-700 p-4 rounded-xl shadow-2xl max-w-sm w-full transition-all">
            {(() => {
              const point = points.find(p => p.id === hoveredNode);
              const metric = point?.metric;
              if (!metric || !point?.persona) return null;

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                  <div className="border-b border-slate-600/50 pb-2">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-sky-400">Node {metric.nodeIndex + 1}</p>
                    <p className="text-base font-semibold">{point.persona.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-900/50 p-2 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Fidelity</p>
                      <p className={metric.fidelityScore < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                        {Math.round(metric.fidelityScore)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Inflation</p>
                      <p className={metric.confidenceInflation > 50 ? 'text-rose-400' : 'text-amber-400'}>
                        {Math.round(metric.confidenceInflation)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Details Kept</p>
                      <p className="text-white">{Math.round(metric.detailSurvivalRate)}%</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">Polarity</p>
                      <p className="text-white">{Math.round(metric.framingPolarity)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
