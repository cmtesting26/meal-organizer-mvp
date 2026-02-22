/**
 * Recipe Parser - Main Module
 * 
 * Orchestrates recipe parsing from URLs using multiple strategies:
 * 1. schema.org JSON-LD (primary - 70-80% success rate)
 * 2. Heuristic HTML parsing (fallback - 10-15% additional coverage)
 * 
 * Target: 80%+ success rate on common recipe sites
 */

import type { ParsedRecipe } from '../types/recipe';
import { parseSchemaOrgRecipe } from './schemaParser';
import { parseHeuristicRecipe } from './heuristicParser';
import { isSocialMediaUrl, parseSocialMediaRecipe } from './socialMediaParser';

/**
 * Parse a recipe from a URL
 * 
 * @param url - The recipe URL to parse
 * @returns ParsedRecipe object with extracted data
 * 
 * @example
 * const recipe = await parseRecipeFromUrl('https://example.com/recipe');
 * if (recipe.success) {
 *   console.log('Title:', recipe.title);
 *   console.log('Ingredients:', recipe.ingredients);
 * }
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  try {
    // TODO: Step 1 - Fetch the HTML from URL
    const html = await fetchRecipeHtml(url);
    
    // Step 1 - For social media URLs, try caption-based parsing FIRST
    // (Instagram/TikTok have no structured data — schema and heuristic parsers
    // produce garbage results from the page chrome)
    if (isSocialMediaUrl(url)) {
      console.log('[RecipeParser] Social media URL detected, using caption parser');
      const socialResult = parseSocialMediaRecipe(html, url);
      console.log('[RecipeParser] Social parser result:', {
        success: socialResult.success,
        ingredientCount: socialResult.ingredients.length,
        instructionCount: socialResult.instructions.length,
        title: socialResult.title?.substring(0, 50),
        error: socialResult.error,
      });
      if (socialResult.success) {
        return socialResult;
      }
      // Even if social parser "failed", if it got partial data, use it
      if (socialResult.ingredients.length > 0 || socialResult.instructions.length > 0) {
        return { ...socialResult, success: true };
      }
      // For social media, schema/heuristic parsers produce garbage — don't try them.
      // Return a helpful error instead.
      return {
        title: socialResult.title || '',
        ingredients: [],
        instructions: [],
        imageUrl: socialResult.imageUrl,
        sourceUrl: url,
        success: false,
        error: 'Could not extract recipe from this social media post. The recipe may be in a video or image rather than the caption text.',
      };
    }
    
    // Step 2 - Try schema.org parser
    const schemaResult = parseSchemaOrg(html, url);
    if (schemaResult.success) {
      return schemaResult;
    }
    
    // Step 3 - Fall back to heuristic parser
    const heuristicResult = parseHeuristic(html, url);
    if (heuristicResult.success) {
      return heuristicResult;
    }
    
    // Step 4 - If both fail, return error with what we tried
    return {
      title: schemaResult.title || heuristicResult.title || '',
      ingredients: schemaResult.ingredients.length > 0 ? schemaResult.ingredients : heuristicResult.ingredients,
      instructions: schemaResult.instructions.length > 0 ? schemaResult.instructions : heuristicResult.instructions,
      imageUrl: schemaResult.imageUrl || heuristicResult.imageUrl,
      sourceUrl: url,
      success: false,
      error: 'Could not find recipe data on this page'
    };
    
  } catch (error) {
    // Network error or other exception
    return {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl: url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch HTML from URL with CORS handling
 * 
 * @param url - The URL to fetch
 * @returns HTML content as string
 */
async function fetchRecipeHtml(url: string): Promise<string> {
  // Try direct fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Fork-and-Spoon/1.4)',
      },
    });

    if (response.ok) {
      return await response.text();
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  } catch {
    // Direct fetch failed (likely CORS) — try proxy
    return await fetchViaProxy(url);
  }
}

/**
 * Fetch URL via CORS proxy.
 * Uses custom proxy from env if set, otherwise falls back to allorigins.win.
 */
async function fetchViaProxy(url: string): Promise<string> {
  const customProxy = import.meta?.env?.VITE_CORS_PROXY_URL;

  // Build list of proxies to try (Cloudflare Worker first, then public fallback)
  const proxies: { name: string; buildUrl: (u: string) => string }[] = [];

  if (customProxy) {
    proxies.push({
      name: 'custom',
      buildUrl: (u) => `${customProxy}?url=${encodeURIComponent(u)}`,
    });
  }

  // Cloudflare Worker CORS proxy (primary)
  proxies.push({
    name: 'cloudflare-worker',
    buildUrl: (u) => `https://meal-organizer-cors-proxy.cmtesting26.workers.dev?url=${encodeURIComponent(u)}`,
  });

  // Public CORS proxy as last resort fallback
  proxies.push({
    name: 'allorigins',
    buildUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  });

  for (const proxy of proxies) {
    try {
      const proxiedUrl = proxy.buildUrl(url);
      const response = await fetch(proxiedUrl);

      if (response.ok) {
        return await response.text();
      }
    } catch {
      // This proxy failed, try next
      continue;
    }
  }

  throw new Error(
    'Could not fetch recipe. The website may be blocking automated access. Try adding the recipe manually instead.'
  );
}

/**
 * Parse recipe using schema.org JSON-LD markup
 * 
 * @param html - HTML content
 * @param sourceUrl - Original URL
 * @returns ParsedRecipe
 */
function parseSchemaOrg(html: string, sourceUrl: string): ParsedRecipe {
  return parseSchemaOrgRecipe(html, sourceUrl);
}

/**
 * Parse recipe using heuristic HTML patterns
 * 
 * @param html - HTML content
 * @param sourceUrl - Original URL
 * @returns ParsedRecipe
 */
function parseHeuristic(html: string, sourceUrl: string): ParsedRecipe {
  return parseHeuristicRecipe(html, sourceUrl);
}

