# execPlan.md — Drift: Information Decay Visualization Engine

> **Aditya Bhardwaj** · github.com/v0idsnacks · March 2026  
> Status: `PRE-BUILD` · Version: `1.0.0`

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Guiding Principles](#2-guiding-principles)
3. [Repository Structure](#3-repository-structure)
4. [Environment Setup](#4-environment-setup)
5. [The Content Analyzer — Critical Path](#5-the-content-analyzer--critical-path)
6. [Cascade Engine](#6-cascade-engine)
7. [Drift Metrics System](#7-drift-metrics-system)
8. [API Layer Design](#8-api-layer-design)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Visualization Layer](#10-visualization-layer)
11. [Week-by-Week Sprint Plan](#11-week-by-week-sprint-plan)
12. [Day-by-Day Task Breakdown](#12-day-by-day-task-breakdown)
13. [Prompt Engineering Reference](#13-prompt-engineering-reference)
14. [Data Schemas](#14-data-schemas)
15. [Testing Strategy](#15-testing-strategy)
16. [Launch Checklist](#16-launch-checklist)
17. [Future Roadmap](#17-future-roadmap)

---

## 1. Project Summary

**Drift** is a sequential multi-LLM pipeline that simulates how information mutates as it passes through different human interpreters. Given any source text or URL, Drift:

1. Analyzes the content type and builds a contextually realistic persona chain
2. Passes the content sequentially through each persona (journalist → blogger → Twitter user → etc.)
3. Measures distortion at each node across 4 metrics
4. Visualizes the decay as a river, a timeline, or a damage overlay

```
Source Text / URL
      │
      ▼
┌─────────────────┐
│ Content Analyzer│  ← determines chain type, depth, distortion mode
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Node 1        │────▶│   Node 2        │────▶│   Node N        │
│  (Persona A)    │     │  (Persona B)    │     │  (Persona C...) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         ▼                       ▼                        ▼
    [Metrics]               [Metrics]               [Metrics]
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Visualization Layer   │
                    │  River / Timeline /    │
                    │  Damage Report         │
                    └────────────────────────┘
```

**Core insight:** This is NOT parallel model evaluation (LLM Council). This is sequential epistemic decay modeling. Each node receives the *previous node's output*, not the original. Distortion compounds. That's the point.

---

## 2. Guiding Principles

These govern every technical and design decision made in this project.

| Principle | What It Means in Practice |
|---|---|
| **Sequential over parallel** | Each node transforms the prior node's output — never the original |
| **Compounding decay** | Metrics should worsen (or improve!) non-linearly across the chain |
| **Persona realism** | Each persona's transformation should feel behaviorally accurate, not generic |
| **Metric honesty** | Report distortion even if it's severe — don't soften the output |
| **Single model** | Use Claude for all nodes (consistency of distortion measurement, not model variance) |
| **Visual-first** | The River View is the product. The metrics are its proof. |
| **Zero friction demo** | Any visitor should understand Drift in under 10 seconds with no explanation |

---

## 3. Repository Structure

```
drift/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── analyze/
│   │   └── page.tsx               # Main analysis view
│   ├── result/
│   │   └── [sessionId]/
│   │       └── page.tsx           # Shareable result permalink
│   └── api/
│       ├── analyze/
│       │   └── route.ts           # POST: content analyzer
│       ├── cascade/
│       │   └── route.ts           # POST: run full cascade
│       ├── fetch-url/
│       │   └── route.ts           # POST: URL fetch + extract
│       └── session/
│           └── [sessionId]/
│               └── route.ts       # GET: retrieve saved session
├── components/
│   ├── views/
│   │   ├── RiverView.tsx          # D3 river visualization
│   │   ├── TimelineView.tsx       # Node card chain
│   │   └── DamageReport.tsx       # Color-coded overlay
│   ├── ui/
│   │   ├── MetricBar.tsx          # 4-metric display component
│   │   ├── PersonaCard.tsx        # Single node card
│   │   ├── InputPanel.tsx         # Text paste + URL input
│   │   ├── ChainPreview.tsx       # Shows chain before running
│   │   └── DisagreementScore.tsx  # Cross-node variance indicator
│   └── layout/
│       ├── Header.tsx
│       └── ViewSwitcher.tsx       # River / Timeline / Damage tabs
├── lib/
│   ├── analyzer.ts                # Content Analyzer logic
│   ├── cascade.ts                 # Cascade Engine orchestration
│   ├── metrics.ts                 # Drift Metrics computation
│   ├── extractor.ts               # URL fetch + Cheerio extraction
│   ├── personas.ts                # Persona definitions + prompts
│   ├── schemas.ts                 # Zod schemas for all API types
│   └── utils.ts                   # Shared utilities
├── prompts/
│   ├── analyzer.md                # Content Analyzer system prompt
│   ├── persona-base.md            # Base persona transformation prompt
│   ├── metrics.md                 # Drift Metrics scoring prompt
│   └── personas/
│       ├── journalist.md
│       ├── blogger.md
│       ├── twitter-user.md
│       ├── reddit-commenter.md
│       ├── meme-creator.md
│       ├── whatsapp-forward.md
│       ├── linkedin-post.md
│       ├── science-journalist.md
│       ├── health-blogger.md
│       └── opposition-pundit.md
├── types/
│   └── index.ts                   # All shared TypeScript types
├── public/
│   └── examples/                  # 3 pre-run example sessions (JSON)
├── .env.local                     # ANTHROPIC_API_KEY
├── execPlan.md                    # This file
└── README.md
```

---

## 4. Environment Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- Anthropic API key

### Bootstrap

```bash
# Create Next.js app
npx create-next-app@latest drift --typescript --tailwind --app --src-dir=false
cd drift

# Core dependencies
npm install cheerio node-fetch zod uuid

# Visualization
npm install d3 @types/d3

# Animation
npm install framer-motion

# Dev utilities
npm install -D @types/node
```

### Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verify Setup

```bash
npm run dev
# Should open on localhost:3000 with no errors
```

---

## 5. The Content Analyzer — Critical Path

> ⚠️ **This is step zero. Do not write any UI until this works correctly across 5+ content types.**

The Content Analyzer is the most important component in Drift. It receives the raw source content and outputs a complete chain specification — persona sequence, depth, expected primary distortion mode, and contextual metadata.

### What It Must Output (JSON)

```typescript
interface ChainSpec {
  contentType: 'academic' | 'political' | 'health' | 'tech' | 'news' | 'legal' | 'financial' | 'entertainment';
  contentSummary: string;           // 1-sentence description of the source
  primaryDistortionMode: 'confidence-inflation' | 'detail-loss' | 'framing-shift' | 'context-stripping' | 'fabrication';
  chainDepth: number;               // 3–7
  personas: PersonaSpec[];
  expectedFidelitySlope: 'steep' | 'gradual' | 'cliff' | 'plateau-then-drop';
  vulnerabilityScore: number;       // 0–100: how distortion-prone is this content?
  keyClaimsToTrack: string[];       // 3–5 specific facts the system will track across nodes
}

interface PersonaSpec {
  id: string;
  name: string;                     // e.g. "Science Journalist"
  role: string;                     // e.g. "Writes for a mid-tier science publication"
  platform: string;                 // e.g. "Online magazine"
  biases: string[];                 // e.g. ["simplifies methodology", "leads with dramatic findings"]
  attentionSpan: 'full' | 'skim' | 'headline-only';
  incentive: string;                // e.g. "maximize clicks and shares"
  transformationStyle: string;      // e.g. "Rewrites as accessible narrative, drops caveats"
}
```

### Content Type → Chain Mapping Reference

| Content Type | Default Chain | Depth | Primary Distortion |
|---|---|---|---|
| Academic paper | Researcher → Science Journalist → Tech Blog → Twitter Thread → Comment Section | 5 | Confidence inflation |
| Political statement | Politician → News Anchor → Opposition Pundit → Meme Page → Viral Share | 5 | Framing shift |
| Health / medical | Doctor Report → Health Blog → Fitness Influencer → WhatsApp Forward → Repost | 5 | Confidence inflation |
| Tech announcement | Press Release → Tech Journalist → Reddit Thread → LinkedIn Post → HN Comment | 5 | Detail loss |
| General news | Reporter → Aggregator → Social Media → Reaction Post → DM Forward | 4 | Context stripping |
| Legal ruling | Court Decision → Legal Journalist → News Brief → Social Media → Share | 4 | Context stripping + framing |
| Financial report | Analyst Report → Financial Press → Business Blog → Twitter Thread → Retail Investor Post | 5 | Confidence inflation |

### Analyzer Prompt Location

```
prompts/analyzer.md
```

Write this prompt before anything else. It must:

1. Accept raw text (already extracted from URL if applicable)
2. Detect content type from vocabulary, structure, and domain
3. Output **only valid JSON** — no preamble, no markdown fences
4. Select the most realistic persona chain for that content's natural distribution path
5. Identify 3–5 specific, trackable claims (numbers, names, causal statements)

### Test Cases for Analyzer (Run Before Building UI)

```
Test 1: Paste abstract from a Nature study on diet and longevity
Expected: contentType=academic, primaryDistortionMode=confidence-inflation, depth=5

Test 2: Paste a press release from a tech company's product launch
Expected: contentType=tech, primaryDistortionMode=detail-loss, depth=5

Test 3: Paste a politician's statement on immigration
Expected: contentType=political, primaryDistortionMode=framing-shift, depth=5

Test 4: Paste a health department advisory on a new supplement finding
Expected: contentType=health, primaryDistortionMode=confidence-inflation, depth=5

Test 5: Paste a short BBC news headline + opening paragraph
Expected: contentType=news, primaryDistortionMode=context-stripping, depth=4
```

All 5 must pass before moving to the Cascade Engine.

---

## 6. Cascade Engine

### How It Works

The cascade engine takes the `ChainSpec` from the analyzer and runs sequential transformations. Critical rule: **each node receives the previous node's output, never the original source.**

```typescript
// lib/cascade.ts

interface CascadeInput {
  source: string;           // Original cleaned text
  chainSpec: ChainSpec;     // From Content Analyzer
}

interface NodeOutput {
  personaId: string;
  personaName: string;
  transformedText: string;
  rawPromptUsed: string;    // Store for debugging
  tokenCount: number;
}

interface CascadeResult {
  sessionId: string;
  source: string;
  chainSpec: ChainSpec;
  nodes: NodeOutput[];
  metrics: NodeMetrics[];   // Computed after each node
  computedAt: string;
}
```

### Cascade Execution Flow

```typescript
async function runCascade(input: CascadeInput): Promise<CascadeResult> {
  const nodes: NodeOutput[] = [];
  const metrics: NodeMetrics[] = [];
  
  let currentText = input.source;
  
  for (const persona of input.chainSpec.personas) {
    // 1. Build persona-specific prompt
    const prompt = buildPersonaPrompt(persona, currentText, input.source);
    
    // 2. Call Claude API
    const transformed = await callClaude(prompt);
    
    // 3. Compute metrics vs original source
    const nodeMetrics = await computeMetrics(input.source, transformed, currentText);
    
    // 4. Store node output
    nodes.push({ personaId: persona.id, personaName: persona.name, transformedText: transformed, ... });
    metrics.push(nodeMetrics);
    
    // 5. CRITICAL: next node receives THIS node's output
    currentText = transformed;
  }
  
  return { sessionId: generateId(), source: input.source, chainSpec: input.chainSpec, nodes, metrics, computedAt: new Date().toISOString() };
}
```

### Persona Prompt Construction

Each persona prompt must include:

1. **Role brief** — who this persona is (2–3 sentences)
2. **Platform context** — where they publish / share this
3. **Behavioral instructions** — how they transform content (their biases, attention span, incentives)
4. **Source content** — the text they are transforming (previous node's output)
5. **Output constraint** — produce ONLY the transformed content, no meta-commentary

```markdown
<!-- prompts/persona-base.md template -->

You are {{persona.name}}.

{{persona.role}}. You publish on {{persona.platform}}.

Your behavioral tendencies:
{{persona.biases as bullet list}}

Your primary incentive: {{persona.incentive}}

You have just encountered the following content:
---
{{previousNodeOutput}}
---

Transform this content exactly as {{persona.name}} would — based on your role, platform, biases, and incentive. 

Rules:
- Write ONLY the transformed content. No preamble, no explanation.
- Write in the natural format for your platform (tweet = 280 chars, blog = 3–5 paragraphs, etc.)
- Do NOT add information you don't have. You may DROP information freely.
- Your attention span is: {{persona.attentionSpan}} — honor that.
- Output the text only.
```

---

## 7. Drift Metrics System

### The 4 Metrics

All metrics are computed by a dedicated Claude call after each node. The metrics prompt receives:

- The **original source** (always the root, never a prior node)
- The **current node output**
- The **prior node output** (for delta computation)
- The **key claims to track** (from ChainSpec)

```typescript
interface NodeMetrics {
  nodeIndex: number;
  personaId: string;
  
  fidelityScore: number;           // 0–100: semantic similarity to original
  confidenceInflation: number;     // 0–100: how certain vs hedged the language is now
  detailSurvivalRate: number;      // 0–100: % of key claims still present
  framingPolarity: number;         // -100 to +100: neutral=0, alarmed=negative, charged=positive
  
  // Deltas vs prior node
  fidelityDelta: number;
  confidenceInflationDelta: number;
  detailSurvivalDelta: number;
  framingPolarityDelta: number;
  
  // Claim tracking
  survivingClaims: string[];
  lostClaims: string[];
  distortedClaims: string[];       // Present but altered
  addedClaims: string[];           // Not in original — fabricated or inferred
  
  // Qualitative
  primaryDistortionObserved: string;   // 1 sentence describing what this node did
}
```

### Metrics Prompt Design

The metrics prompt must output **only valid JSON** with the `NodeMetrics` shape. It must:

1. Never hallucinate claims that aren't in the text
2. Be calibrated — a 90% fidelity score should mean 90%, not 70%
3. Track claims lexically AND semantically (a number paraphrased is still that claim)

### Disagreement Score (Computed at End)

After all nodes run, compute the **Disagreement Score** — how much variance exists across nodes in their distortion patterns.

```typescript
function computeDisagreementScore(metrics: NodeMetrics[]): number {
  // High score = nodes distorted very differently (content is ambiguous/contested)
  // Low score = nodes distorted similarly (content has a clear natural decay path)
  const fidelityVariance = variance(metrics.map(m => m.fidelityScore));
  const framingVariance = variance(metrics.map(m => m.framingPolarity));
  return normalize(fidelityVariance + framingVariance, 0, 100);
}
```

---

## 8. API Layer Design

### Endpoints

#### `POST /api/fetch-url`
Fetches and extracts clean text from a URL.

```typescript
// Request
{ url: string }

// Response
{ cleanText: string; title: string; source: string; wordCount: number; }
```

Uses `cheerio` to strip nav, ads, footers. Returns only article body text.

#### `POST /api/analyze`
Runs the Content Analyzer on provided text.

```typescript
// Request
{ text: string }

// Response
{ chainSpec: ChainSpec }
```

#### `POST /api/cascade`
Runs the full cascade from a ChainSpec + source text. This is the expensive call — streams progress if possible.

```typescript
// Request
{ source: string; chainSpec: ChainSpec; }

// Response
{ sessionId: string; result: CascadeResult; }
```

#### `GET /api/session/[sessionId]`
Retrieves a saved cascade result for shareable links.

```typescript
// Response
{ result: CascadeResult; }
```

### API Call Budget

For a typical 5-node cascade:

| Call | Model | Est. Tokens | Est. Cost |
|---|---|---|---|
| Content Analyzer | claude-sonnet-4-6 | ~800 in / ~400 out | ~$0.002 |
| Node 1–5 (×5) | claude-sonnet-4-6 | ~600 in / ~300 out each | ~$0.007 |
| Metrics 1–5 (×5) | claude-sonnet-4-6 | ~900 in / ~400 out each | ~$0.010 |
| **Total per run** | | **~10,000 tokens** | **~$0.019** |

Under $0.02 per full cascade. Viable for free tier with rate limiting.

---

## 9. Frontend Architecture

### Pages

```
/                        → Landing page with hero + 3 pre-run examples
/analyze                 → Main tool: input → chain preview → running → results
/result/[sessionId]      → Shareable permalink (SSG from saved JSON)
```

### State Management

Use React `useState` + `useReducer` for cascade state. No external state library needed.

```typescript
type AppState =
  | { phase: 'idle' }
  | { phase: 'fetching-url'; url: string }
  | { phase: 'analyzing'; text: string }
  | { phase: 'chain-preview'; text: string; chainSpec: ChainSpec }
  | { phase: 'cascading'; progress: number; nodesComplete: NodeOutput[] }
  | { phase: 'complete'; result: CascadeResult }
  | { phase: 'error'; message: string }
```

### Component Hierarchy

```
<AnalyzePage>
  ├── <InputPanel>           # Text paste + URL input tabs
  ├── <ChainPreview>         # Shows chain BEFORE running (confirm step)
  ├── <CascadeProgress>      # Live node-by-node progress indicator
  └── <ResultsView>
      ├── <ViewSwitcher>     # River / Timeline / Damage tabs
      ├── <DisagreementScore>
      ├── <RiverView>        # D3 visualization
      ├── <TimelineView>     # Card chain
      └── <DamageReport>     # Overlay view
```

### UX Flow

```
User lands on /analyze
    │
    ├── Pastes text  OR  enters URL
    │                        │
    │                    [fetch + extract]
    │                        │
    └────────────────────────┘
                │
          [Content Analyzer runs]
                │
          ┌─────▼──────┐
          │Chain Preview│  ← user sees: "This will go through: Journalist → Blog → Twitter → Reddit"
          │  (confirm)  │  ← user can optionally tweak depth
          └─────┬──────┘
                │  [Run Cascade]
                │
          [Nodes run one-by-one, progress shown live]
                │
          [Results appear]
                │
    ┌───────────┼───────────┐
    │           │           │
 River      Timeline    Damage
  View        View      Report
```

---

## 10. Visualization Layer

### River View (D3.js)

The signature visual. A river SVG that flows left-to-right, widens with distortion, and darkens in color as fidelity drops.

**Key D3 concepts to use:**

```typescript
// River width at each node = inverse of fidelity score
const riverWidth = (fidelity: number) => d3.scaleLinear()
  .domain([100, 0])
  .range([8, 80])(fidelity);

// River color = fidelity-mapped color scale
const riverColor = d3.scaleSequential()
  .domain([100, 0])
  .interpolator(d3.interpolateRgb("#1A73E8", "#5C3A1E")); // blue → muddy brown

// Use d3.area() with a smooth curve for the river path
const area = d3.area<NodePoint>()
  .x(d => xScale(d.nodeIndex))
  .y0(d => centerY - riverWidth(d.fidelity) / 2)
  .y1(d => centerY + riverWidth(d.fidelity) / 2)
  .curve(d3.curveCatmullRom);
```

**Interactions:**
- Hover over a river segment → tooltip shows persona name + metrics
- Click segment → jump to that node in Timeline View
- Animate river drawing on mount (path length animation)

### Timeline View

Horizontal scroll of `PersonaCard` components.

```typescript
// Each card shows:
interface PersonaCardProps {
  persona: PersonaSpec;
  output: NodeOutput;
  metrics: NodeMetrics;
  isExpanded: boolean;
  onExpand: () => void;
}
```

Collapsed: persona name, role badge, 4 metric bars, first 100 chars of output.  
Expanded: full transformed text with diff highlights vs previous node.

### Damage Report View

The original source text rendered with inline color-coded spans:

```typescript
type TextSegmentFate = 'survived' | 'paraphrased' | 'lost' | 'fabricated';

interface TextSegment {
  text: string;
  fate: TextSegmentFate;
  appearsInNodeIndices: number[];  // Which nodes this segment survived through
}
```

Color mapping:
- `survived` → `text-green-700 bg-green-50`
- `paraphrased` → `text-yellow-700 bg-yellow-50`
- `lost` → `text-red-500 bg-red-50 line-through`
- `fabricated` → `text-purple-700 bg-purple-50` (shown separately below original)

The segment analysis requires one additional Claude call at the end of the cascade — ask it to tag each sentence/clause of the original with its fate.

---

## 11. Week-by-Week Sprint Plan

### Week 1 — Core Engine (Days 1–7)

**Goal:** Working backend. CLI-testable. No UI.

| Day | Task |
|---|---|
| 1 | Write + test Content Analyzer prompt across 5 content types |
| 2 | Build `lib/analyzer.ts` — calls Claude, validates JSON output |
| 3 | Write all 10 persona prompts in `prompts/personas/` |
| 4 | Build `lib/cascade.ts` — sequential pipeline, stores all node outputs |
| 5 | Build `lib/metrics.ts` — 4 metrics computed per node via Claude |
| 6 | Wire all three into `POST /api/cascade` route, test end-to-end in curl |
| 7 | Buffer / fix bugs / refine prompts based on real output quality |

**Exit Condition:** `curl -X POST /api/cascade` with a pasted Nature abstract returns a complete `CascadeResult` JSON with 5 nodes and 4 metrics per node.

---

### Week 2 — Metrics + Timeline View (Days 8–14)

**Goal:** Functional, usable UI. Someone can try the tool.

| Day | Task |
|---|---|
| 8 | Build `POST /api/fetch-url` — Cheerio extraction |
| 9 | Build `<InputPanel>` — text paste + URL input tabs |
| 10 | Build `<ChainPreview>` — shows chain spec before running |
| 11 | Build `<MetricBar>` + `<PersonaCard>` components |
| 12 | Build `<TimelineView>` — card chain with expand/collapse |
| 13 | Add cascade progress state + live node-by-node UI updates |
| 14 | Mobile responsive pass + bug fixes |

**Exit Condition:** Full end-to-end flow works in browser. URL input → chain preview → cascade runs → Timeline View shows results on mobile and desktop.

---

### Week 3 — River View + Damage Report (Days 15–21)

**Goal:** Demo-ready. The visual that makes it go viral.

| Day | Task |
|---|---|
| 15 | Build River View SVG structure (static, no D3 animation yet) |
| 16 | Add D3 river path — width mapped to fidelity, color to distortion |
| 17 | Add River View hover interactions + segment click |
| 18 | Add mount animation (path drawing, staggered reveals) |
| 19 | Build Damage Report — segment tagging API call + overlay render |
| 20 | Add `<DisagreementScore>` component |
| 21 | Full polish pass — typography, spacing, transitions, empty states |

**Exit Condition:** River View animates on load. Hovering nodes shows correct data. Damage Report renders with color-coded segments. Disagreement Score displays accurately.

---

### Week 4 — Launch (Days 22–28)

**Goal:** Public. Shareable. On ProductHunt.

| Day | Task |
|---|---|
| 22 | Build landing page `/` — hero, 3 pre-run examples, CTA |
| 23 | Build shareable permalink `/result/[sessionId]` |
| 24 | Save session to JSON (filesystem or Vercel KV) |
| 25 | Share button + copy link functionality |
| 26 | Rate limiting on API routes (prevent abuse) |
| 27 | Write README + deploy to Vercel |
| 28 | ProductHunt draft + community posts (HN Show HN, r/MachineLearning) |

**Exit Condition:** Live at drift.vercel.app. Share link works. 3 pre-run examples load instantly on landing page.

---

## 12. Day-by-Day Task Breakdown

### Day 1 — Content Analyzer Prompt (Most Important Day)

```
Morning:
  [ ] Open prompts/analyzer.md — write the system prompt from scratch
  [ ] Define the JSON output schema in the prompt explicitly
  [ ] Include 2 few-shot examples in the prompt (academic + political)

Afternoon:
  [ ] Test with 5 content types via direct API call (no code yet)
  [ ] Refine prompt until all 5 return valid, accurate JSON
  [ ] Document what worked and what didn't in a comment block

Done when:
  [ ] 5/5 test cases produce correct contentType, depth, and personas
```

### Day 2 — Analyzer Integration

```
  [ ] Create lib/analyzer.ts
  [ ] Add Zod schema for ChainSpec validation
  [ ] Add error handling for malformed JSON responses
  [ ] Add retry logic (max 2 retries on parse failure)
  [ ] Create POST /api/analyze route
  [ ] Test via curl: curl -X POST http://localhost:3000/api/analyze -d '{"text":"..."}'
```

### Day 3 — Persona Prompts

```
  [ ] Write all 10 persona prompt files in prompts/personas/
  [ ] Each prompt must be self-contained and < 300 words
  [ ] Test each persona on the same input text
  [ ] Verify each persona produces noticeably different transformations
  [ ] Verify journalist does NOT produce a meme-style output
```

### Day 4 — Cascade Engine

```
  [ ] Create lib/cascade.ts
  [ ] Implement buildPersonaPrompt() — injects prior node output
  [ ] Implement runCascade() — sequential loop
  [ ] Log each node output to console for visual debugging
  [ ] Verify currentText updates to previous node output each iteration
```

### Day 5 — Metrics System

```
  [ ] Write prompts/metrics.md
  [ ] Create lib/metrics.ts
  [ ] Implement computeMetrics() — Claude call after each node
  [ ] Add Zod validation for NodeMetrics JSON
  [ ] Implement computeDisagreementScore() from full metrics array
```

### Day 6 — API Route + End-to-End Test

```
  [ ] Wire cascade + metrics into POST /api/cascade
  [ ] Add session ID generation (uuid)
  [ ] Full test: Nature abstract → curl → CascadeResult JSON
  [ ] Check: does distortion compound correctly? Is fidelity dropping?
  [ ] Check: are personas producing genuinely different outputs?
```

### Day 7 — Buffer

```
  [ ] Fix any prompt quality issues found in Day 6
  [ ] Add comprehensive error handling to all lib/ files
  [ ] Add TypeScript strict checks
  [ ] Write types/index.ts with all shared interfaces
```

---

## 13. Prompt Engineering Reference

### Analyzer Prompt Structure

```markdown
You are an information cascade analyst.

Your job: analyze the provided text and output a cascade chain specification as JSON.

Output ONLY valid JSON. No preamble. No markdown. No explanation.

Schema:
{schema as inline JSON comment}

Content type detection guide:
- academic: contains methodology, citations, statistical language, hedged claims ("suggests", "may", "preliminary")
- political: contains policy positions, named officials, advocacy language, partisan framing
- health: contains medical/nutritional claims, risk language, body/wellness focus
- tech: contains product features, company names, technical specifications, launch language
- news: current events, quotes from officials, dateline structure

Key claims to track: extract 3–5 specific, falsifiable facts. Prioritize: numbers, names, causal claims, statistical results, direct quotes.

Vulnerability score guide:
- 90–100: Highly technical content with many caveats → almost certain to be distorted
- 70–89: Politically adjacent or emotionally resonant → likely to be framed
- 50–69: General news → moderate distortion expected
- 30–49: Simple factual content → harder to distort significantly
- 0–29: Direct quotes, video transcripts → low vulnerability

Text to analyze:
---
{{text}}
---
```

### Persona Prompt Structure

```markdown
You are {{persona.name}}.

{{persona.role}}

Platform: {{persona.platform}}
Incentive: {{persona.incentive}}
Attention span: {{persona.attentionSpan}}

Your behavioral tendencies:
{{persona.biases}}

You have encountered this content:
---
{{previousNodeOutput}}
---

Transform it exactly as {{persona.name}} would. Write ONLY the output content in the natural format for your platform. No meta-commentary. No explanation. Just the content you would produce.
```

### Metrics Prompt Structure

```markdown
You are a drift metrics analyst. Compare the transformed text against the original source and output scoring as JSON.

Output ONLY valid JSON. No explanation.

Original source:
---
{{originalSource}}
---

Current transformation:
---
{{currentNodeOutput}}
---

Key claims to track:
{{keyClaimsToTrack as numbered list}}

Score each metric:
- fidelityScore (0–100): semantic similarity to original. 100 = identical meaning. 0 = completely different meaning.
- confidenceInflation (0–100): how much more certain/absolute is the language vs original? 0 = same hedging. 100 = maximum inflation ("proves", "definitely", "always").
- detailSurvivalRate (0–100): what % of key claims are still present and accurate?
- framingPolarity (-100 to +100): 0 = neutral. Negative = alarming/fearful. Positive = excited/charged.

For each key claim, classify as: survived | distorted | lost | fabricated
```

---

## 14. Data Schemas

### Full TypeScript Types

```typescript
// types/index.ts

export type ContentType = 
  | 'academic' | 'political' | 'health' | 'tech' 
  | 'news' | 'legal' | 'financial' | 'entertainment';

export type DistortionMode = 
  | 'confidence-inflation' | 'detail-loss' 
  | 'framing-shift' | 'context-stripping' | 'fabrication';

export type AttentionSpan = 'full' | 'skim' | 'headline-only';

export type FidelitySlope = 'steep' | 'gradual' | 'cliff' | 'plateau-then-drop';

export type TextSegmentFate = 'survived' | 'paraphrased' | 'lost' | 'fabricated';

export interface PersonaSpec {
  id: string;
  name: string;
  role: string;
  platform: string;
  biases: string[];
  attentionSpan: AttentionSpan;
  incentive: string;
  transformationStyle: string;
}

export interface ChainSpec {
  contentType: ContentType;
  contentSummary: string;
  primaryDistortionMode: DistortionMode;
  chainDepth: number;
  personas: PersonaSpec[];
  expectedFidelitySlope: FidelitySlope;
  vulnerabilityScore: number;
  keyClaimsToTrack: string[];
}

export interface NodeOutput {
  personaId: string;
  personaName: string;
  transformedText: string;
  tokenCount: number;
}

export interface ClaimStatus {
  claim: string;
  status: 'survived' | 'distorted' | 'lost';
  currentForm?: string;
}

export interface NodeMetrics {
  nodeIndex: number;
  personaId: string;
  fidelityScore: number;
  confidenceInflation: number;
  detailSurvivalRate: number;
  framingPolarity: number;
  fidelityDelta: number;
  confidenceInflationDelta: number;
  detailSurvivalDelta: number;
  framingPolarityDelta: number;
  survivingClaims: string[];
  lostClaims: string[];
  distortedClaims: string[];
  addedClaims: string[];
  primaryDistortionObserved: string;
}

export interface TextSegment {
  text: string;
  fate: TextSegmentFate;
  appearsInNodeIndices: number[];
}

export interface CascadeResult {
  sessionId: string;
  source: string;
  chainSpec: ChainSpec;
  nodes: NodeOutput[];
  metrics: NodeMetrics[];
  damageSegments?: TextSegment[];
  disagreementScore: number;
  computedAt: string;
}

export type AppPhase =
  | 'idle'
  | 'fetching-url'
  | 'analyzing'
  | 'chain-preview'
  | 'cascading'
  | 'complete'
  | 'error';

export interface AppState {
  phase: AppPhase;
  inputText: string;
  inputUrl: string;
  chainSpec: ChainSpec | null;
  cascadeProgress: number;
  partialNodes: NodeOutput[];
  result: CascadeResult | null;
  error: string | null;
  activeView: 'river' | 'timeline' | 'damage';
}
```

---

## 15. Testing Strategy

### Prompt Quality Tests (Manual, Day 1–5)

Run each test case and score output manually before writing any UI.

```
Analyzer Tests:
  [ ] Nature study abstract → academic, depth 5, confidence-inflation
  [ ] Apple product press release → tech, depth 5, detail-loss
  [ ] Politician tweet → political, depth 5, framing-shift
  [ ] NHS health advisory → health, depth 5, confidence-inflation
  [ ] BBC news opening paragraph → news, depth 4, context-stripping

Persona Quality Tests (same input through each):
  [ ] Science Journalist output reads like a magazine article, not a tweet
  [ ] Twitter User output is ≤ 280 chars
  [ ] WhatsApp Forward output sounds like something your uncle would send
  [ ] Meme Page output is hyperbolic and stripped of all caveats
  [ ] Reddit Commenter output includes editorializing ("typical", "of course")

Metrics Calibration Tests:
  [ ] Node 1 fidelity should be 75–95 (not much loss yet)
  [ ] Node 5 fidelity should be 20–55 for academic content (significant loss)
  [ ] Confidence inflation should increase monotonically in most chains
  [ ] Lost claims should accumulate, not randomly reappear
```

### Integration Tests (Automated)

```typescript
// tests/cascade.test.ts

describe('Cascade Engine', () => {
  it('each node receives previous node output, not source', async () => {
    // Verify currentText is updated in loop
  });
  
  it('nodeCount matches chainSpec.chainDepth', async () => {
    // 5 nodes for academic content
  });
  
  it('fidelity score drops across cascade on academic content', async () => {
    // nodes[4].metrics.fidelityScore < nodes[0].metrics.fidelityScore
  });
  
  it('all 4 metrics are within valid ranges', async () => {
    // fidelity: 0–100, framing: -100 to +100
  });
});
```

### UI Tests (Manual)

```
  [ ] Mobile (375px): input panel usable, timeline scrolls horizontally
  [ ] Tablet (768px): river view renders without overflow
  [ ] Desktop (1440px): all three views display correctly
  [ ] Dark mode: check contrast ratios on all metric colors
  [ ] Empty state: graceful error if Claude API is unavailable
  [ ] Long content (2000+ words): cascade still completes, UI doesn't break
```

---

## 16. Launch Checklist

### Pre-Launch (Day 22–26)

```
Content:
  [ ] 3 pre-run examples selected (1 academic, 1 political, 1 health)
  [ ] All 3 examples produce compelling, visually interesting results
  [ ] Landing page hero communicates concept in < 10 seconds
  [ ] README is complete with architecture diagram and setup instructions

Technical:
  [ ] Rate limiting: max 5 requests per IP per hour
  [ ] API key secured in environment variables (never exposed to client)
  [ ] Error states handled gracefully (no stack traces shown to users)
  [ ] Session permalinks work on fresh browser (no login required)
  [ ] Share button copies correct URL
  [ ] Vercel deploy successful with no build errors

Performance:
  [ ] Landing page loads < 2s (pre-run examples served as static JSON)
  [ ] River View renders < 500ms on completion
  [ ] No layout shift during cascade progress
```

### Launch Day (Day 27–28)

```
  [ ] Deploy final build to production
  [ ] Test all 3 pre-run examples on production URL
  [ ] Test share link end-to-end on mobile
  [ ] Post to Hacker News: "Show HN: Drift — visualize how information mutates through human interpreters"
  [ ] Post to r/MachineLearning and r/journalism
  [ ] Submit to ProductHunt (schedule for Tuesday/Wednesday 12:01am PT)
```

---

## 17. Future Roadmap

### v1.1 — Post-Launch Quick Wins

| Feature | Description | Effort |
|---|---|---|
| Persistent sessions | Save results permanently via Vercel KV | Low |
| Comparison mode | Run same content through two chains, compare drift maps | Medium |
| PDF input | Upload research paper → auto-extract abstract | Medium |
| Chain editor | Let users modify the persona chain before running | Medium |

### v1.2 — Credibility Features

| Feature | Description | Effort |
|---|---|---|
| Source credibility tagging | Flag when fabricated claims appear (addedClaims > 0) | Medium |
| Historical tracking | Run same URL on same content over time → distortion timeline | High |
| Domain-specific chains | Legal ruling chain, financial report chain, scientific retraction chain | Medium |

### v2.0 — Platform

| Feature | Description | Effort |
|---|---|---|
| Browser extension | Highlight any text → instant Drift analysis | High |
| API access | Developers can call Drift as a service | High |
| Educator mode | Classroom-friendly export (PDF of damage report) | Medium |
| Multi-language | Cascade through non-English information ecosystems | High |

---

## Notes

- **Do not premature-optimize.** Ship a working cascade before touching the River View.
- **The Content Analyzer prompt is sacred.** Every hour spent refining it saves 10 hours downstream.
- **Persona outputs must feel behaviorally real.** If a journalist output sounds like a tweet, the prompt is wrong.
- **Test with real content you care about.** Don't use lorem ipsum — use actual headlines.
- **The River View is not a chart.** It's an experience. Make it feel alive.

---

*Last updated: March 2026 · Aditya Bhardwaj · github.com/v0idsnacks*