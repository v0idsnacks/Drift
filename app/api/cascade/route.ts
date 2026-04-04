import { NextRequest, NextResponse } from 'next/server';
import { runCascade } from '@/lib/cascade';
import { CascadeRequestSchema } from '@/lib/schemas';
import { createEventStream } from '@/lib/stream';
import { generateSessionId } from '@/lib/utils';
import type { ChainSpec, StreamEvent } from '@/types';

const pendingCascades = new Map<string, { source: string; chainSpec: ChainSpec }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, chainSpec } = CascadeRequestSchema.parse(body);
    const sessionId =
      typeof body.sessionId === 'string' && body.sessionId.length > 0
        ? body.sessionId
        : generateSessionId();

    pendingCascades.set(sessionId, { source, chainSpec });

    return NextResponse.json({ sessionId }, { status: 202 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const pending = pendingCascades.get(sessionId);
  if (!pending) {
    return NextResponse.json({ error: 'Cascade session not found' }, { status: 404 });
  }

  const { source, chainSpec } = pending;
  const { readable, send, close } = createEventStream();

  pendingCascades.delete(sessionId);

  runCascade(
    source,
    chainSpec,
    (event: StreamEvent) => {
      send(event);
      if (event.type === 'cascade-complete' || event.type === 'error') {
        close();
      }
    },
    sessionId
  ).catch((err: Error) => {
    send({ type: 'error', message: err.message });
    close();
  });

  return new Response(readable as unknown as BodyInit, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
