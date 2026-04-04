// ============================================================
// Drift — Rate Limiting Proxy
// Simple in-memory IP counter: max 5 cascade requests/hour
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function proxy(req: NextRequest) {
  // Only rate-limit the expensive cascade route
  if (!req.nextUrl.pathname.startsWith('/api/cascade')) {
    return NextResponse.next();
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${MAX_REQUESTS} analyses per hour.` },
      { status: 429 }
    );
  }

  record.count++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/cascade',
};
