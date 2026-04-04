// ============================================================
// Drift — OpenRouter API wrapper
// ============================================================

export const PERSONA_MODEL = 'anthropic/claude-3.5-sonnet';
export const METRICS_MODEL = 'anthropic/claude-3.5-sonnet';

export async function callOpenRouter(prompt: string, model: string = PERSONA_MODEL): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("API key missing. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY");
  }

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Drift'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
        })
      });

      if (!response.ok) {
        const errObj = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errObj}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      attempt++;
      if (attempt > maxAttempts) {
        throw new Error(`Failed to call OpenRouter after ${maxAttempts + 1} attempts: ${err}`);
      }
      // Brief pause before retry
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  throw new Error("unreachable");
}
