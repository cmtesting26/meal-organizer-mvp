/**
 * Caption-to-Recipe Parser
 *
 * Parses unstructured social media caption text into a structured recipe.
 * Handles the loose, varied formats found in Instagram/TikTok recipe posts:
 *   - Emoji bullets (🧅🧄🥕)
 *   - Numbered lists ("1. Boil water")
 *   - "Ingredients:" / "Instructions:" / "Zutaten:" / "Zubereitung:" headers
 *   - Line-break-delimited ingredient lists
 *   - Mixed commentary between recipe sections
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

import type { ParsedRecipe } from '../types/recipe';

// ---------------------------------------------------------------------------
// Header patterns (EN + DE)
// ---------------------------------------------------------------------------

/** Patterns that signal the start of an ingredient list */
const INGREDIENT_HEADERS = [
  /^#{0,3}\s*ingredients?\s*(?:[:.\-]|\s+for\s+\d+)?\s*$/i,
  /^#{0,3}\s*zutaten\s*(?:[:.\-]|\s+für\s+\d+)?\s*$/i,
  /^#{0,3}\s*what\s+you.?ll?\s+need\s*:?\s*$/i,
  /^#{0,3}\s*you.?ll?\s+need\s*:?\s*$/i,
  /^#{0,3}\s*für\s+das\s+rezept\s*:?\s*$/i,
  /^#{0,3}\s*was\s+du\s+brauchst\s*:?\s*$/i,
  /^#{0,3}\s*was\s+brauchen\s+wir\s*:?\s*$/i,
  /^#{0,3}\s*was\s+(?:brauchen|brauchst)\s+\w+\s*:?\s*$/i,
  /^#{0,3}\s*here.?s?\s+what\s+you\s+need\s*:?\s*$/i,
];

/** Patterns that signal the start of an instruction list */
const INSTRUCTION_HEADERS = [
  /^#{0,3}\s*instructions?\s*:?\s*$/i,
  /^#{0,3}\s*directions?\s*:?\s*$/i,
  /^#{0,3}\s*method\s*:?\s*$/i,
  /^#{0,3}\s*steps?\s*:?\s*$/i,
  /^#{0,3}\s*how\s+to\s+(?:make|cook|prepare)\s*(?:it)?\s*:?\s*$/i,
  /^#{0,3}\s*zubereitung\s*:?\s*$/i,
  /^#{0,3}\s*anleitung\s*:?\s*$/i,
  /^#{0,3}\s*so\s+geht.?s\s*:?\s*$/i,
  /^#{0,3}\s*(?:das\s+)?rezept\s*:?\s*$/i,
];

/** Patterns that signal the end of recipe content (social media boilerplate) */
const END_MARKERS = [
  /^#{0,3}\s*(?:follow|save|share|like|comment|tag|link\s+in\s+bio)/i,
  /^#{0,3}\s*(?:die\s+)?n[äa]hrwerte?\s*:?\s*$/i,
  /^#{0,3}\s*(?:folge|speicher|teile|markier|link\s+in\s+(?:der\s+)?bio)/i,
  /^#{0,3}\s*(?:guten\s+appetit|enjoy|bon\s+app[eé]tit|mahlzeit)/i,
  /^\.{3,}$/,       // "..."
  /^[_\-=]{3,}$/,   // "---" / "===" dividers
  /^#\w+(?:\s+#\w+)*$/, // lines that are just hashtags
];

// ---------------------------------------------------------------------------
// Emoji / bullet detection
// ---------------------------------------------------------------------------

/**
 * Common food/cooking emojis used as bullet points in captions.
 * We strip these from the front of ingredient lines.
 */
const FOOD_EMOJI_REGEX =
  /^[\s]*(?:[\u{1F345}-\u{1F37F}]|[\u{1F950}-\u{1F9FF}]|[\u{1F33D}-\u{1F344}]|[\u{2615}]|[\u{1F370}-\u{1F382}]|🧅|🧄|🥕|🥬|🧈|🥚|🧀|🍳|🥩|🍗|🍖|🫒|🌶|🫑|🥦|🍄|🥒|🥑|🧂|🫘|🍋|🍅|🥫|🫙|🥣|🥄|🔥|✅|⬇️|👇|➡️|•|▪|▸|►|→|–|—|[-]|\*|·|⚫|⭐|💫|✨|▫|◽|◾|◻|◼|■|□|▢|▣|\u{FE0F})+[\s]*/u;

