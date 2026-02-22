/**
 * Social Media Caption Parser
 *
 * Parses recipe data from social media post captions (Instagram, TikTok, Facebook).
 * These platforms embed recipe info as free-text in the post caption with no
 * structured markup. We detect ingredient lists and numbered steps from natural
 * language patterns.
 *
 * Sprint 27 hotfix — Instagram recipe support
 */

import type { ParsedRecipe } from '../types/recipe';

/**
 * Detect if a URL is from a social media platform that embeds recipes in captions
 */
export function isSocialMediaUrl(url: string): boolean {
  return /instagram\.com|tiktok\.com|facebook\.com|fb\.watch/i.test(url);
}

/**
 * Parse recipe from social media page HTML
 *
 * Strategy:
 * 1. Extract the caption / post text
 * 2. Detect recipe title from first meaningful line or og:title
 * 3. Find ingredient block (keyword-triggered list)
 * 4. Find instruction block (numbered steps)
 * 5. Strip hashtags, mentions, promotional fluff
 */
export function parseSocialMediaRecipe(html: string, sourceUrl: string): ParsedRecipe {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract caption text — try multiple strategies
    const captionText = extractCaption(doc, html);
    if (!captionText || captionText.length < 30) {
      return fail(sourceUrl, 'Could not extract social media caption');
    }

    const title = extractSocialTitle(doc, captionText);
    const ingredients = extractIngredientsFromCaption(captionText);
    const instructions = extractInstructionsFromCaption(captionText);
    const imageUrl = extractSocialImage(doc);

    const success = ingredients.length > 0 || instructions.length > 0;

    return {
      title: title || 'Untitled Recipe',
      ingredients,
      instructions,
      imageUrl,
      sourceUrl,
      success,
      error: success ? undefined : 'No recipe content found in caption',
    };
  } catch (error) {
    return fail(sourceUrl, error instanceof Error ? error.message : 'Social media parsing failed');
  }
}

function fail(sourceUrl: string, error: string): ParsedRecipe {
  return { title: '', ingredients: [], instructions: [], sourceUrl, success: false, error };
}

// ─── Caption extraction ─────────────────────────────────────────────

function extractCaption(doc: Document, html: string): string {
  // Strategy 1: Instagram meta description (often has full caption)
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (ogDesc && ogDesc.length > 50) return cleanCaption(ogDesc);

  // Strategy 2: Twitter description
  const twitterDesc = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
  if (twitterDesc && twitterDesc.length > 50) return cleanCaption(twitterDesc);

  // Strategy 3: meta description
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
  if (metaDesc && metaDesc.length > 50) return cleanCaption(metaDesc);

  // Strategy 4: Largest text block on page (likely the caption)
  const allText = doc.body?.textContent || '';
  if (allText.length > 100) return cleanCaption(allText);

  // Strategy 5: From raw HTML — Instagram sometimes embeds caption in a script
  const captionMatch = html.match(/"caption"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]{50,})"/);
  if (captionMatch) {
    return captionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  return allText;
}

/**
 * Clean Instagram/social media caption by removing platform-specific prefixes:
 * - "13K likes, 81 comments - username on November 24, 2025: "caption""
 * - Engagement stats, dates, quote wrappers
 */
function cleanCaption(raw: string): string {
  let caption = raw;

  // Strip Instagram-style prefix: "13K likes, 81 comments - username on Date: "
  caption = caption.replace(
    /^[\d.,]+[KkMm]?\s*likes?,?\s*[\d.,]+[KkMm]?\s*comments?\s*[-–—]\s*\S+\s+on\s+[A-Za-z]+\s+\d{1,2},?\s*\d{4}\s*:\s*/i,
    '',
  );

  // Strip simpler prefix variants: "123 likes, 45 comments - "
  caption = caption.replace(
    /^[\d.,]+[KkMm]?\s*likes?,?\s*[\d.,]+[KkMm]?\s*comments?\s*[-–—]\s*/i,
    '',
  );

  // Strip leading/trailing quote marks
  caption = caption.replace(/^[""\u201c\u201d]+/, '').replace(/[""\u201c\u201d]+$/, '');

  return caption.trim();
}

// ─── Title extraction ───────────────────────────────────────────────

