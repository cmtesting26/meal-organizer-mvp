/**
 * OCR Recipe Parser (Sprint 14 — S14-02)
 *
 * Parses raw OCR text into a structured recipe.
 * Uses heuristic rules to detect:
 * - Title (first prominent line)
 * - Ingredients (lines with numbers + units)
 * - Instructions (numbered steps or sequential paragraphs)
 *
 * Returns confidence indicators per section to guide user review.
 *
 * @module ocrRecipeParser
 */

import type { ParsedRecipe } from '../types/recipe';

/** Confidence level for each parsed section */
export interface OcrParseConfidence {
  title: 'high' | 'medium' | 'low';
  ingredients: 'high' | 'medium' | 'low';
  instructions: 'high' | 'medium' | 'low';
  overall: 'high' | 'medium' | 'low';
}

/** Extended parsed recipe with OCR confidence data */
export interface OcrParsedRecipe extends ParsedRecipe {
  /** Confidence per section */
  confidence: OcrParseConfidence;
  /** Raw OCR text for reference */
  rawText: string;
}

/** Common measurement units in English and German */
const UNIT_PATTERNS = [
  // English
  'cups?', 'tbsp', 'tsp', 'tablespoons?', 'teaspoons?',
  'oz', 'ounces?', 'lbs?', 'pounds?',
  'ml', 'l', 'liters?', 'litres?',
  'g', 'grams?', 'kg', 'kilograms?',
  'pinch(?:es)?', 'dash(?:es)?', 'cloves?',
  'slices?', 'pieces?', 'cans?', 'bunche?s?',
  // German
  'EL', 'TL', 'Esslöffel', 'Teelöffel',
  'Bund', 'Stück', 'Scheiben?', 'Dose[n]?',
  'Prise[n]?', 'Zehe[n]?', 'Becher',
];

const UNIT_REGEX = new RegExp(
  `^\\s*[\\d½¼¾⅓⅔⅛.,/\\-]+\\s*(?:${UNIT_PATTERNS.join('|')})\\b`,
  'i'
);

/** Patterns that indicate an instruction step */
const STEP_PATTERNS = [
  /^\d+[.)]\s+/,                       // "1. " or "1) "
  /^step\s+\d+/i,                      // "Step 1"
  /^schritt\s+\d+/i,                   // "Schritt 1" (German)
  /^(preheat|heat|mix|stir|add|combine|bake|cook|boil|simmer|fry|sauté|chop|dice|mince|whisk|fold|pour|drain|serve|let|place|remove|set|cover|season|sprinkle|grill|roast|blend)/i,
  /^(vorheizen|erhitzen|mischen|rühren|hinzufügen|backen|kochen|braten|schneiden|würfeln|servieren|abdecken|würzen|grillen)/i,
];

/** Section header patterns */
const INGREDIENT_HEADERS = /^(ingredients?|zutaten|zutat)\s*:?\s*$/i;
const INSTRUCTION_HEADERS = /^(instructions?|directions?|method|steps?|zubereitung|anleitung)\s*:?\s*$/i;

/**
 * Parse raw OCR text into a structured recipe.
 *
 * @param rawText - Raw text from Tesseract OCR
 * @returns Parsed recipe with confidence indicators
 */
export function parseOcrText(rawText: string): OcrParsedRecipe {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return emptyResult(rawText, 'No text to parse');
  }

  // 1. Detect sections
  const sections = detectSections(lines);

  // 2. Extract title
  const title = extractTitle(sections, lines);

  // 3. Extract ingredients
  const ingredients = extractIngredients(sections, lines);

  // 4. Extract instructions
  const instructions = extractInstructions(sections, lines);

  // 5. Calculate confidence
  const confidence = calculateConfidence(title, ingredients, instructions, lines);

  const success = Boolean(
    title && (ingredients.length > 0 || instructions.length > 0)
  );

  return {
    title,
    ingredients,
    instructions,
    sourceUrl: '',
    success,
    error: success ? undefined : 'Could not parse recipe from OCR text. Please review and correct.',
    confidence,
    rawText,
  };
}

/** Describes which lines belong to which section */
interface SectionMap {
  ingredientStart: number;
  ingredientEnd: number;
  instructionStart: number;
  instructionEnd: number;
}

/**
 * Detect section boundaries using header patterns.
 */
