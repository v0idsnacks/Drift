// ============================================================
// Drift — Cascade Engine
// Runs sequential persona transformations with streaming.
// ============================================================

import { buildPersonaPrompt } from './prompt-builders';
import { computeNodeMetrics, computeDisagreementScore, computeDamageSegments } from './metrics';
import { saveSession } from './storage';
import { generateSessionId } from './utils';
import type { ChainSpec, NodeOutput, NodeMetrics, CascadeResult, StreamEvent } from '@/types';
import { callOpenRouter } from './openrouter';

export async function runCascade(
  source: string,
  chainSpec: ChainSpec,
  onEvent: (event: StreamEvent) => void,
  sessionId = generateSessionId()
): Promise<CascadeResult> {
  const nodes: NodeOutput[] = [];
  const metrics: NodeMetrics[] = [];

  let currentText = source;

  for (let i = 0; i < chainSpec.personas.length; i++) {
    const persona = chainSpec.personas[i];
    const previousOutput = currentText;

    // Build + call persona prompt
    const prompt = buildPersonaPrompt(persona, currentText, source, i);

    let transformedText = "";
    try {
      transformedText = await callOpenRouter(prompt);
    } catch (error) {
      throw new Error(`Failed node ${persona.id} API call: ${error}`);
    }

    const node: NodeOutput = {
      personaId: persona.id,
      personaName: persona.name,
      personaRole: persona.role,
      transformedText,
      tokenCount: transformedText.length / 4, // Rough approximation
    };

    // Compute metrics for this node
    const nodeMetrics = await computeNodeMetrics(
      source,
      transformedText,
      previousOutput,
      chainSpec.keyClaimsToTrack,
      i,
      persona.id,
      metrics[i - 1] ?? null
    );

    nodes.push(node);
    metrics.push(nodeMetrics);

    // Stream node-complete event
    onEvent({ type: 'node-complete', nodeIndex: i, node, metrics: nodeMetrics });

    // CRITICAL: next node gets THIS node's output
    currentText = transformedText;
  }

  // Compute damage segments from original vs final output
  const damageSegments = await computeDamageSegments(source, currentText);
  const disagreementScore = computeDisagreementScore(metrics);

  const result: CascadeResult = {
    sessionId,
    source,
    chainSpec,
    nodes,
    metrics,
    damageSegments,
    disagreementScore,
    computedAt: new Date().toISOString(),
  };

  // Persist session
  saveSession(result);

  onEvent({ type: 'cascade-complete', result });

  return result;
}
