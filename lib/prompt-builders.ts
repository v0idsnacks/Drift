// ============================================================
// Drift — Prompt Builder Functions
// All Claude prompts live here as typed template functions.
// ============================================================

import type { PersonaSpec, ChainSpec } from '@/types';

// ── Content Analyzer Prompt ───────────────────────────────────
export function buildAnalyzerPrompt(text: string): string {
  return `You are an information cascade analyst. Your job is to analyze a piece of content and output a complete cascade chain specification as JSON.

Output ONLY valid JSON. No preamble. No markdown fences. No explanation. Just the JSON object.

SCHEMA:
{
  "contentType": "academic" | "political" | "health" | "tech" | "news" | "legal" | "financial" | "entertainment",
  "contentSummary": "1-sentence description of what this content claims",
  "primaryDistortionMode": "confidence-inflation" | "detail-loss" | "framing-shift" | "context-stripping" | "fabrication",
  "chainDepth": 3-7,
  "personas": [
    {
      "id": "unique-kebab-case-id",
      "name": "Human-readable persona name",
      "role": "2-sentence description of who this person is",
      "platform": "Where they publish or share this content",
      "biases": ["bias 1", "bias 2", "bias 3"],
      "attentionSpan": "full" | "skim" | "headline-only",
      "incentive": "What drives their transformation of this content",
      "transformationStyle": "1-sentence description of how they transform content"
    }
  ],
  "expectedFidelitySlope": "steep" | "gradual" | "cliff" | "plateau-then-drop",
  "vulnerabilityScore": 0-100,
  "keyClaimsToTrack": ["claim 1", "claim 2", "claim 3"]
}

CONTENT TYPE DETECTION:
- academic: methodology, citations, statistical language, hedged claims ("suggests", "may", "preliminary")
- political: policy positions, named officials, advocacy language, partisan framing
- health: medical/nutritional claims, risk language, body/wellness focus
- tech: product features, company names, technical specs, launch language
- news: current events, quotes from officials, dateline structure
- legal: court rulings, legislation, legal terminology, jurisdiction references
- financial: earnings, market data, analyst language, investment framing
- entertainment: celebrity, culture, reviews, trends

CHAIN MAPPING (use as starting point, adapt to content):
- academic → [science-journalist, tech-blogger, twitter-user, reddit-commenter, comment-section]
- political → [news-anchor, opposition-pundit, political-blogger, meme-creator, viral-share]
- health → [health-blogger, fitness-influencer, wellness-account, whatsapp-forward, repost]
- tech → [tech-journalist, reddit-thread, linkedin-post, hacker-news-commenter, twitter-user]
- news → [aggregator, social-media-user, reaction-post, dm-forward, repost]

VULNERABILITY SCORE GUIDE:
- 90-100: Highly technical with many caveats → almost certain to be distorted
- 70-89: Politically adjacent or emotionally resonant → likely to be framed
- 50-69: General news → moderate distortion expected
- 30-49: Simple factual content → harder to distort significantly
- 0-29: Direct quotes, video transcripts → low vulnerability

KEY CLAIMS TO TRACK:
Extract 3-5 specific, falsifiable facts. Prioritize: numbers, statistics, named people, causal claims ("X causes Y"), direct quotes, dates, percentages.

CONTENT TO ANALYZE:
---
${text}
---`;
}

