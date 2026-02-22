/**
 * Heuristic Recipe Parser
 * 
 * Fallback parsing strategy for sites without schema.org markup
 * Uses HTML patterns and common CSS class/id conventions
 * 
 * Success rate: ~10-15% additional coverage beyond schema.org
 */

import type { ParsedRecipe } from '../types/recipe';

/**
 * Parse recipe using heuristic HTML patterns
 * 
 * @param html - HTML content
 * @param sourceUrl - Original URL for the recipe
 * @returns Parsed recipe or failure object
 */
export function parseHeuristicRecipe(html: string, sourceUrl: string): ParsedRecipe {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = extractTitle(doc);
    const ingredients = extractIngredients(doc);
    const instructions = extractInstructions(doc);
    const imageUrl = extractImage(doc);
    
    // Success if we found ingredients OR instructions
    const success = ingredients.length > 0 || instructions.length > 0;
    
    return {
      title: title || 'Untitled Recipe',
      ingredients,
      instructions,
      imageUrl,
      sourceUrl,
      success,
      error: success ? undefined : 'Could not find recipe content'
    };
    
  } catch (error) {
    return {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl,
      success: false,
      error: error instanceof Error ? error.message : 'Heuristic parsing failed'
    };
  }
}

/**
 * Extract recipe title from HTML
 * Tries multiple strategies in order of reliability
 * S27-11: Added meta description, h2, and data-attribute strategies
 */
function extractTitle(doc: Document): string {
  // Strategy 1: h1 tag (most common)
  const h1 = doc.querySelector('h1');
  if (h1?.textContent?.trim()) {
    return h1.textContent.trim();
  }
  
  // Strategy 2: og:title meta tag
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content');
    if (content?.trim()) return content.trim();
  }
  
  // Strategy 3: twitter:title meta tag
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    const content = twitterTitle.getAttribute('content');
    if (content?.trim()) return content.trim();
  }
  
  // Strategy 4: Page title (remove site name if present)
  if (doc.title) {
    const title = doc.title.split('|')[0].split(' - ')[0].split('–')[0].trim();
    if (title) return title;
  }
  
  // Strategy 5: Any heading with "recipe" in parent
  const recipeHeading = doc.querySelector('[class*="recipe"] h1, [class*="recipe"] h2, [id*="recipe"] h1, [class*="title" i] h2');
  if (recipeHeading?.textContent?.trim()) {
    return recipeHeading.textContent.trim();
  }
  
  // S27-11 Strategy 6: h2 as fallback (some mobile-first sites skip h1)
  const h2 = doc.querySelector('h2');
  if (h2?.textContent?.trim() && h2.textContent.trim().length > 3) {
    return h2.textContent.trim();
  }
  
  // S27-11 Strategy 7: data-* attribute containing title
  const dataTitle = doc.querySelector('[data-recipe-title], [data-title]');
  if (dataTitle) {
    const val = dataTitle.getAttribute('data-recipe-title') || dataTitle.getAttribute('data-title') || dataTitle.textContent;
    if (val?.trim()) return val.trim();
  }
  
  return '';
}

/**
 * Extract ingredients list from HTML
 * Looks for lists with "ingredient" in class/id
 */
