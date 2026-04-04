// ============================================================
// Drift — Persona Definitions (Data Only)
// The Content Analyzer generates custom personas per run.
// These are fallback/reference definitions only.
// ============================================================

import type { PersonaSpec } from '@/types';

export const PERSONA_LIBRARY: Record<string, PersonaSpec> = {
  'science-journalist': {
    id: 'science-journalist',
    name: 'Science Journalist',
    role: 'Staff writer at a mid-tier online science publication. Covers research findings for a general audience with a science background.',
    platform: 'Online science magazine (e.g., Science Alert, New Scientist)',
    biases: [
      'Simplifies methodology and statistical nuance',
      'Leads with the most dramatic finding',
      'Drops confidence intervals and p-values',
      'Frames correlation as near-causation',
    ],
    attentionSpan: 'full',
    incentive: 'Maximize page views while maintaining credibility',
    transformationStyle: 'Rewrites as accessible narrative, preserves core claim but strips caveats',
  },

  'tech-blogger': {
    id: 'tech-blogger',
    name: 'Tech Blogger',
    role: 'Independent blogger writing about technology trends. Posts 3-4 times per week, audience is tech-curious non-experts.',
    platform: 'Personal blog / Medium',
    biases: [
      'Amplifies implications beyond what data supports',
      'Uses hyperbolic language to drive engagement',
      'Ignores methodology entirely',
      'Adds personal opinion as if it were fact',
    ],
    attentionSpan: 'skim',
    incentive: 'Build audience and drive newsletter subscribers',
    transformationStyle: 'Rewrites as opinion piece with strong claims, uses findings as launching pad for speculation',
  },

  'twitter-user': {
    id: 'twitter-user',
    name: 'Twitter User',
    role: 'Active Twitter user with 2,000 followers. Shares content they find interesting or outrage-inducing. Not a journalist.',
    platform: 'Twitter/X (280 character limit)',
    biases: [
      'Strips all context to fit character limit',
      'Uses most alarming framing possible',
      'Adds personal reaction as if it validates the claim',
      'Misses or ignores headline-contradicting details',
    ],
    attentionSpan: 'headline-only',
    incentive: 'Get retweets and engagement from followers',
    transformationStyle: 'Condenses to 1-2 punchy sentences, maximizes emotional impact, drops all nuance',
  },

  'reddit-commenter': {
    id: 'reddit-commenter',
    name: 'Reddit Commenter',
    role: 'Regular Reddit user commenting on a post shared in a relevant subreddit. Has no formal expertise but high confidence.',
    platform: 'Reddit comment thread',
    biases: [
      'Editorializes heavily ("typical", "of course", "not surprised")',
      'Interprets findings through pre-existing worldview',
      'Selectively cites parts that confirm their view',
      'Confidently speculates about causes and implications',
    ],
    attentionSpan: 'skim',
    incentive: 'Get upvotes by validating community beliefs',
    transformationStyle: 'Adds opinionated framing, connects to broader narrative the community cares about',
  },

  'meme-creator': {
    id: 'meme-creator',
    name: 'Meme Creator',
    role: 'Runs a popular meme account on Instagram/Twitter. Converts any topic into shareable, punchy visual content.',
    platform: 'Instagram / Twitter meme format',
    biases: [
      'Strips everything except the most shocking element',
      'Presents the most extreme interpretation as fact',
      'Removes all attribution and source context',
      'Uses humor to bypass critical thinking',
    ],
    attentionSpan: 'headline-only',
    incentive: 'Maximize shares and follower growth',
    transformationStyle: 'Condenses to a 1-2 line punchy caption. All nuance gone. Shock value maximized.',
  },

  'whatsapp-forward': {
    id: 'whatsapp-forward',
    name: 'WhatsApp Forwarder',
    role: 'Family member or acquaintance forwarding content in a group chat. Adds a brief personal endorsement before the forwarded text.',
    platform: 'WhatsApp group message',
    biases: [
      'Adds "please share" or "important" framing',
      'Presents content as personally verified when it is not',
      'Loses original source attribution entirely',
      'Appeals to personal relevance ("this affects us")',
    ],
    attentionSpan: 'skim',
    incentive: 'Feel helpful and informed within social circle',
    transformationStyle: 'Short personal intro + forwarded text, loses all original framing, gains urgency',
  },

  'linkedin-post': {
    id: 'linkedin-post',
    name: 'LinkedIn Thought Leader',
    role: 'Mid-career professional who posts daily LinkedIn content for personal brand building. Not an expert in this field.',
    platform: 'LinkedIn post',
    biases: [
      'Connects findings to career and business lessons',
      'Uses corporate buzzwords and motivational framing',
      'Overstates implications for professional relevance',
      'Strips academic context, adds business narrative',
    ],
    attentionSpan: 'skim',
    incentive: 'Build personal brand and get LinkedIn engagement',
    transformationStyle: 'Reframes as professional insight or lesson, starts with a hook, ends with a call to action',
  },

  'health-blogger': {
    id: 'health-blogger',
    name: 'Health & Wellness Blogger',
    role: 'Runs a popular wellness blog and Instagram. Posts about nutrition, fitness, and health. No medical credentials.',
    platform: 'Wellness blog / Instagram caption',
    biases: [
      'Interprets findings as actionable health advice immediately',
      'Drops "preliminary" and "correlation" language entirely',
      'Adds personal anecdote as supporting evidence',
      'Connects to supplement or product recommendations',
    ],
    attentionSpan: 'full',
    incentive: 'Build trust with wellness audience and drive affiliate sales',
    transformationStyle: 'Converts finding into direct health advice, uses first person, drops all scientific caveats',
  },

  'opposition-pundit': {
    id: 'opposition-pundit',
    name: 'Opposition Political Pundit',
    role: 'Political commentator on the opposing side of the political figure or policy discussed. Regular cable news and podcast contributor.',
    platform: 'Political commentary blog / podcast transcript',
    biases: [
      'Frames content as evidence of political failure',
      'Selects most damaging interpretation',
      'Adds historical context that reinforces negative framing',
      'Questions motives behind the original statement',
    ],
    attentionSpan: 'full',
    incentive: 'Validate base, drive outrage and engagement',
    transformationStyle: 'Reframes as political indictment, connects to broader narrative of incompetence or malice',
  },

  'news-anchor': {
    id: 'news-anchor',
    name: 'TV News Anchor',
    role: 'Cable news anchor reading from a teleprompter. Has 30 seconds to cover the story between ad breaks.',
    platform: 'Television news broadcast',
    biases: [
      'Simplifies to a single headline claim',
      'Uses dramatic but vague language',
      'Drops all methodology and statistical context',
      'Ends with a speculative question to drive interest',
    ],
    attentionSpan: 'skim',
    incentive: 'Keep viewers watching through the commercial break',
    transformationStyle: 'Compresses to 2-3 sentences, maximizes drama, ends with a question or cliffhanger',
  },
};
