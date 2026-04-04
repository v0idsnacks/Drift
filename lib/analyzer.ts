// ============================================================
// Drift — Content Analyzer
// Calls Claude to generate a ChainSpec from raw text.
// ============================================================

import { buildAnalyzerPrompt } from './prompt-builders';
import { ChainSpecSchema } from './schemas';
import type { ChainSpec } from '@/types';
import { callOpenRouter, PERSONA_MODEL } from './openrouter';

export async function analyzeContent(text: string): Promise<ChainSpec> {
  const prompt = buildAnalyzerPrompt(text);

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt, PERSONA_MODEL);

      // Strip any accidental markdown fences
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed = JSON.parse(cleaned);
      const validated = ChainSpecSchema.parse(parsed);
      return validated;

    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Content Analyzer failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      // Brief pause before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error('Content Analyzer: unreachable');
}
