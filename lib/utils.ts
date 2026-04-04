// ============================================================
// Drift — Shared Utilities
// ============================================================

/** Generate a session ID using built-in crypto — no uuid package needed */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Compute variance of a number array */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
}

/** Normalize a value to 0–100 range given a known max */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/** Truncate text to maxLength with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/** Strip markdown formatting from text */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

/** Fidelity score to color (blue → muddy brown) */
export function fidelityToColor(score: number): string {
  // 100 = #1A73E8 (blue), 0 = #7C4A1E (brown)
  const t = clamp(score / 100, 0, 1);
  const r = Math.round(26 + (124 - 26) * (1 - t));
  const g = Math.round(115 + (74 - 115) * (1 - t));
  const b = Math.round(232 + (30 - 232) * (1 - t));
  return `rgb(${r},${g},${b})`;
}

/** Format ISO timestamp to readable string */
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