// ── Persona Transformation Prompt ────────────────────────────
export function buildPersonaPrompt(
  persona: PersonaSpec,
  previousNodeOutput: string,
  originalSource: string,
  nodeIndex: number
): string {
  const isFirstNode = nodeIndex === 0;
  const contentLabel = isFirstNode ? 'original source material' : 'content from another source';

  return `You are ${persona.name}.

${persona.role}

Your platform: ${persona.platform}
Your incentive: ${persona.incentive}
Your attention span: ${persona.attentionSpan === 'full' ? 'You read everything carefully' : persona.attentionSpan === 'skim' ? 'You skim — you catch headlines and key phrases but miss nuance' : 'You only read the headline or first sentence'}

Your behavioral tendencies:
${persona.biases.map(b => `- ${b}`).join('\n')}

Your transformation style: ${persona.transformationStyle}

You have just encountered the following ${contentLabel}:
---
${previousNodeOutput}
---

Transform this content exactly as ${persona.name} would — filtered through your role, platform, biases, attention span, and incentive.

RULES:
- Output ONLY the content you would produce. No preamble. No explanation. No meta-commentary.
- Write in the natural format for your platform (tweet = ≤280 chars, blog post = 3-5 paragraphs, WhatsApp message = casual short text, LinkedIn = professional paragraph, Reddit comment = conversational, meme caption = punchy 1-2 lines).
- You MAY drop information freely — you have limited attention and space.
- You may NOT add information you don't have. You can only work with what you read.
- Honor your attention span. If you are a headline-only reader, you may only reference the first sentence.
- Do NOT write "[As a journalist...]" or any self-referential framing. Just write the content itself.`;
}

// ── Metrics Scoring Prompt ────────────────────────────────────
export function buildMetricsPrompt(
  originalSource: string,
  currentNodeOutput: string,
  previousNodeOutput: string,
  keyClaimsToTrack: string[],
  nodeIndex: number
): string {
  return `You are a drift metrics analyst. Compare a transformed piece of content against its original source and output scoring as JSON.

Output ONLY valid JSON. No preamble. No markdown. No explanation.

SCHEMA:
{
  "fidelityScore": 0-100,
  "confidenceInflation": 0-100,
  "detailSurvivalRate": 0-100,
  "framingPolarity": -100 to 100,
  "survivingClaims": ["claim still present and accurate"],
  "lostClaims": ["claim no longer present"],
  "distortedClaims": ["claim present but altered"],
  "addedClaims": ["claim not in original — fabricated or inferred"],
  "primaryDistortionObserved": "1 sentence describing the main way this node distorted the content"
}

SCORING GUIDE:
- fidelityScore: How much of the ORIGINAL MEANING survives? 100 = identical meaning. 0 = completely different meaning. Be calibrated — 80 means 80%, not 60%.
- confidenceInflation: How much MORE certain is the language compared to original? 0 = same hedging level. 100 = maximum inflation (original said "may" → now says "definitely proves"). Track words: suggests/may/could/preliminary/possible → shows/proves/definitely/always/never.
- detailSurvivalRate: What % of key claims are still present AND accurate? Count surviving claims / total key claims × 100.
- framingPolarity: 0 = neutral tone. Negative (-100) = alarming, fearful, crisis-framing. Positive (+100) = excited, hype-framing, sensationalist.

CLAIM TRACKING:
For each key claim below, classify as: survived (present and accurate) | distorted (present but altered) | lost (not present) | fabricated (not in original).

Key claims to track:
${keyClaimsToTrack.map((c, i) => `${i + 1}. ${c}`).join('\n')}

ORIGINAL SOURCE (always compare against this):
---
${originalSource}
---

PREVIOUS NODE OUTPUT (what this node received as input):
---
${previousNodeOutput}
---

CURRENT NODE OUTPUT (what this node produced — score this):
---
${currentNodeOutput}
---`;
}

// ── Damage Segment Prompt ─────────────────────────────────────
export function buildDamagePrompt(
  originalSource: string,
  finalNodeOutput: string
): string {
  return `You are a text damage analyst. Compare the final transformed text against the original source and tag each sentence/clause of the original with its fate.

Output ONLY valid JSON array. No preamble. No markdown.

SCHEMA:
[
  {
    "text": "exact sentence or clause from original",
    "fate": "survived" | "paraphrased" | "lost" | "fabricated",
    "appearsInNodeIndices": [0, 1, 2]
  }
]

FATE DEFINITIONS:
- survived: This exact claim is present in the final output with the same meaning
- paraphrased: This claim is present but substantially reworded (meaning preserved, words changed)
- lost: This claim does not appear in the final output at all
- fabricated: This text did NOT appear in the original — it was added (return these as separate objects at the end)

Split the original into individual sentences or meaningful clauses. Each should be a complete thought.

ORIGINAL SOURCE:
---
${originalSource}
---

FINAL TRANSFORMED OUTPUT:
---
${finalNodeOutput}
---`;
}
