// ============================================================
// Drift — Session Storage (/tmp filesystem)
// ⚠️ Ephemeral on Vercel — files survive minutes to hours.
// Users should be informed links may expire.
// ============================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { getExampleResult } from '@/lib/examples';
import type { CascadeResult } from '@/types';

const SESSIONS_DIR = path.join(os.tmpdir(), 'drift-sessions');

function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

export function saveSession(result: CascadeResult): void {
  ensureDir();
  const filePath = path.join(SESSIONS_DIR, `${result.sessionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result), 'utf-8');
}

export function loadSession(sessionId: string): CascadeResult | null {
  const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);

  if (!fs.existsSync(filePath)) {
    return getExampleResult(sessionId);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CascadeResult;
  } catch {
    return getExampleResult(sessionId);
  }
}