function extractIngredients(doc: Document): string[] {
  const ingredients: string[] = [];
  
  // Pattern 1: Lists with "ingredient" in class or id
  const selectors = [
    '[class*="ingredient" i] li',
    '[id*="ingredient" i] li',
    '.ingredients li',
    '#ingredients li',
    '[class*="ingred" i] li',
    '.recipe-ingredients li',
    '.ingredient-list li',
    // S27-11: Additional selectors for mobile-first / SPA sites
    '[data-ingredient] li',
    '[class*="zutat" i] li',  // German: Zutaten = ingredients
    'section[class*="ingredient" i] li',
    'div[class*="ingredient" i] > div',
    'ul[class*="ingredient" i] li',
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      const items = Array.from(elements)
        .map(el => el.textContent?.trim() || '')
        .filter(text => {
          // Filter out empty, very short, or header text
          return text.length > 2 && 
                 !text.toLowerCase().includes('ingredients') &&
                 !text.toLowerCase().match(/^(for|the|instructions?):?$/i);
        });
      
      if (items.length > 0) {
        ingredients.push(...items);
        break; // Found ingredients, don't look further
      }
    }
  }
  
  // Pattern 2: Paragraphs or divs within ingredient containers
  if (ingredients.length === 0) {
    const containers = doc.querySelectorAll('[class*="ingredient" i], [id*="ingredient" i]');
    for (const container of Array.from(containers)) {
      const texts = Array.from(container.querySelectorAll('p, div'))
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 5 && text.length < 200);
      
      if (texts.length > 2) {
        ingredients.push(...texts);
        break;
      }
    }
  }
  
  // Pattern 3: KptnCook and similar sites with measure + ingredient name pairs in rows
  if (ingredients.length === 0) {
    const nameElements = doc.querySelectorAll(
      '.kptn-ingredient, [class*="ingredient-name" i], [class*="ingredientName" i]'
    );
    if (nameElements.length > 0) {
      const seen = new Set<string>();
      for (const nameEl of Array.from(nameElements)) {
        const row = nameEl.closest('.row, [class*="row"], tr, div[class*="ingredient"]') || nameEl.parentElement;
        const measureEl = row?.querySelector(
          '.kptn-ingredient-measure, [class*="ingredient-measure" i], [class*="ingredientAmount" i], [class*="measure" i], [class*="amount" i], [class*="quantity" i]'
        );
        const measure = measureEl?.textContent?.trim() || '';
        const name = nameEl.textContent?.trim() || '';
        if (name) {
          const combined = measure ? `${measure} ${name}` : name;
          if (!seen.has(combined)) {
            seen.add(combined);
            ingredients.push(combined);
          }
        }
      }
    }
  }
  
  return ingredients;
}

/**
 * Extract cooking instructions from HTML
 * Looks for ordered lists or numbered steps
 */
function extractInstructions(doc: Document): string[] {
  const instructions: string[] = [];
  
  // Pattern 1: Lists with "instruction", "direction", "step" in class/id
  const selectors = [
    '[class*="instruction" i] li',
    '[id*="instruction" i] li',
    '[class*="direction" i] li',
    '[class*="step" i] li',
    '.instructions li',
    '.directions li',
    '#instructions li',
    '.recipe-instructions li',
    '.instruction-list li',
    '.recipe-directions li',
    // KptnCook and similar: step titles in divs
    '.kptn-step-title',
    '[class*="step-title" i]',
    '[class*="stepTitle" i]',
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      const items = Array.from(elements)
        .map(el => el.textContent?.trim() || '')
        .filter(text => {
          // Filter out empty, very short, or header text
          return text.length > 10 && 
                 !text.toLowerCase().match(/^(instructions?|directions?|steps?):?$/i);
        });
      
      if (items.length > 0) {
        instructions.push(...items);
        break; // Found instructions, don't look further
      }
    }
  }
  
  // Pattern 2: Ordered lists (ol) anywhere on page
  if (instructions.length === 0) {
    const orderedLists = doc.querySelectorAll('ol li');
    if (orderedLists.length > 2) {
      const items = Array.from(orderedLists)
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 10 && text.length < 500);
      
      // Only use if we got a reasonable number of steps
      if (items.length >= 2 && items.length <= 30) {
        instructions.push(...items);
      }
    }
  }
  
  // Pattern 3: Numbered paragraphs or divs
  if (instructions.length === 0) {
    const containers = doc.querySelectorAll('[class*="instruction" i], [class*="direction" i], [class*="step" i]');
    for (const container of Array.from(containers)) {
      const texts = Array.from(container.querySelectorAll('p, div'))
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 20 && text.length < 500);
      
      if (texts.length >= 2) {
        instructions.push(...texts);
        break;
      }
    }
  }
  
  return instructions;
}

/**
 * Extract recipe image from HTML
 * Tries meta tags first, then article images
 */
function extractImage(doc: Document): string | undefined {
  // Strategy 1: og:image meta tag (most reliable)
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const content = ogImage.getAttribute('content');
    if (content) return content;
  }
  
  // Strategy 2: twitter:image meta tag
  const twitterImage = doc.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    const content = twitterImage.getAttribute('content');
    if (content) return content;
  }
  
  // Strategy 3: First image in article or main content
  const contentSelectors = [
    'article img',
    'main img',
    '[class*="recipe" i] img',
    '[class*="content" i] img'
  ];
  
  for (const selector of contentSelectors) {
    const img = doc.querySelector(selector);
    if (img) {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && !src.includes('icon') && !src.includes('logo')) {
        return src;
      }
    }
  }
  
  return undefined;
}
