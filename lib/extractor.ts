// ============================================================
// Drift — URL Fetch + Content Extraction
// Uses native fetch (Node 18+) + Cheerio for parsing.
// ============================================================

import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  cleanText: string;
  source: string;
  wordCount: number;
}

/** Selectors to remove before extracting text */
const NOISE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '.nav', '.header', '.footer', '.sidebar', '.menu',
  '.ad', '.advertisement', '.promo', '.banner',
  '.cookie', '.popup', '.modal', '.newsletter',
  'script', 'style', 'noscript', 'iframe',
  '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
];

/** Selectors likely to contain the article body */
const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.article-body',
  '.post-content',
  '.entry-content',
  '.story-body',
  '.article-content',
];

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Drift/1.0; +https://drift.vercel.app)',
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  NOISE_SELECTORS.forEach(selector => $(selector).remove());

  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

  // Try to find the main content area
  let contentEl = $('body');
  for (const selector of CONTENT_SELECTORS) {
    if ($(selector).length > 0) {
      contentEl = $(selector).first();
      break;
    }
  }

  // Extract text, collapse whitespace
  const rawText = contentEl.text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Limit to first 8000 characters to stay within token budget
  const cleanText = rawText.slice(0, 8000);
  const wordCount = cleanText.split(/\s+/).length;

  return { title, cleanText, source: url, wordCount };
}