/**
 * Strip invisible Unicode characters commonly found in social media captions.
 * Includes: U+2063 (invisible separator), U+200B (zero-width space),
 * U+200C/D (zero-width non-joiner/joiner), U+FEFF (BOM), U+00AD (soft hyphen).
 */
function stripInvisibleChars(text: string): string {
  return text.replace(/[\u2063\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E]/g, '');
}

/** Remove leading emoji/bullet characters from a line */
function stripLeadingEmoji(line: string): string {
  return line.replace(FOOD_EMOJI_REGEX, '').trim();
}

/** Check if a line starts with a numbered prefix like "1." or "1)" */
function stripNumberPrefix(line: string): string {
  return line.replace(/^\d+[.)]\s*/, '').trim();
}

// ---------------------------------------------------------------------------
// Heuristics: is this line an ingredient?
// ---------------------------------------------------------------------------

/**
 * Check if a line contains a cooking action verb (EN or DE).
 * Uses stem matching for German to catch conjugated forms
 * (braten/Braten/anbraten, geben/dazugeben, köcheln, etc.)
 */
function hasActionVerb(line: string): boolean {
  // English verbs (word-boundary match)
  if (/\b(?:cook|bake|stir|add|heat|mix|chop|boil|fry|saute|sauté|roast|grill|simmer|reduce|serve|drain|season|blend|whisk|fold|toss|sear|brown|melt|pour)\b/i.test(line))
    return true;
  // German verb stems (prefix-aware: matches anbraten, dazugeben, abschmecken, etc.)
  if (/(?:koch|back|brat|röst|grill|dünst|misch|rühr|schneid|würfel|hack|pürier|schmeck|würz|marinier|gart|geben|gib|köchel|lassen|lass|schwitz|lösch|dick|brüh|dampf|schmelz)\w*/i.test(line))
    return true;
  return false;
}

/**
 * Simple heuristic to guess whether a line looks like an ingredient.
 * Ingredients tend to be short and start with a quantity or food term.
 */
