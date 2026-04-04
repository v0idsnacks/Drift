import { ChainSpec, NodeMetrics, CascadeResult } from '../types';
import { ChainSpecSchema, NodeMetricsSchema, CascadeResultSchema } from './schemas';

export function validateChainSpec(data: unknown): ChainSpec {
  const result = ChainSpecSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid ChainSpec: ${result.error.message}`);
  }
  return result.data as ChainSpec;
}

export function validateNodeMetrics(data: unknown): NodeMetrics {
  const result = NodeMetricsSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid NodeMetrics: ${result.error.message}`);
  }
  return result.data as NodeMetrics;
}

export function validateCascadeResult(data: unknown): CascadeResult {
  const result = CascadeResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid CascadeResult: ${result.error.message}`);
  }
  return result.data as CascadeResult;
}
