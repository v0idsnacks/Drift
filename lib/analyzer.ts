// ============================================================
// Drift — Content Analyzer
// Calls the LLM to generate a ChainSpec from raw text.
// ============================================================

import { buildAnalyzerPrompt } from './prompt-builders';
import { ChainSpecSchema } from './schemas';
import type { ChainSpec } from '@/types';
import { callOpenRouter } from './openrouter';

// Robust JSON extraction — handles markdown fences, preamble, etc.
function extractJson(raw: string): unknown {
  let text = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(text); } catch { /* continue */ }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* continue */ }
  }

  throw new SyntaxError(`Could not extract valid JSON from LLM response (${text.length} chars). First 200 chars: ${text.slice(0, 200)}`);
}

export async function analyzeContent(text: string): Promise<ChainSpec> {
  const prompt = buildAnalyzerPrompt(text);

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    try {
      const rawText = await callOpenRouter(prompt);
      const parsed = extractJson(rawText);
      const validated = ChainSpecSchema.parse(parsed);
      return validated;

    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Content Analyzer failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      console.warn(`[Drift] Analyzer parse failed (attempt ${attempt}/${maxAttempts + 1}): ${err}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  throw new Error('Content Analyzer: unreachable');
}
