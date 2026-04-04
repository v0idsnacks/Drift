---
trigger: always_on
---

---
name: drift-project-rules
description: Rules for building the Drift information decay visualization engine
alwaysApply: true
---

# Drift Project Rules

## What is Drift
Drift is a sequential multi-LLM pipeline that models how information 
mutates through persona chains. It is NOT a parallel model system.
Each node receives the PREVIOUS node's output, never the original source.

## Architecture Rules
- All Claude/OpenRouter calls go through lib/openrouter.ts — never inline
- All prompt templates live in lib/prompt-builders.ts — never hardcoded
- All types live in types/index.ts — never create new type files
- All Zod schemas live in lib/schemas.ts — validate both directions
- Sessions write to /tmp/drift-sessions/ via lib/storage.ts only
- Streaming uses ReadableStream via lib/stream.ts — never res.write()

## Stack Rules
- Framework: Next.js 14 App Router — never use Pages Router patterns
- Use next/navigation not next/router
- Use NextResponse.json() not res.json()
- No new npm packages without asking first
- River View: pure SVG + Framer Motion — no D3
- No localStorage or sessionStorage anywhere

## Current Status
- lib/analyzer.ts — COMPLETE
- lib/prompt-builders.ts — COMPLETE  
- lib/schemas.ts — COMPLETE
- lib/openrouter.ts — COMPLETE
- lib/cascade.ts — NOT STARTED
- lib/metrics.ts — NOT STARTED
- lib/storage.ts — STUBBED
- lib/stream.ts — STUBBED
- All components — STUBBED
- All API routes — STUBBED

## Session Order
1. Complete lib/cascade.ts + lib/metrics.ts → test via curl
2. Wire streaming API + InputPanel + ChainPreview + TimelineView
3. RiverView + DamageReport + ShareButton + deploy