function detectSections(lines: string[]): SectionMap | null {
  let ingredientStart = -1;
  let instructionStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (INGREDIENT_HEADERS.test(lines[i]) && ingredientStart === -1) {
      ingredientStart = i + 1; // Content starts after header
    }
    if (INSTRUCTION_HEADERS.test(lines[i]) && instructionStart === -1) {
      instructionStart = i + 1;
    }
  }

  if (ingredientStart === -1 && instructionStart === -1) {
    return null; // No section headers found — use heuristic mode
  }

  // Determine section boundaries
  const ingredientEnd =
    instructionStart > ingredientStart && ingredientStart !== -1
      ? instructionStart - 1
      : ingredientStart !== -1
        ? lines.length
        : -1;

  const instructionEnd = instructionStart !== -1 ? lines.length : -1;

  return {
    ingredientStart: ingredientStart !== -1 ? ingredientStart : 0,
    ingredientEnd: ingredientEnd !== -1 ? ingredientEnd : 0,
    instructionStart: instructionStart !== -1 ? instructionStart : 0,
    instructionEnd: instructionEnd !== -1 ? instructionEnd : 0,
  };
}

/**
 * Extract title: first non-header line, or first line that looks like a title.
 */
function extractTitle(sections: SectionMap | null, lines: string[]): string {
  // If sections detected, look before ingredient section
  const searchEnd = sections && sections.ingredientStart > 0
    ? sections.ingredientStart
    : Math.min(5, lines.length);
    
  for (let i = 0; i < searchEnd; i++) {
    const line = lines[i];
    // Skip section headers
    if (INGREDIENT_HEADERS.test(line) || INSTRUCTION_HEADERS.test(line)) continue;
    // Skip lines that look like ingredients
    if (UNIT_REGEX.test(line)) continue;
    // Skip very short lines (likely OCR noise)
    if (line.length < 3) continue;
    // Title candidate: first substantial non-header line
    return line;
  }
  return '';
}

/**
 * Extract ingredients using section boundaries or heuristic detection.
 */
function extractIngredients(sections: SectionMap | null, lines: string[]): string[] {
  // If we have section headers, use them
  if (sections && sections.ingredientStart > 0 && sections.ingredientEnd > sections.ingredientStart) {
    return lines
      .slice(sections.ingredientStart, sections.ingredientEnd)
      .filter((l) => l.length > 1 && !INSTRUCTION_HEADERS.test(l));
  }

  // Heuristic: find lines that match ingredient patterns
  return lines.filter((line) => {
    // Must have a number followed by a unit
    if (UNIT_REGEX.test(line)) return true;
    // Lines starting with a bullet or dash followed by text
    if (/^[\-•·*]\s+.{3,}/.test(line)) return true;
    return false;
  });
}

/**
 * Extract instructions using section boundaries or heuristic detection.
 */
function extractInstructions(sections: SectionMap | null, lines: string[]): string[] {
  // If we have section headers, use them
  if (sections && sections.instructionStart > 0 && sections.instructionEnd > sections.instructionStart) {
    return lines
      .slice(sections.instructionStart, sections.instructionEnd)
      .filter((l) => l.length > 5)
      .map((l) => l.replace(/^\d+[.)]\s+/, '')); // Strip step numbers
  }

  // Heuristic: find lines that match instruction patterns
  const steps = lines.filter((line) => {
    if (line.length < 15) return false; // Instructions are typically longer
    return STEP_PATTERNS.some((p) => p.test(line));
  });

  if (steps.length > 0) {
    return steps.map((l) => l.replace(/^\d+[.)]\s+/, ''));
  }

  // Last resort: lines that are long and don't look like ingredients
  return lines
    .filter((l) => l.length > 40 && !UNIT_REGEX.test(l))
    .slice(0, 20); // Cap at 20 steps
}

/**
 * Calculate parsing confidence per section.
 */
function calculateConfidence(
  title: string,
  ingredients: string[],
  instructions: string[],
  _lines: string[]
): OcrParseConfidence {
  const titleConf: 'high' | 'medium' | 'low' =
    title.length > 5 && title.length < 100 ? 'high' :
    title.length > 0 ? 'medium' : 'low';

  const ingConf: 'high' | 'medium' | 'low' =
    ingredients.length >= 3 && ingredients.every((i) => UNIT_REGEX.test(i)) ? 'high' :
    ingredients.length >= 2 ? 'medium' : 'low';

  const insConf: 'high' | 'medium' | 'low' =
    instructions.length >= 2 && instructions.every((i) => i.length > 20) ? 'high' :
    instructions.length >= 1 ? 'medium' : 'low';

  // Overall: lowest of the three
  const levels = { high: 3, medium: 2, low: 1 };
  const minLevel = Math.min(levels[titleConf], levels[ingConf], levels[insConf]);
  const overall = minLevel === 3 ? 'high' : minLevel === 2 ? 'medium' : 'low';

  return { title: titleConf, ingredients: ingConf, instructions: insConf, overall };
}

/**
 * Create empty/error result.
 */
function emptyResult(rawText: string, error: string): OcrParsedRecipe {
  return {
    title: '',
    ingredients: [],
    instructions: [],
    sourceUrl: '',
    success: false,
    error,
    confidence: { title: 'low', ingredients: 'low', instructions: 'low', overall: 'low' },
    rawText,
  };
}
