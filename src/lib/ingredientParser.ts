/**
 * Ingredient Parser (Sprint 12 — S12-01)
 *
 * Parses plain-text ingredient strings into structured objects:
 *   { quantity, unit, name, rawText }
 *
 * Handles:
 * - Fractions: 1/2, 3/4
 * - Unicode fractions: ½, ¾, ⅓, ⅔, ¼, ⅛
 * - Mixed numbers: 1 1/2
 * - Ranges: 2-3
 * - Decimals: 0.5, 1.25
 * - No-quantity items: "salt to taste", "a pinch of pepper"
 * - Unit variations: g, grams, ml, milliliters, cups, tbsp, tsp, oz, lb, kg, l
 *
 * @module ingredientParser
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedIngredient {
  /** Numeric quantity (first value if range, null if unparseable) */
  quantity: number | null;
  /** Second value if range (e.g., "2-3" → quantityMax = 3) */
  quantityMax?: number | null;
  /** Normalised unit string (e.g., "cup", "g", "tbsp") or empty string */
  unit: string;
  /** Ingredient name without quantity/unit */
  name: string;
  /** Original unparsed string */
  rawText: string;
}

// ---------------------------------------------------------------------------
// Unicode fraction map
// ---------------------------------------------------------------------------

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// ---------------------------------------------------------------------------
// Unit normalisation
// ---------------------------------------------------------------------------

const UNIT_MAP: Record<string, string> = {
  // Weight
  g: 'g',
  gram: 'g',
  grams: 'g',
  gramm: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  // Volume
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbs: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  'fl oz': 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  // Pieces / misc
  pinch: 'pinch',
  pinches: 'pinch',
  prise: 'pinch', // German
  prisen: 'pinch',
  dash: 'dash',
  dashes: 'dash',
  clove: 'clove',
  cloves: 'clove',
  slice: 'slice',
  slices: 'slice',
  piece: 'piece',
  pieces: 'piece',
  stück: 'piece', // German
  bunch: 'bunch',
  bunches: 'bunch',
  bund: 'bunch', // German
  can: 'can',
  cans: 'can',
  dose: 'can', // German
  dosen: 'can',
  head: 'head',
  heads: 'head',
  sprig: 'sprig',
  sprigs: 'sprig',
  stalk: 'stalk',
  stalks: 'stalk',
  stick: 'stick',
  sticks: 'stick',
  packet: 'packet',
  packets: 'packet',
  package: 'package',
  packages: 'package',
  päckchen: 'packet', // German
  el: 'tbsp', // German: Esslöffel
  tl: 'tsp', // German: Teelöffel
  becher: 'cup', // German
};

// Build regex pattern for units (sorted by length desc to match longest first)
const UNIT_KEYS = Object.keys(UNIT_MAP).sort((a, b) => b.length - a.length);
const UNIT_PATTERN = UNIT_KEYS.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Replace unicode fractions with their decimal equivalents in a string.
 * Handles mixed numbers like "1½" → "1.5"
 */
function replaceUnicodeFractions(text: string): string {
  let result = text;
  for (const [char, val] of Object.entries(UNICODE_FRACTIONS)) {
    // Handle mixed number: digit directly before fraction char
    result = result.replace(new RegExp(`(\\d)\\s*${char}`, 'g'), (_, whole) => {
      return String(Number(whole) + val);
    });
    // Standalone fraction char
    result = result.replace(new RegExp(char, 'g'), String(val));
  }
  return result;
}

/**
 * Parse a fraction string like "1/2" into a number.
 */
function parseFraction(str: string): number | null {
  const parts = str.split('/');
  if (parts.length !== 2) return null;
  const num = Number(parts[0]);
  const den = Number(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return num / den;
}

/**
 * Try to parse a numeric value from the start of a string.
 * Handles: "2", "0.5", "1/2", "1 1/2", "2-3" (range)
 * Returns { value, max, remainder }
 */
function extractQuantity(text: string): {
  value: number | null;
  max: number | null;
  remainder: string;
} {
  const trimmed = text.trim();

  // Pattern: optional whole number + optional fraction, with optional range
  // Match patterns like: "2", "1/2", "1 1/2", "0.5", "2-3", "2 - 3", "2 to 3"
  const quantityRegex =
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)(?:\s*(?:[-–—]|to)\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*))?/i;

  const match = trimmed.match(quantityRegex);

  if (!match) {
    return { value: null, max: null, remainder: trimmed };
  }

  const parseNum = (s: string): number | null => {
    s = s.trim();
    // Mixed number: "1 1/2"
    const mixedMatch = s.match(/^(\d+)\s+(\d+\/\d+)$/);
    if (mixedMatch) {
      const whole = Number(mixedMatch[1]);
      const frac = parseFraction(mixedMatch[2]);
      if (frac !== null) return whole + frac;
    }
    // Fraction: "1/2"
    if (s.includes('/')) {
      return parseFraction(s);
    }
    // Decimal or integer
    const n = Number(s);
    return isNaN(n) ? null : n;
  };

  const value = parseNum(match[1]);
  const max = match[2] ? parseNum(match[2]) : null;
  const remainder = trimmed.slice(match[0].length).trim();

  return { value, max, remainder };
}

