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
  // Structural
  'nav', 'header', 'footer', 'aside',
  'script', 'style', 'noscript', 'iframe', 'svg', 'form', 'button', 'select',
  '[role="navigation"]', '[role="banner"]', '[role="complementary"]',

  // Ads / promos
  '.ad', '.ads', '.advertisement', '.promo', '.banner', '.sponsored',
  '[class*="advert"]', '[class*="promo"]', '[id*="advert"]',

  // UI chrome
  '.nav', '.header', '.footer', '.sidebar', '.menu', '.breadcrumb',
  '.cookie', '.popup', '.modal', '.newsletter', '.toolbar',
  '.share', '.social', '.social-share', '[class*="share"]',
  '.related', '.recommended', '.also-read', '.more-stories',
  '[class*="related"]', '[class*="recommend"]',

  // Comments and user sections
  '.comments', '.comment-section', '#comments', '[class*="comment"]',
  '.login', '.signup', '.subscribe', '.subscription', '.paywall',
  '[class*="login"]', '[class*="subscribe"]', '[class*="paywall"]',
  '[class*="sign-in"]', '[class*="logged"]',

  // Misc noise
  '.tags', '.topic', '.topics', '.read-later', '.bookmark',
  '.author-bio', '.author-info',
  '.copyright', '.disclaimer',
  '[class*="newsletter"]', '[class*="popup"]', '[class*="modal"]',
  '[class*="cookie"]', '[class*="consent"]',
];

/** Selectors likely to contain the article body, in priority order */
const CONTENT_SELECTORS = [
  // Specific article body classes (most precise)
  '.article-body', '.article-content', '.article__content',
  '.story-body', '.story-content',
  '.post-content', '.post-body',
  '.entry-content', '.entry-body',
  '.content-body', '.field-body',
  '[itemprop="articleBody"]',

  // Generic containers
  'article',
  '[role="main"]',
  'main',
  '.content',
];

/** Clean extracted text — collapse whitespace, remove UI artifacts */
function cleanText(raw: string): string {
  return raw
    // Remove common UI text patterns
    .replace(/\b(READ LATER|SEE ALL|Remove|LOGOUT|LOG\s?IN|Sign in|Subscribe|Loading\.\.\.)\b/gi, '')
    .replace(/\$\{[^}]*\}/g, '')          // Remove JS template literals like ${ind + 1}
    .replace(/\b\d+ \/ \d+\b/g, '')       // Remove "0 / 0" pagination
    .replace(/https?:\/\/\S+/g, '')       // Remove inline URLs
    .replace(/\|/g, ' ')                  // Pipe separators → spaces
    .replace(/\s{2,}/g, ' ')             // Collapse multiple spaces
    .replace(/(\.\s*){3,}/g, '. ')        // Collapse "... ... ..."
    .replace(/\n{3,}/g, '\n\n')           // Collapse excessive newlines
    .trim();
}

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

  // Extract title before removing noise
  const title = $('meta[property="og:title"]').attr('content')
    || $('title').text().trim()
    || $('h1').first().text().trim()
    || 'Untitled';

  // Remove noise elements
  NOISE_SELECTORS.forEach(selector => {
    try { $(selector).remove(); } catch { /* ignore invalid selectors */ }
  });

  // Try to find the main content area (most specific selector first)
  let contentEl = $('body');
  for (const selector of CONTENT_SELECTORS) {
    const match = $(selector);
    if (match.length > 0) {
      // Pick the match with the most text content (avoids empty wrappers)
      const candidate = match.first();
      const candidateText = candidate.text().trim();
      if (candidateText.length > 200) {
        contentEl = candidate;
        break;
      }
    }
  }

  // Extract only paragraph text to avoid UI elements
  const paragraphs: string[] = [];
  contentEl.find('p').each((_, el) => {
    const text = $(el).text().trim();
    // Skip very short paragraphs (likely UI labels) and very long ones (likely concatenated junk)
    if (text.length > 30 && text.length < 3000) {
      paragraphs.push(text);
    }
  });

  let extracted: string;
  if (paragraphs.length >= 3) {
    // We found enough paragraphs — use them
    extracted = paragraphs.join('\n\n');
  } else {
    // Fallback: use full text content
    extracted = contentEl.text();
  }

  const cleaned = cleanText(extracted);

  // Limit to first 6000 characters to stay within token budget
  const finalText = cleaned.slice(0, 6000);
  const wordCount = finalText.split(/\s+/).length;

  if (wordCount < 20) {
    throw new Error('Could not extract meaningful content from this URL. The page may require login or use JavaScript rendering.');
  }

  return { title: cleanText(title), cleanText: finalText, source: url, wordCount };
}
