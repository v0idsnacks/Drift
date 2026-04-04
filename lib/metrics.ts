// ============================================================
// Drift — Metrics Computation
// ============================================================

import { buildMetricsPrompt, buildDamagePrompt } from './prompt-builders';
import { NodeMetricsSchema } from './schemas';
import { variance, normalize } from './utils';
import type { NodeMetrics, TextSegment } from '@/types';
import { callOpenRouter, METRICS_MODEL } from './openrouter';

export async function computeNodeMetrics(
  originalSource: string,
  currentNodeOutput: string,
  previousNodeOutput: string,
  keyClaimsToTrack: string[],
  nodeIndex: number,
  personaId: string,
  previousMetrics: NodeMetrics | null
): Promise<NodeMetrics> {
  const prompt = buildMetricsPrompt(
    originalSource,
    currentNodeOutput,
    previousNodeOutput,
    keyClaimsToTrack,
    nodeIndex
  );

  let attempt = 0;
  const maxAttempts = 2;
  let scored;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt, METRICS_MODEL);
      const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      scored = NodeMetricsSchema.parse(parsed);
      break;
    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Metrics API failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!scored) {
    throw new Error('unreachable');
  }

  const prev = previousMetrics;

  return {
    nodeIndex,
    personaId,
    fidelityScore: scored.fidelityScore,
    confidenceInflation: scored.confidenceInflation,
    detailSurvivalRate: scored.detailSurvivalRate,
    framingPolarity: scored.framingPolarity,
    fidelityDelta: prev ? scored.fidelityScore - prev.fidelityScore : 0,
    confidenceInflationDelta: prev ? scored.confidenceInflation - prev.confidenceInflation : 0,
    detailSurvivalDelta: prev ? scored.detailSurvivalRate - prev.detailSurvivalRate : 0,
    framingPolarityDelta: prev ? scored.framingPolarity - prev.framingPolarity : 0,
    survivingClaims: scored.survivingClaims,
    lostClaims: scored.lostClaims,
    distortedClaims: scored.distortedClaims,
    addedClaims: scored.addedClaims,
    primaryDistortionObserved: scored.primaryDistortionObserved,
  };
}

export function computeDisagreementScore(metrics: NodeMetrics[]): number {
  if (metrics.length < 2) return 0;
  const fidelityVariance = variance(metrics.map(m => m.fidelityScore));
  const framingVariance = variance(metrics.map(m => m.framingPolarity));
  // Normalize combined variance to 0–100
  return Math.round(normalize(fidelityVariance + framingVariance, 0, 5000));
}

export async function computeDamageSegments(
  originalSource: string,
  finalNodeOutput: string
): Promise<TextSegment[]> {
  const prompt = buildDamagePrompt(originalSource, finalNodeOutput);

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt, METRICS_MODEL);
      const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as TextSegment[];
    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Damage Segments API failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error("unreachable");
}
