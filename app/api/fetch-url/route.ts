import { NextRequest, NextResponse } from 'next/server';
import { extractFromUrl } from '@/lib/extractor';
import { FetchUrlRequestSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = FetchUrlRequestSchema.parse(body);
    const content = await extractFromUrl(url);
    return NextResponse.json(content);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
