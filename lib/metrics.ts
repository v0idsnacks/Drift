// ============================================================
// Drift — Metrics Computation
// ============================================================

import { buildMetricsPrompt, buildDamagePrompt } from './prompt-builders';
import { NodeMetricsSchema } from './schemas';
import { variance, normalize } from './utils';
import type { NodeMetrics, TextSegment } from '@/types';
import { callOpenRouter } from './openrouter';

// ── Robust JSON extraction ───────────────────────────────────
// Free models often wrap JSON in markdown fences, add preamble,
// or truncate output. This helper extracts the first valid JSON
// object or array from arbitrary text.
function extractJson(raw: string): unknown {
  // 1. Strip markdown fences
  let text = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  // 2. Try direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // 3. Try to find a JSON object {...} in the text
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* continue */ }
  }

  // 4. Try to find a JSON array [...] in the text
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch { /* continue */ }
  }

  // 5. Nothing worked
  throw new SyntaxError(`Could not extract valid JSON from LLM response (${text.length} chars). First 200 chars: ${text.slice(0, 200)}`);
}

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
  const maxAttempts = 3;
  let scored;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt);
      const parsed = extractJson(rawText);
      scored = NodeMetricsSchema.parse(parsed);
      break;
    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Metrics API failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      console.warn(`[Drift] Metrics parse failed (attempt ${attempt}/${maxAttempts + 1}): ${err}`);
      await new Promise(r => setTimeout(r, 2000));
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
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt);
      const parsed = extractJson(rawText);
      return parsed as TextSegment[];
    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        // Damage segments are optional — return empty rather than crashing
        console.error(`[Drift] Damage Segments failed after ${maxAttempts + 1} attempts, returning empty: ${err}`);
        return [];
      }
      console.warn(`[Drift] Damage parse failed (attempt ${attempt}/${maxAttempts + 1}): ${err}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return [];
}
