import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildDamagePrompt } from '@/lib/prompt-builders';
import { callOpenRouter } from '@/lib/openrouter';
import { TextSegmentSchema } from '@/lib/schemas';

const DamageRequestSchema = z.object({
  source: z.string().min(10),
  finalOutput: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DamageRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { source, finalOutput } = parsed.data;

    const prompt = buildDamagePrompt(source, finalOutput);
    
    // Enforce JSON output for Claude 3.5 Sonnet
    const jsonPrompt = prompt + "\n\nCRITICAL: Respond ONLY with a valid JSON array. Do not include markdown formatting or thinking blocks.";
    
    const responseText = await callOpenRouter(jsonPrompt);
    
    // Parse the JSON array
    let segments;
    try {
      // Find JSON array in the response to handle cases where LLM includes markdown
      const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const jsonString = match ? match[0] : responseText;
      segments = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', responseText);
      return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 500 });
    }

    // Validate against schema
    const ValidatedSegmentsSchema = z.array(TextSegmentSchema);
    const validated = ValidatedSegmentsSchema.safeParse(segments);

    if (!validated.success) {
      console.error('LLM output failed schema validation:', validated.error);
      return NextResponse.json({ error: 'LLM output schema mismatch' }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (err: unknown) {
    console.error('Damage analysis failed:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