function extractSocialTitle(doc: Document, caption: string): string {
  // Try og:title but strip platform-specific wrappers
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) {
    // Instagram formats: 
    // "username on Instagram: "caption...""
    // "Display Name | Handle on Instagram: "caption...""
    const igMatch = ogTitle.match(/on Instagram:\s*[""\u201c\u201d](.+?)(?:[""\u201c\u201d]|$)/i);
    if (igMatch) {
      const snippet = igMatch[1].trim();
      // Use the first sentence or line as title if it looks like a recipe name
      const firstLine = snippet.split(/[.!\n]/)[0].trim();
      if (firstLine.length > 3 && firstLine.length < 100) return cleanTitle(firstLine);
    }
  }

  // Try to find a food-related title from the caption
  // Skip promotional/engagement lines, find first meaningful food-related line
  const lines = caption.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines.slice(0, 8)) {
    const cleaned = stripEmojis(line).trim();
    // Skip hashtags, mentions, engagement stats
    if (cleaned.startsWith('#') || cleaned.startsWith('@')) continue;
    if (/^[\d.,]+[KkMm]?\s*likes?/i.test(cleaned)) continue;
    // Skip promotional lines
    if (/follow|coaching|profil|kanal|link in bio|highlights/i.test(cleaned)) continue;
    // Skip lines that are ingredient headers or recipe headers
    if (/^(was brauchen|zutaten|ingredients?|das rezept|steps?|instructions?)\s*[:：]/i.test(cleaned)) continue;
    // If the line is short-ish and doesn't look like a full paragraph, it might be a title
    if (cleaned.length > 3 && cleaned.length < 80) {
      return cleanTitle(cleaned);
    }
  }

  // Last resort: extract from og:title
  if (ogTitle) {
    const cleaned = ogTitle
      .replace(/.*on Instagram:\s*/i, '')
      .replace(/[""\u201c\u201d]/g, '')
      .split(/[.!\n]/)[0]
      .trim();
    if (cleaned.length > 3 && cleaned.length < 100) return cleanTitle(cleaned);
  }

  return '';
}

function cleanTitle(title: string): string {
  return stripEmojis(title)
    .replace(/^[\s\-–—:]+/, '')
    .replace(/[\s\-–—:]+$/, '')
    .trim();
}

function stripEmojis(str: string): string {
  return str.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}]/gu,
    '',
  );
}

// ─── Ingredient extraction from caption ─────────────────────────────

