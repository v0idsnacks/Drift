import { fidelityToColor, normalize } from '@/lib/utils';

interface MetricBarProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  color?: string;
}

export default function MetricBar({
  label,
  value,
  min = 0,
  max = 100,
  color,
}: MetricBarProps) {
  const normalized = normalize(value, min, max);
  const fill = color ?? (label.toLowerCase().includes('fidelity') ? fidelityToColor(normalized) : '#0f172a');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{Math.round(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${normalized}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  );
}
