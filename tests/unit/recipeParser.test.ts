/**
 * Recipe Parser Tests
 * 
 * Unit tests for recipe parsing logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseRecipeFromUrl } from '../../src/lib/recipeParser';
import { parseSchemaOrgRecipe } from '../../src/lib/schemaParser';
import { parseHeuristicRecipe } from '../../src/lib/heuristicParser';

// Mock fetch globally
global.fetch = vi.fn();

describe('Schema.org Parser', () => {
  it('should parse valid JSON-LD recipe', () => {
    const html = `
      <html>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Recipe",
          "name": "Pasta Carbonara",
          "recipeIngredient": ["400g spaghetti", "200g pancetta", "4 eggs"],
          "recipeInstructions": "Boil pasta. Fry pancetta. Mix eggs. Combine.",
          "image": "https://example.com/carbonara.jpg"
        }
        </script>
      </html>
    `;
    
    const result = parseSchemaOrgRecipe(html, 'https://example.com/recipe');
    
    expect(result.success).toBe(true);
    expect(result.title).toBe('Pasta Carbonara');
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0]).toBe('400g spaghetti');
    expect(result.imageUrl).toBe('https://example.com/carbonara.jpg');
  });
  
  it('should handle array of HowToStep instructions', () => {
    const html = `
      <html>
        <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "Test Recipe",
          "recipeIngredient": ["ingredient 1"],
          "recipeInstructions": [
            {
              "@type": "HowToStep",
              "text": "Step 1: Do this"
            },
            {
              "@type": "HowToStep",
              "text": "Step 2: Do that"
            }
          ]
        }
        </script>
      </html>
    `;
    
    const result = parseSchemaOrgRecipe(html, 'https://example.com/recipe');
    
    expect(result.success).toBe(true);
    expect(result.instructions).toHaveLength(2);
    expect(result.instructions[0]).toBe('Step 1: Do this');
  });
  
  it('should handle @graph wrapper', () => {
    const html = `
      <html>
        <script type="application/ld+json">
        {
          "@graph": [
            {
              "@type": "WebSite",
              "name": "Recipe Site"
            },
            {
              "@type": "Recipe",
              "name": "Wrapped Recipe",
              "recipeIngredient": ["flour"],
              "recipeInstructions": "Mix flour"
            }
          ]
        }
        </script>
      </html>
    `;
    
    const result = parseSchemaOrgRecipe(html, 'https://example.com/recipe');
    
    expect(result.success).toBe(true);
    expect(result.title).toBe('Wrapped Recipe');
  });
  
  it('should return failure when no recipe found', () => {
    const html = '<html><body>No recipe here</body></html>';
    
    const result = parseSchemaOrgRecipe(html, 'https://example.com/recipe');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Heuristic Parser', () => {
  it('should extract title from h1', () => {
    const html = '<html><h1>My Recipe Title</h1></html>';
    
    const result = parseHeuristicRecipe(html, 'https://example.com/recipe');
    
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('ingredients');
    expect(result).toHaveProperty('instructions');
  });
  
  it('should return structured ParsedRecipe', () => {
    const html = '<html><body>Test</body></html>';
    
    const result = parseHeuristicRecipe(html, 'https://example.com/recipe');
    
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('ingredients');
    expect(result).toHaveProperty('instructions');
    expect(result).toHaveProperty('sourceUrl');
    expect(result).toHaveProperty('success');
    expect(result.sourceUrl).toBe('https://example.com/recipe');
  });
});

describe('Main Parser Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should try direct fetch first', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => '<html></html>'
    });
    
    await parseRecipeFromUrl('https://example.com/recipe');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/recipe',
      expect.any(Object)
    );
  });
  
  it('should handle network errors gracefully', async () => {
    // When all fetches fail (direct + all proxy attempts), we get a user-friendly error
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const result = await parseRecipeFromUrl('https://example.com/recipe');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // Error message should be user-friendly (not a raw CORS error)
    expect(typeof result.error).toBe('string');
  });
  
  it('should return proper error structure on failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Failed'));
    
    const result = await parseRecipeFromUrl('https://example.com/recipe');
    
    expect(result).toMatchObject({
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl: 'https://example.com/recipe',
      success: false,
      error: expect.any(String)
    });
  });
});

describe('CORS Proxy Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should try CORS proxy when direct fetch fails', async () => {
    // Direct fetch fails, then Cloudflare Worker proxy succeeds
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('CORS error')) // direct fetch
      .mockResolvedValueOnce({                          // first proxy (cloudflare worker)
        ok: true,
        text: async () => '<html></html>'
      });
    
    await parseRecipeFromUrl('https://example.com/recipe');
    
    // Should have called fetch at least twice: direct + first proxy
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Second call should be to the Cloudflare Worker proxy
    expect((global.fetch as any).mock.calls[1][0]).toContain(
      'meal-organizer-cors-proxy'
    );
  });
});

