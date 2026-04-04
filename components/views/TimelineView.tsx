import PersonaCard from '@/components/ui/PersonaCard';
import { truncate } from '@/lib/utils';
import type { ChainSpec, NodeMetrics, NodeOutput } from '@/types';

interface TimelineViewProps {
  source: string;
  chainSpec: ChainSpec;
  nodes: NodeOutput[];
  metrics: NodeMetrics[];
}

export default function TimelineView({ source, chainSpec, nodes, metrics }: TimelineViewProps) {
  const cards = chainSpec.personas
    .map((persona) => ({
      persona,
      output: nodes.find((node) => node.personaId === persona.id),
      metrics: metrics.find((metric) => metric.personaId === persona.id),
    }))
    .filter((entry): entry is { persona: ChainSpec['personas'][number]; output: NodeOutput; metrics: NodeMetrics } => {
      return Boolean(entry.output && entry.metrics);
    });

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          <article className="w-[22rem] shrink-0 rounded-[1.75rem] border border-sky-200 bg-white p-5 shadow-[0_24px_70px_-50px_rgba(2,132,199,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Source</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Original text</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{truncate(source, 560)}</p>
          </article>

          {cards.map(({ persona, output, metrics }) => (
            <div key={persona.id} className="flex items-start gap-4">
              <div className="flex h-[28rem] items-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                -&gt;
              </div>
              <PersonaCard persona={persona} output={output} metrics={metrics} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