function looksLikeIngredient(line: string): boolean {
  const cleaned = stripLeadingEmoji(line);
  if (!cleaned || cleaned.length > 200) return false;
  if (cleaned.length < 2) return false;

  // Check if it's a numbered line — if so, check the content after the number
  const afterNumber = stripNumberPrefix(cleaned);
  if (afterNumber !== cleaned && afterNumber.length > 0) {
    // This is a numbered line (e.g., "1. Season chicken...")
    // If the text after the number looks like an instruction, it's NOT an ingredient
    if (looksLikeInstruction(afterNumber)) return false;
    // If the text after the number is long (>50 chars), it's likely an instruction
    if (afterNumber.length > 50) return false;
  }

  // Starts with a number, fraction, or range (e.g., "6-8", "1,2l") → very likely ingredient
  if (/^[\d½⅓⅔¼¾⅛⅜⅝⅞~≈]/.test(cleaned)) return true;

  // Starts with "a ", "an ", "some ", "ein ", "eine ", "etwas " → likely
  if (/^(?:a\s|an\s|some\s|ein\s|eine[rms]?\s|etwas\s)/i.test(cleaned)) return true;

  // Contains unit-like words near the start
  if (
    /^.{0,15}\b(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|kg|ml|liters?|Prise|Bund|Packung|Dose)\b/i.test(
      cleaned
    ) ||
    /^.{0,6}\b(?:EL|TL|g)\b/.test(cleaned)
  )
    return true;

  // Short line (under 60 chars) without a verb → likely ingredient
  if (cleaned.length < 60 && !hasActionVerb(cleaned)) {
    // If it contains common food keywords it's likely an ingredient
    if (/(?:salt|pepper|oil|butter|garlic|onion|sugar|flour|water|cream|cheese|chicken|Salz|Pfeffer|Öl|Butter|Knoblauch|Zwiebel|Zucker|Mehl|Wasser|Sahne|Käse)/i.test(cleaned)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple heuristic: does this line look like a cooking instruction?
 * Instructions tend to be sentences starting with a verb.
 */
function looksLikeInstruction(line: string): boolean {
  const cleaned = stripLeadingEmoji(stripNumberPrefix(line));
  if (!cleaned || cleaned.length < 10) return false;

  // Starts with an action verb (EN or DE)
  if (
    /^(?:preheat|heat|boil|cook|bake|fry|sauté|saute|roast|grill|steam|mix|stir|whisk|combine|add|pour|drain|season|serve|place|cut|chop|slice|dice|mince|blend|simmer|reduce|let|set|remove|transfer|top|garnish|fold|knead|roll|spread|toss|coat|marinate|refrigerate|bring|return|cover|uncover|flip|turn|arrange|pat|sear|brush|glaze|drizzle|squeeze|layer|warm|melt|brown|strain|rinse|soak|rest|assemble|finish|plate|deglaze|scrape|crush|crack|break|beat|whip|cream|score|stuff|wrap|tie|skewer|baste|char|blanch|poach|deep.?fry|shallow.?fry|stir.?fry)\b/i.test(
      cleaned
    )
  )
    return true;

  if (
    /^(?:den|die|das|den|dem|einen|eine|alles|nun|jetzt|dann|zuerst|anschließend|danach)\s/i.test(cleaned) ||
    /^(?:erhitz|koch|back|brat|röst|grill|dünst|misch|rühr|schneid|würfel|hack|pürier|lass|gib|nimm|verteil|servier|schmeck|würz|marinier|gart)/i.test(
      cleaned
    )
  )
    return true;

  // German cooking verbs appearing anywhere in the line (catches object-first sentences)
  if (
    cleaned.length > 20 &&
    /(?:dazugeben|ablöschen|anbraten|anschwitzen|andicken|köcheln|abschmecken|aufkochen|einrühren|unterheben|herausnehmen|beiseite|zudecken|umrühren|abtropfen|pürieren|servieren|anrichten|hinzufügen|geben|braten|kochen|backen|rösten|grillen|dünsten|schneiden|rühren|würzen|marinieren|abgießen|auskühlen|ruhen\s+lassen|ziehen\s+lassen|köcheln\s+lassen)\b/i.test(cleaned)
  )
    return true;

  // Contains sentence-like structure (verb + subject) and is longish
  if (cleaned.length > 30 && /[.!]$/.test(cleaned)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

type SectionType = 'title' | 'ingredients' | 'instructions' | 'commentary' | 'end';

function classifyLine(line: string): SectionType | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (END_MARKERS.some((r) => r.test(trimmed))) return 'end';
  if (INGREDIENT_HEADERS.some((r) => r.test(trimmed))) return 'ingredients';
  if (INSTRUCTION_HEADERS.some((r) => r.test(trimmed))) return 'instructions';
  return null;
}

// ---------------------------------------------------------------------------
// Title extraction
// ---------------------------------------------------------------------------

function extractTitle(
  lines: string[],
  postTitle?: string
): { title: string; titleLineIndex: number } {
  // If oEmbed gave us a post title, use it (but clean it)
  if (postTitle) {
    let cleaned = postTitle
      .replace(/\s*\|.*$/, '')     // remove "| TikTok" suffix
      .replace(/\s*on\s+Instagram.*$/i, '')
      .replace(/@[\w.]+/g, '')     // remove @mentions
      .replace(/&[#\w]+;/g, '')    // remove HTML entities (&#x1f357; etc.)
      .trim();

    // Skip if it's still very long (full caption leaked in), too short,
    // or looks like a username/handle (e.g., "finn_tonry")
    const isUsername = /^[\w.]+$/.test(cleaned) && cleaned.includes('_');
    if (cleaned.length > 3 && cleaned.length <= 120 && !isUsername) {
      return { title: cleaned, titleLineIndex: -1 };
    }
  }

  // Otherwise, the first non-empty, non-emoji, non-hashtag line is likely the title
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^#\w/.test(line)) continue; // hashtag
    // Strip emojis for title check but keep the original
    const stripped = stripLeadingEmoji(line);
    if (stripped.length > 3 && stripped.length < 120) {
      // Check it's not a section header
      if (classifyLine(line)) continue;

      // First line gets special treatment — it's almost always the title
      // even if it contains food keywords (e.g., "Creamy Tuscan Chicken")
      if (i === 0) {
        return { title: stripped, titleLineIndex: i };
      }

      // Subsequent lines: only use as title if they don't look like ingredients
      if (!looksLikeIngredient(stripped)) {
        return { title: stripped, titleLineIndex: i };
      }
    }
  }

  return { title: 'Social Media Recipe', titleLineIndex: -1 };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a social media caption into a structured recipe.
 *
 * @param caption    The full caption/description text from the social media post
 * @param postTitle  Optional title from oEmbed (used if present)
 * @param sourceUrl  The original post URL
 * @param imageUrl   Optional thumbnail from oEmbed
 */
export function parseCaptionToRecipe(
  caption: string,
  options?: {
    postTitle?: string;
    sourceUrl?: string;
    imageUrl?: string;
  }
): ParsedRecipe {
  const { postTitle, sourceUrl = '', imageUrl } = options ?? {};

  // Normalise line endings, strip invisible Unicode chars, and split.
  // Also split on inline bullet emojis (▫️, •, etc.) that appear mid-line
  // without newlines — common in Instagram captions.
  const INLINE_BULLET_SPLIT =
    /(?<=\S)[\s]*(?:▫️|▫|◽|◾|◻|◼|•|▪|⚫|■|□)[\s]*/gu;

  const rawLines = stripInvisibleChars(caption)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(INLINE_BULLET_SPLIT, '\n')
    .split('\n');

  // Extract title
  const { title, titleLineIndex } = extractTitle(rawLines, postTitle);

  // Walk through lines and classify into sections
  const ingredients: string[] = [];
  const instructions: string[] = [];

  let currentSection: 'unknown' | 'ingredients' | 'instructions' = 'unknown';
  let reachedEnd = false;

  for (let i = 0; i < rawLines.length; i++) {
    if (i === titleLineIndex) continue; // skip title line
    if (reachedEnd) break;

    const line = rawLines[i].trim();
    if (!line) continue;

    // Check for section headers
    const sectionType = classifyLine(line);
    if (sectionType === 'end') {
      reachedEnd = true;
      continue;
    }
    if (sectionType === 'ingredients') {
      currentSection = 'ingredients';
      continue;
    }
    if (sectionType === 'instructions') {
      currentSection = 'instructions';
      continue;
    }

    // Content line — classify based on current section and heuristics
    const cleaned = stripLeadingEmoji(line);
    if (!cleaned) continue;

    if (currentSection === 'ingredients') {
      // We're explicitly in the ingredients section, but check if this line
      // is actually an instruction (auto-detect section switch).
      // This handles captions where the "Method" header is missing.
      const afterNum = stripNumberPrefix(cleaned);
      if (afterNum !== cleaned && looksLikeInstruction(afterNum)) {
        // Numbered line with instruction verb — switch to instructions
        currentSection = 'instructions';
        if (afterNum.length >= 5) {
          instructions.push(afterNum);
        }
      } else if (looksLikeInstruction(cleaned)) {
        // Non-numbered line that looks like an instruction — switch sections
        currentSection = 'instructions';
        const instrText = stripNumberPrefix(cleaned);
        if (instrText.length >= 5) {
          instructions.push(instrText);
        }
      } else {
        ingredients.push(cleaned);
      }
    } else if (currentSection === 'instructions') {
      // We're explicitly in the instructions section
      const instrText = stripNumberPrefix(cleaned);
      if (instrText.length >= 5) {
        instructions.push(instrText);
      }
    } else {
      // No explicit section header yet — use heuristics
      if (looksLikeIngredient(cleaned)) {
        ingredients.push(cleaned);
      } else if (looksLikeInstruction(cleaned)) {
        const instrText = stripNumberPrefix(cleaned);
        if (instrText.length >= 5) {
          instructions.push(instrText);
        }
      }
      // Otherwise it's commentary — skip
    }
  }

  // Determine success: at minimum we need a title and either ingredients or instructions
  const hasContent = ingredients.length > 0 || instructions.length > 0;
  const success = hasContent;

  return {
    title,
    ingredients,
    instructions,
    imageUrl,
    sourceUrl,
    success,
    error: success
      ? undefined
      : 'Could not find recipe content in this caption. The post may not contain a recipe, or the format is not recognised.',
  };
}
