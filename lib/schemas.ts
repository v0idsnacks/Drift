// ============================================================
// Drift — Zod Validation Schemas
// ============================================================

import { z } from 'zod';

// ── API Request Schemas ───────────────────────────────────────
export const AnalyzeRequestSchema = z.object({
  text: z.string().min(50, 'Text must be at least 50 characters').max(10000),
});

export const FetchUrlRequestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});

export const CascadeRequestSchema = z.object({
  source: z.string().min(50).max(10000),
  chainSpec: z.object({
    contentType: z.enum(['academic', 'political', 'health', 'tech', 'news', 'legal', 'financial', 'entertainment']),
    contentSummary: z.string(),
    primaryDistortionMode: z.enum(['confidence-inflation', 'detail-loss', 'framing-shift', 'context-stripping', 'fabrication']),
    chainDepth: z.number().min(3).max(7),
    personas: z.array(z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      platform: z.string(),
      biases: z.array(z.string()),
      attentionSpan: z.enum(['full', 'skim', 'headline-only']),
      incentive: z.string(),
      transformationStyle: z.string(),
    })),
    expectedFidelitySlope: z.enum(['steep', 'gradual', 'cliff', 'plateau-then-drop']),
    vulnerabilityScore: z.number().min(0).max(100),
    keyClaimsToTrack: z.array(z.string()).min(3).max(5),
  }).refine((data) => data.personas.length === data.chainDepth, {
    message: "personas array length must equal chainDepth",
    path: ["personas"],
  }).refine((data) => new Set(data.personas.map(p => p.id)).size === data.personas.length, {
    message: "persona ids must be unique",
    path: ["personas"],
  }),
});

// ── Claude Response Schemas ───────────────────────────────────
export const ChainSpecSchema = z.object({
  contentType: z.enum(['academic', 'political', 'health', 'tech', 'news', 'legal', 'financial', 'entertainment']),
  contentSummary: z.string(),
  primaryDistortionMode: z.enum(['confidence-inflation', 'detail-loss', 'framing-shift', 'context-stripping', 'fabrication']),
  chainDepth: z.number().min(3).max(7),
  personas: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    platform: z.string(),
    biases: z.array(z.string()),
    attentionSpan: z.enum(['full', 'skim', 'headline-only']),
    incentive: z.string(),
    transformationStyle: z.string(),
  })),
  expectedFidelitySlope: z.enum(['steep', 'gradual', 'cliff', 'plateau-then-drop']),
  vulnerabilityScore: z.number().min(0).max(100),
  keyClaimsToTrack: z.array(z.string()).min(3).max(5),
}).refine((data) => data.personas.length === data.chainDepth, {
  message: "personas array length must equal chainDepth",
  path: ["personas"],
}).refine((data) => new Set(data.personas.map(p => p.id)).size === data.personas.length, {
  message: "persona ids must be unique",
  path: ["personas"],
});

export const NodeMetricsSchema = z.object({
  nodeIndex: z.number().optional(),
  personaId: z.string().optional(),
  fidelityScore: z.number().min(0).max(100),
  confidenceInflation: z.number().min(0).max(100),
  detailSurvivalRate: z.number().min(0).max(100),
  framingPolarity: z.number().min(-100).max(100),
  fidelityDelta: z.number().min(-100).max(100),
  confidenceInflationDelta: z.number().optional(),
  detailSurvivalDelta: z.number().optional(),
  framingPolarityDelta: z.number().optional(),
  survivingClaims: z.array(z.string()),
  lostClaims: z.array(z.string()),
  distortedClaims: z.array(z.string()),
  addedClaims: z.array(z.string()),
  primaryDistortionObserved: z.string(),
});

export const SessionIdSchema = z.string().uuid('Invalid Session ID format');

export const NodeOutputSchema = z.object({
  personaId: z.string(),
  personaName: z.string(),
  personaRole: z.string(),
  transformedText: z.string(),
  tokenCount: z.number(),
});

export const TextSegmentSchema = z.object({
  text: z.string(),
  fate: z.enum(['survived', 'paraphrased', 'lost', 'fabricated']),
  appearsInNodeIndices: z.array(z.number()),
});

export const CascadeResultSchema = z.object({
  sessionId: SessionIdSchema,
  source: z.string(),
  chainSpec: ChainSpecSchema,
  nodes: z.array(NodeOutputSchema),
  metrics: z.array(NodeMetricsSchema),
  damageSegments: z.array(TextSegmentSchema).optional(),
  disagreementScore: z.number().min(0).max(100),
  computedAt: z.string().datetime().optional(),
});
