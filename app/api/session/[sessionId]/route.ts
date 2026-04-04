import { NextRequest, NextResponse } from 'next/server';
import { loadSession } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const result = loadSession(sessionId);
  if (!result) {
    return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
  }
  return NextResponse.json({ result });
}