// Keywords that introduce an ingredient list (DE + EN)
const INGREDIENT_HEADERS = [
  /was (?:brauchen wir|brauchst du|du brauchst|ihr braucht|wir brauchen)\s*[:：]?\s*/i,
  /was brauchen\s+\w+\s*[:：]?\s*/i,  // fallback for "Was brauchen wir/Sie/..."
  /zutaten\s*[:：]?\s*/i,
  /ingredients?\s*[:：]?\s*/i,
  /you(?:'ll)? need\s*[:：]?\s*/i,
  /what you(?:'ll)? need\s*[:：]?\s*/i,
  /für (?:das|die|den) (?:rezept|teig|sauce|soße|dressing)\s*[:：]?\s*/i,
  /du brauchst\s*[:：]?\s*/i,
  /einkaufsliste\s*[:：]?\s*/i,
  /shopping list\s*[:：]?\s*/i,
];

// Keywords that END an ingredient block
const INGREDIENT_END = [
  /(?:das )?rezept\s*[:：]/i,
  /(?:die )?zubereitung\s*[:：]/i,
  /(?:so )?geht(?:'s| es)\s*[:：]/i,
  /instructions?\s*[:：]/i,
  /directions?\s*[:：]/i,
  /(?:die )?(?:nähr)?werte\s*[:：]/i,
  /steps?\s*[:：]/i,
  /method\s*[:：]/i,
  /how to\s*[:：]/i,
  // Numbered step: "1: text", "1. text", "1) text" — at start of line
  /\n\s*\d+\s*[:.)]\s*[A-Za-zÀ-ÿ]/,
];

function extractIngredientsFromCaption(caption: string): string[] {
  // Find where ingredients start
  let ingredientBlock = '';

  for (const header of INGREDIENT_HEADERS) {
    const match = caption.match(header);
    if (match) {
      const startIdx = (match.index ?? 0) + match[0].length;
      const rest = caption.substring(startIdx);

      // Find where ingredients end (next section header)
      let endIdx = rest.length;
      for (const endPattern of INGREDIENT_END) {
        const endMatch = rest.match(endPattern);
        if (endMatch && (endMatch.index ?? rest.length) < endIdx) {
          endIdx = endMatch.index ?? rest.length;
        }
      }

      ingredientBlock = rest.substring(0, endIdx).trim();
      break;
    }
  }

  if (!ingredientBlock) return [];

  // Parse individual ingredients — split by newlines or common separators
  const lines = ingredientBlock
    .split(/\n|(?<=\S)\s{2,}/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  const ingredients: string[] = [];
  for (const line of lines) {
    const cleaned = stripEmojis(line).trim();
    // Skip hashtags, empty, promotional lines
    if (!cleaned) continue;
    if (cleaned.startsWith('#') || cleaned.startsWith('@')) continue;
    if (/follow|coaching|profil/i.test(cleaned)) continue;
    // Skip lines that look like numbered instructions (e.g. "1: Die Bohnen...", "2. Heat the...")
    if (/^\d+\s*[:.)\-]\s*[A-Za-zÀ-ÿ]/.test(cleaned) && cleaned.length > 30) continue;
    // Skip engagement stats (e.g. "13K likes, 81 comments")
    if (/^\d+[KkMm]?\s*likes?/i.test(cleaned)) continue;
    // Skip section headers
    if (/^(das rezept|die nährwerte|die zubereitung|instructions?|steps?|method|directions?)\s*[:：]?\s*$/i.test(cleaned)) continue;
    // Must look like an ingredient (reasonable length)
    if (cleaned.length > 1 && cleaned.length < 150) {
      ingredients.push(cleaned);
    }
  }

  return ingredients;
}

// ─── Instruction extraction from caption ────────────────────────────

const INSTRUCTION_HEADERS = [
  /(?:das )?rezept\s*[:：]\s*/i,
  /(?:die )?zubereitung\s*[:：]\s*/i,
  /(?:so )?geht(?:'s| es)\s*[:：]\s*/i,
  /instructions?\s*[:：]\s*/i,
  /directions?\s*[:：]\s*/i,
  /steps?\s*[:：]\s*/i,
  /method\s*[:：]\s*/i,
  /how to (?:make|prepare|cook)\s*[:：]\s*/i,
];

const INSTRUCTION_END = [
  /(?:die )?(?:nähr)?werte\s*[:：]/i,
  /nutrition(?:al)?\s*(?:info|facts|values)?\s*[:：]/i,
  /kcal\s*[:：]/i,
  /kalorien\s*[:：]/i,
  /macros?\s*[:：]/i,
  /tipp?s?\s*[:：]/i,
  /notes?\s*[:：]/i,
  /#\w/,  // hashtag block starts
];

function extractInstructionsFromCaption(caption: string): string[] {
  // Strategy 1: Find explicit instruction header
  let instructionBlock = '';

  for (const header of INSTRUCTION_HEADERS) {
    const match = caption.match(header);
    if (match) {
      const startIdx = (match.index ?? 0) + match[0].length;
      const rest = caption.substring(startIdx);

      let endIdx = rest.length;
      for (const endPattern of INSTRUCTION_END) {
        const endMatch = rest.match(endPattern);
        if (endMatch && (endMatch.index ?? rest.length) < endIdx) {
          endIdx = endMatch.index ?? rest.length;
        }
      }

      instructionBlock = rest.substring(0, endIdx).trim();
      break;
    }
  }

  // Strategy 2: If no header found, look for numbered steps anywhere
  if (!instructionBlock) {
    // Look for "1: ...", "1. ...", "1) ..." patterns
    const numberedPattern = /(?:^|\n)\s*(\d+)\s*[:.)\-]\s*.{10,}/g;
    const matches = [...caption.matchAll(numberedPattern)];
    if (matches.length >= 2) {
      const firstIdx = matches[0].index ?? 0;
      const lastMatch = matches[matches.length - 1];
      const lastIdx = (lastMatch.index ?? 0) + lastMatch[0].length;
      instructionBlock = caption.substring(firstIdx, lastIdx).trim();
    }
  }

  if (!instructionBlock) return [];

  // Parse steps — split by numbered prefixes
  const stepPattern = /(?:^|\n)\s*\d+\s*[:.)\-]\s*/;
  const steps = instructionBlock
    .split(stepPattern)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  // If no numbered steps found, split by newlines
  if (steps.length === 0) {
    return instructionBlock
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 && !l.startsWith('#'));
  }

  return steps.map(s => stripEmojis(s).trim()).filter(s => s.length > 5);
}

// ─── Image extraction ───────────────────────────────────────────────

function extractSocialImage(doc: Document): string | undefined {
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) return ogImage;

  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (twitterImage) return twitterImage;

  return undefined;
}