/**
 * Extract the unit from the start of a string.
 */
function extractUnit(text: string): { unit: string; remainder: string } {
  const trimmed = text.trim();
  // Allow optional trailing period (e.g., "tbsp." or "oz.")
  const unitRegex = new RegExp(`^(${UNIT_PATTERN})\\.?(?:\\s+|$)`, 'i');
  const match = trimmed.match(unitRegex);

  if (match) {
    const raw = match[1].toLowerCase();
    const normalised = UNIT_MAP[raw] || raw;
    const remainder = trimmed.slice(match[0].length).trim();
    return { unit: normalised, remainder };
  }

  return { unit: '', remainder: trimmed };
}

/**
 * Clean up ingredient name: remove leading "of", trim whitespace/commas.
 */
function cleanName(text: string): string {
  let name = text.trim();
  // Remove leading "of " (e.g., "of flour" → "flour")
  name = name.replace(/^of\s+/i, '');
  // Remove leading commas, dashes, parentheses artefacts
  name = name.replace(/^[,\-–—]+\s*/, '');
  // Trim trailing commas / whitespace
  name = name.replace(/[,\s]+$/, '');
  return name;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a single ingredient string into a structured object.
 *
 * @example
 *   parseIngredient("2 cups flour")
 *   // → { quantity: 2, unit: "cup", name: "flour", rawText: "2 cups flour" }
 *
 *   parseIngredient("salt to taste")
 *   // → { quantity: null, unit: "", name: "salt to taste", rawText: "salt to taste" }
 *
 *   parseIngredient("1½ tsp vanilla extract")
 *   // → { quantity: 1.5, unit: "tsp", name: "vanilla extract", rawText: "1½ tsp vanilla extract" }
 */
export function parseIngredient(raw: string): ParsedIngredient {
  const rawText = raw.trim();
  if (!rawText) {
    return { quantity: null, unit: '', name: '', rawText };
  }

  // Step 1: Replace unicode fractions
  let text = replaceUnicodeFractions(rawText);

  // Step 2: Extract quantity
  const { value: quantity, max: quantityMax, remainder: afterQty } = extractQuantity(text);

  // Step 3: Extract unit
  const { unit, remainder: afterUnit } = extractUnit(afterQty);

  // Step 4: Clean name
  const name = cleanName(afterUnit);

  return {
    quantity,
    quantityMax: quantityMax ?? null,
    unit,
    name: name || rawText, // fallback to raw text if name extraction failed
    rawText,
  };
}

/**
 * Parse an array of ingredient strings into structured objects.
 */
export function parseIngredients(ingredients: string[]): ParsedIngredient[] {
  return ingredients.map(parseIngredient);
}

// ---------------------------------------------------------------------------
// Scaling logic (S12-04)
// ---------------------------------------------------------------------------

/**
 * Scale a parsed ingredient's quantity by a factor.
 *
 * @param ingredient - The parsed ingredient
 * @param factor - Scaling factor (e.g., 2 for double, 0.5 for half)
 * @returns A new ParsedIngredient with scaled quantities
 */
export function scaleIngredient(
  ingredient: ParsedIngredient,
  factor: number
): ParsedIngredient {
  return {
    ...ingredient,
    quantity: ingredient.quantity !== null ? ingredient.quantity * factor : null,
    quantityMax:
      ingredient.quantityMax != null ? ingredient.quantityMax * factor : ingredient.quantityMax ?? null,
  };
}

/**
 * Format a scaled quantity for display.
 * Rounds to sensible precision and handles common fractions.
 */
export function formatQuantity(qty: number | null): string {
  if (qty === null) return '';
  if (qty === 0) return '0';

  // Check for common fractions (within tolerance)
  const FRACTION_MAP: [number, string][] = [
    [0.125, '⅛'],
    [0.25, '¼'],
    [1 / 3, '⅓'],
    [0.375, '⅜'],
    [0.5, '½'],
    [0.625, '⅝'],
    [2 / 3, '⅔'],
    [0.75, '¾'],
    [0.875, '⅞'],
  ];

  const whole = Math.floor(qty);
  const frac = qty - whole;

  if (frac < 0.01) {
    return String(whole);
  }

  // Try to match a unicode fraction
  for (const [val, symbol] of FRACTION_MAP) {
    if (Math.abs(frac - val) < 0.02) {
      return whole > 0 ? `${whole}${symbol}` : symbol;
    }
  }

  // Otherwise, round to at most 2 decimal places
  const rounded = Math.round(qty * 100) / 100;
  // Remove trailing zeros
  return String(rounded);
}

/**
 * Format a full scaled ingredient for display.
 */
export function formatScaledIngredient(ingredient: ParsedIngredient): string {
  const parts: string[] = [];

  if (ingredient.quantity !== null) {
    const qtyStr = formatQuantity(ingredient.quantity);
    if (ingredient.quantityMax != null) {
      parts.push(`${qtyStr}-${formatQuantity(ingredient.quantityMax)}`);
    } else {
      parts.push(qtyStr);
    }
  }

  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  if (ingredient.name) {
    parts.push(ingredient.name);
  }

  return parts.join(' ');
}
