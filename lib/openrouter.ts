// ============================================================
// Drift — OpenRouter API wrapper
// Uses openrouter/free for all calls with automatic key rotation
// and built-in throttling to stay within free-tier rate limits.
// ============================================================

const DRIFT_MODEL = 'openrouter/free';

// Re-export for backward compat with imports elsewhere
export const FREE_MODELS = [
  'z-ai/glm-4.5-air:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free'
];
export const PERSONA_MODEL = DRIFT_MODEL;
export const METRICS_MODEL = DRIFT_MODEL;

// ── Global round-robin key counter ───────────────────────────
let _callCounter = 0;

function getNextApiKey(): { key: string; label: string } {
  const num = (_callCounter % 3) + 1;
  _callCounter++;
  const key = process.env[`OPENROUTER_API_KEY_${num}`];
  if (!key) {
    throw new Error(`API key missing. Set OPENROUTER_API_KEY_${num} in .env.local`);
  }
  return { key, label: `KEY_${num}` };
}

// ── Throttle: enforce minimum gap between calls ──────────────
const MIN_GAP_MS = 2500;
let _lastCallTs = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - _lastCallTs;
  if (_lastCallTs > 0 && elapsed < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  _lastCallTs = Date.now();
}

// ── Main call function ───────────────────────────────────────
export async function callOpenRouter(prompt: string): Promise<string> {
  const maxAttempts = 4; // up to 5 tries
  let emptyCount = 0;

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    await throttle();

    // Pick a fresh key each attempt (helps when one key's routed model returns empty)
    const { key, label } = getNextApiKey();

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Drift'
        },
        body: JSON.stringify({
          model: DRIFT_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
        })
      });

      // ── 429 handling ─────────────────────────────────────
      if (response.status === 429) {
        if (attempt >= maxAttempts) {
          const body = await response.text();
          throw new Error(`Rate limit exceeded [${label}]: ${body}`);
        }
        const wait = (attempt + 1) * 5000;
        console.warn(`[Drift] 429 on ${label}, waiting ${wait / 1000}s (attempt ${attempt + 1}/${maxAttempts + 1})`);
        await new Promise(r => setTimeout(r, wait));
        _lastCallTs = Date.now();
        continue;
      }

      // ── Other HTTP errors ────────────────────────────────
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter error [${label}]: ${response.status} ${body}`);
      }

      // ── Parse response ───────────────────────────────────
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      // Handle empty/null — retry immediately with next key, no long wait
      if (typeof content !== 'string' || content.trim().length === 0) {
        emptyCount++;
        if (emptyCount > 3) {
          throw new Error(`OpenRouter returned empty content ${emptyCount} times [${label}]`);
        }
        console.warn(`[Drift] Empty response on ${label}, rotating key and retrying immediately (empty #${emptyCount})`);
        continue;
      }

      return content;

    } catch (err) {
      if (attempt >= maxAttempts) {
        throw new Error(`callOpenRouter failed after ${maxAttempts + 1} attempts: ${err}`);
      }
      const wait = (attempt + 1) * 3000;
      console.warn(`[Drift] Error on ${label}, retrying in ${wait / 1000}s (attempt ${attempt + 1}/${maxAttempts + 1}): ${err}`);
      await new Promise(r => setTimeout(r, wait));
      _lastCallTs = Date.now();
    }
  }

  throw new Error('unreachable');
}
