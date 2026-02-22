/**
 * Schema.org Recipe Parser
 * 
 * Parses recipe data from schema.org JSON-LD markup
 * This is the primary parsing strategy (70-80% success rate)
 * 
 * @see https://schema.org/Recipe
 */

import type { ParsedRecipe } from '../types/recipe';

/**
 * Parse recipe from schema.org JSON-LD markup
 * 
 * @param html - HTML content containing JSON-LD scripts
 * @param sourceUrl - Original URL for the recipe
 * @returns Parsed recipe or failure object
 */
export function parseSchemaOrgRecipe(html: string, sourceUrl: string): ParsedRecipe {
  try {
    // Create DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all JSON-LD script tags
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of Array.from(scripts)) {
      try {
        let jsonText = script.textContent || '';
        if (!jsonText.trim()) continue;
        
        // S27-11: Sanitize JSON — some sites emit control chars or trailing commas
        jsonText = jsonText
          .replace(/[\x00-\x1F\x7F]/g, ' ')  // strip control chars
          .replace(/,\s*([\]}])/g, '$1');       // strip trailing commas
        
        const data = JSON.parse(jsonText);
        
        // S27-11: Recursive search for Recipe type in any nesting structure
        const recipe = findRecipeInData(data);
        if (recipe) {
          const result = extractRecipeData(recipe, sourceUrl);
          if (result.success) {
            return result;
          }
        }
      } catch (e) {
        // Invalid JSON or parsing error - continue to next script
        continue;
      }
    }
    
    // S27-11: Try microdata (itemprop) as fallback before giving up
    const microdataResult = parseMicrodata(doc, sourceUrl);
    if (microdataResult && microdataResult.success) {
      return microdataResult;
    }
    
    // No valid recipe found
    return {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl,
      success: false,
      error: 'No schema.org Recipe markup found'
    };
    
  } catch (error) {
    return {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Schema parsing failed'
    };
  }
}

/**
 * S27-11: Recursively search for a Recipe object in any JSON-LD structure
 * Handles @graph arrays, nested objects, and @type arrays like ["Recipe", "WebPage"]
 */
function findRecipeInData(data: any): any | null {
  if (!data) return null;
  
  // Check if this item is a Recipe
  if (isRecipeType(data)) return data;
  
  // Check @graph
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const item of data['@graph']) {
      const found = findRecipeInData(item);
      if (found) return found;
    }
  }
  
  // Check if it's an array
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInData(item);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * S27-11: Check if a JSON-LD item is a Recipe type
 * Handles string type, array of types, and schema.org prefixed types
 */
function isRecipeType(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const typeVal = item['@type'] || item['type'];
  if (!typeVal) return false;
  
  if (typeof typeVal === 'string') {
    return typeVal === 'Recipe' || typeVal === 'recipe' || typeVal.endsWith('/Recipe');
  }
  if (Array.isArray(typeVal)) {
    return typeVal.some((t: string) => t === 'Recipe' || t === 'recipe' || t.endsWith('/Recipe'));
  }
  return false;
}

/**
 * S27-11: Parse recipe data from microdata (itemprop attributes)
 * Fallback for sites that use itemscope/itemprop instead of JSON-LD
 */
function parseMicrodata(doc: Document, sourceUrl: string): ParsedRecipe | null {
  const recipeScope = doc.querySelector('[itemtype*="schema.org/Recipe"]');
  if (!recipeScope) return null;
  
  const title = recipeScope.querySelector('[itemprop="name"]')?.textContent?.trim() || '';
  const ingredients = Array.from(recipeScope.querySelectorAll('[itemprop="recipeIngredient"]'))
    .map(el => el.textContent?.trim() || '')
    .filter(Boolean);
  const instructions = Array.from(recipeScope.querySelectorAll('[itemprop="recipeInstructions"] [itemprop="text"], [itemprop="recipeInstructions"]'))
    .map(el => el.textContent?.trim() || '')
    .filter(t => t.length > 10);
  const imageEl = recipeScope.querySelector('[itemprop="image"]');
  const imageUrl = imageEl?.getAttribute('content') || imageEl?.getAttribute('src') || undefined;
  
  const success = Boolean(title && (ingredients.length > 0 || instructions.length > 0));
  return { title, ingredients, instructions, imageUrl, sourceUrl, success, error: success ? undefined : 'Incomplete microdata' };
}

