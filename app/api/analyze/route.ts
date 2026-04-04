import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/analyzer';
import { AnalyzeRequestSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = AnalyzeRequestSchema.parse(body);
    const chainSpec = await analyzeContent(text);
    return NextResponse.json({ chainSpec });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
