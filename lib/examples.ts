import academicExample from '@/data/examples/academic.json';
import healthExample from '@/data/examples/health.json';
import politicalExample from '@/data/examples/political.json';
import { CascadeResultSchema } from '@/lib/schemas';
import type { CascadeResult } from '@/types';

function parseExample(data: unknown): CascadeResult {
  const parsed = CascadeResultSchema.parse(data);

  if (typeof parsed.computedAt !== 'string') {
    throw new Error('Example result is missing a computedAt timestamp.');
  }

  return parsed as CascadeResult;
}

const EXAMPLE_RESULTS: CascadeResult[] = [
  parseExample(academicExample),
  parseExample(politicalExample),
  parseExample(healthExample),
];

const EXAMPLE_RESULTS_BY_ID = new Map(
  EXAMPLE_RESULTS.map((result) => [result.sessionId, result] as const)
);

export function getExampleResults(): CascadeResult[] {
  return EXAMPLE_RESULTS;
}

export function getExampleResult(sessionId: string): CascadeResult | null {
  return EXAMPLE_RESULTS_BY_ID.get(sessionId) ?? null;
}