/**
 * Extract recipe data from schema.org Recipe object
 */
function extractRecipeData(data: any, sourceUrl: string): ParsedRecipe {
  try {
    const title = data.name || data.headline || '';
    const ingredients = parseIngredients(data.recipeIngredient);
    const instructions = parseInstructions(data.recipeInstructions);
    const imageUrl = extractImage(data.image);
    
    // Success if we have at least title and (ingredients OR instructions)
    const success = Boolean(
      title && 
      (ingredients.length > 0 || instructions.length > 0)
    );
    
    return {
      title,
      ingredients,
      instructions,
      imageUrl,
      sourceUrl,
      success,
      error: success ? undefined : 'Incomplete recipe data'
    };
  } catch (error) {
    return {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl,
      success: false,
      error: 'Failed to extract recipe data'
    };
  }
}

/**
 * Parse ingredients from various schema.org formats
 */
function parseIngredients(ingredient: any): string[] {
  if (!ingredient) return [];
  
  // Single string
  if (typeof ingredient === 'string') {
    return [ingredient.trim()].filter(Boolean);
  }
  
  // Array of strings or objects
  if (Array.isArray(ingredient)) {
    return ingredient
      .map(item => {
        if (typeof item === 'string') return item.trim();
        if (item.text) return item.text.trim();
        if (item.name) return item.name.trim();
        return '';
      })
      .filter(Boolean);
  }
  
  return [];
}

/**
 * Parse instructions from various schema.org formats
 * 
 * Can be:
 * - String (plain text)
 * - Array of strings
 * - Array of HowToStep objects
 * - HowToSection with itemListElement
 */
function parseInstructions(instructions: any): string[] {
  if (!instructions) return [];
  
  // Single string - split by newlines
  if (typeof instructions === 'string') {
    return instructions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }
  
  // Array
  if (Array.isArray(instructions)) {
    const steps: string[] = [];
    
    for (const item of instructions) {
      // String
      if (typeof item === 'string') {
        steps.push(item.trim());
        continue;
      }
      
      // HowToStep or HowToSection object
      if (item['@type'] === 'HowToStep' || item.type === 'HowToStep') {
        const text = item.text || item.name || '';
        if (text) steps.push(text.trim());
      } else if (item['@type'] === 'HowToSection' || item.type === 'HowToSection') {
        // Section with nested steps
        if (item.itemListElement) {
          const sectionSteps = parseInstructions(item.itemListElement);
          steps.push(...sectionSteps);
        }
      } else if (item.text) {
        steps.push(item.text.trim());
      } else if (item.name) {
        steps.push(item.name.trim());
      }
    }
    
    return steps.filter(Boolean);
  }
  
  // Single HowToStep object
  if (instructions.text || instructions.name) {
    const text = (instructions.text || instructions.name || '').trim();
    return text ? [text] : [];
  }
  
  return [];
}

/**
 * Extract image URL from various schema.org formats
 * 
 * Can be:
 * - String (direct URL)
 * - Object with url property
 * - Array of strings or objects
 * - ImageObject with url/contentUrl
 */
function extractImage(image: any): string | undefined {
  if (!image) return undefined;
  
  // Direct string URL
  if (typeof image === 'string') {
    return image;
  }
  
  // ImageObject with url or contentUrl
  if (image.url) {
    return typeof image.url === 'string' ? image.url : image.url[0];
  }
  if (image.contentUrl) {
    return image.contentUrl;
  }
  
  // Array - use first image
  if (Array.isArray(image) && image.length > 0) {
    return extractImage(image[0]);
  }
  
  return undefined;
}
