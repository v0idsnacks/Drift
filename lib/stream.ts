// ============================================================
// Drift — ReadableStream abstraction for cascade streaming
// ============================================================

import type { StreamEvent } from '@/types';

/** Encode a StreamEvent as an SSE-style data line */
export function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Create a TransformStream that accepts StreamEvents and encodes them */
export function createEventStream(): {
  readable: ReadableStream;
  send: (event: StreamEvent) => void;
  close: () => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const readable = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
  });

  return {
    readable,
    send: (event: StreamEvent) => {
      controller.enqueue(encoder.encode(encodeEvent(event)));
    },
    close: () => {
      controller.close();
    },
  };
}
