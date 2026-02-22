/**
 * Ingredient Matcher Utility (Sprint 19)
 *
 * Matches recipe ingredients to individual cooking steps by scanning
 * step text for ingredient names, amounts, and common variations.
 *
 * Returns a mapping of step index → matched ingredients array.
 *
 * Implementation Plan Phase 26 · Roadmap V1.5 Epic 1
 */

export interface MatchedIngredient {
  /** Original ingredient string */
  text: string;
  /** Index in the ingredients array */
  index: number;
}

export type StepIngredientMap = Map<number, MatchedIngredient[]>;

/**
 * Match ingredients to steps by scanning each step's text for ingredient mentions.
 *
 * @param ingredients - Array of ingredient strings (e.g., "400g spaghetti", "2 eggs")
 * @param steps - Array of step instruction strings
 * @returns Map from step index (0-based) to array of matched ingredients
 */
export function matchIngredientsToSteps(
  ingredients: string[],
  steps: string[],
): StepIngredientMap {
  const map: StepIngredientMap = new Map();

  if (!ingredients.length || !steps.length) return map;

  // Pre-process: extract searchable names from each ingredient
  const ingredientNames = ingredients.map((ing, idx) => ({
    original: ing,
    index: idx,
    searchTerms: extractSearchTerms(ing),
  }));

  steps.forEach((stepText, stepIdx) => {
    const stepLower = stepText.toLowerCase();
    const matches: MatchedIngredient[] = [];

    for (const ing of ingredientNames) {
      if (ingredientMatchesStep(ing.searchTerms, stepLower)) {
        matches.push({ text: ing.original, index: ing.index });
      }
    }

    if (matches.length > 0) {
      map.set(stepIdx, matches);
    }
  });

  return map;
}

/**
 * Extract searchable terms from an ingredient string.
 * Removes quantities, units, and common modifiers to get the core ingredient name.
 * S26-08: Improved to extract individual keywords for fuzzy matching.
 *
 * E.g., "400g dried spaghetti" → ["spaghetti", "dried spaghetti"]
 *       "2 large eggs, beaten" → ["eggs", "egg"]
 *       "1 bunch fresh parsley, chopped" → ["parsley", "fresh parsley"]
 *       "1/2 cup olive oil" → ["olive oil"]
 */
function extractSearchTerms(ingredient: string): string[] {
  const lower = ingredient.toLowerCase();

  // Remove quantities (numbers, fractions, ranges)
  let cleaned = lower
    .replace(/[\d¼½¾⅓⅔⅛⅜⅝⅞]+[\s\/\-]*[\d]*/g, '')
    // Remove common units
    .replace(
      /\b(g|kg|ml|l|oz|lb|lbs|cup|cups|tsp|tbsp|teaspoon|teaspoons|tablespoon|tablespoons|pinch|pinches|dash|dashes|bunch|bunches|clove|cloves|can|cans|package|packages|pkg|slice|slices|piece|pieces|handful|handfuls|sprig|sprigs)\b/g,
      '',
    )
    // Remove prep modifiers after commas (e.g., ", diced", ", to taste")
    .replace(/,\s*(diced|chopped|minced|sliced|grated|crushed|melted|softened|beaten|to taste|optional|divided|for serving|for garnish|roughly|finely|thinly|freshly).*$/g, '')
    // Remove leading/trailing punctuation and whitespace
    .replace(/^[\s,.\-()]+|[\s,.\-()]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const terms: string[] = [];

  if (cleaned.length >= 2) {
    terms.push(cleaned);
  }

  // Also add without leading adjectives (e.g., "dried spaghetti" → "spaghetti")
  const adjPattern = /^(fresh|dried|frozen|canned|diced|chopped|minced|large|small|medium|extra|whole|ground|flat-leaf|flat leaf|extra virgin|virgin|freshly|finely|roughly|thinly)\s+/;
  let remaining = cleaned;
  // Iteratively strip leading adjectives to get core ingredient
  while (adjPattern.test(remaining)) {
    remaining = remaining.replace(adjPattern, '');
    if (remaining.length >= 2) {
      terms.push(remaining);
    }
  }

  // S26-08: Extract individual keywords from multi-word ingredients
  // e.g., "fresh parsley" → also add "parsley" as a standalone keyword
  const words = remaining.split(/\s+/).filter(w => w.length >= 3);
  // Common words to exclude from keyword matching (would cause false positives)
  const stopWords = new Set([
    'and', 'or', 'the', 'for', 'with', 'into', 'from', 'about', 'more',
    'less', 'very', 'some', 'each', 'any', 'all', 'also', 'just', 'only',
    'good', 'nice', 'fine', 'well', 'room', 'temperature', 'sized',
  ]);
  for (const word of words) {
    if (!stopWords.has(word) && !terms.includes(word)) {
      terms.push(word);
    }
  }

  // Add singular/plural variations
  const baseTerms = [...terms];
  for (const term of baseTerms) {
    // Simple pluralization: add/remove trailing 's'
    if (term.endsWith('s') && term.length > 3) {
      terms.push(term.slice(0, -1));
    } else if (!term.endsWith('s')) {
      terms.push(term + 's');
    }
    // Handle -es plurals (tomatoes → tomato)
    if (term.endsWith('es') && term.length > 4) {
      terms.push(term.slice(0, -2));
    }
    // Handle -ies plurals (berries → berry)
    if (term.endsWith('ies') && term.length > 5) {
      terms.push(term.slice(0, -3) + 'y');
    }
  }

  // Deduplicate
  return [...new Set(terms)].filter((t) => t.length >= 2);
}

/**
 * Check if any search term for an ingredient appears in a step's text.
 * S26-08: Uses word-boundary-aware matching for all terms to avoid false positives
 * (e.g., "oil" shouldn't match "boil", "dill" shouldn't match "grilled").
 */
function ingredientMatchesStep(searchTerms: string[], stepTextLower: string): boolean {
  for (const term of searchTerms) {
    // Use word boundary for all terms to prevent false positives
    // Short terms (≤4 chars) like "oil", "egg", "dill" especially need boundaries
    // But even longer terms benefit from boundary matching for precision
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    if (regex.test(stepTextLower)) return true;
  }
  return false;
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
