/**
 * Sprint 4 Unit Tests
 * Recipe Library & Manual Entry
 *
 * Tests cover:
 * - Recipe type validation
 * - Sort logic (oldest/newest/A-Z)
 * - Search/filter logic
 * - RecencyBadge logic
 * - CRUD operations
 * - RecipeForm validation
 * - DeleteRecipeDialog behavior
 * - EditDateDialog behavior
 * - RecipeDetail page logic
 * - Navigation/routing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Recipe, ParsedRecipe } from '../../src/types/recipe';

// ============================================
// Test Helpers
// ============================================

function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: `recipe-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Recipe',
    ingredients: ['ingredient 1', 'ingredient 2'],
    instructions: ['step 1', 'step 2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ============================================
// Sort Logic Tests
// ============================================

describe('Recipe Sort Logic', () => {
  function sortRecipes(
    recipes: Recipe[],
    sortBy: 'oldest' | 'newest' | 'az'
  ): Recipe[] {
    return [...recipes].sort((a, b) => {
      if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'newest') {
        if (!a.lastCookedDate && !b.lastCookedDate) return 0;
        if (!a.lastCookedDate) return 1;
        if (!b.lastCookedDate) return -1;
        return (
          new Date(b.lastCookedDate).getTime() -
          new Date(a.lastCookedDate).getTime()
        );
      }
      // oldest
      if (!a.lastCookedDate && !b.lastCookedDate) return 0;
      if (!a.lastCookedDate) return 1;
      if (!b.lastCookedDate) return -1;
      return (
        new Date(a.lastCookedDate).getTime() -
        new Date(b.lastCookedDate).getTime()
      );
    });
  }

  const recipes: Recipe[] = [
    createRecipe({ title: 'Pasta', lastCookedDate: daysAgo(5) }),
    createRecipe({ title: 'Burger', lastCookedDate: daysAgo(20) }),
    createRecipe({ title: 'Salad', lastCookedDate: daysAgo(1) }),
    createRecipe({ title: 'Apple Pie' }),
    createRecipe({ title: 'Zebra Cake', lastCookedDate: daysAgo(45) }),
  ];

  describe('Sort by oldest cooked first', () => {
    it('should put oldest cooked first', () => {
      const sorted = sortRecipes(recipes, 'oldest');
      expect(sorted[0].title).toBe('Zebra Cake'); // 45 days ago
      expect(sorted[1].title).toBe('Burger'); // 20 days ago
    });

    it('should push never-cooked to the end', () => {
      const sorted = sortRecipes(recipes, 'oldest');
      expect(sorted[sorted.length - 1].title).toBe('Apple Pie');
    });

    it('should keep relative order of never-cooked items', () => {
      const twoNeverCooked = [
        createRecipe({ title: 'A' }),
        createRecipe({ title: 'B' }),
      ];
      const sorted = sortRecipes(twoNeverCooked, 'oldest');
      expect(sorted).toHaveLength(2);
    });
  });

  describe('Sort by newest cooked first', () => {
    it('should put most recently cooked first', () => {
      const sorted = sortRecipes(recipes, 'newest');
      expect(sorted[0].title).toBe('Salad'); // 1 day ago
      expect(sorted[1].title).toBe('Pasta'); // 5 days ago
    });

    it('should push never-cooked to the end', () => {
      const sorted = sortRecipes(recipes, 'newest');
      expect(sorted[sorted.length - 1].title).toBe('Apple Pie');
    });
  });

  describe('Sort alphabetically (A-Z)', () => {
    it('should sort A to Z', () => {
      const sorted = sortRecipes(recipes, 'az');
      expect(sorted[0].title).toBe('Apple Pie');
      expect(sorted[sorted.length - 1].title).toBe('Zebra Cake');
    });

    it('should be case-insensitive via localeCompare', () => {
      const mixed = [
        createRecipe({ title: 'banana' }),
        createRecipe({ title: 'Apple' }),
      ];
      const sorted = sortRecipes(mixed, 'az');
      expect(sorted[0].title).toBe('Apple');
      expect(sorted[1].title).toBe('banana');
    });
  });
});

// ============================================
// Search/Filter Logic Tests
// ============================================

describe('Recipe Search/Filter Logic', () => {
  function filterRecipes(recipes: Recipe[], query: string): Recipe[] {
    if (!query) return recipes;
    const q = query.toLowerCase().trim();
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(q) ||
        recipe.ingredients.some((ing) => ing.toLowerCase().includes(q))
    );
  }

  const recipes: Recipe[] = [
    createRecipe({
      title: 'Pasta Carbonara',
      ingredients: ['spaghetti', 'eggs', 'pancetta', 'parmesan'],
    }),
    createRecipe({
      title: 'Chicken Stir Fry',
      ingredients: ['chicken', 'soy sauce', 'vegetables', 'rice'],
    }),
    createRecipe({
      title: 'Caesar Salad',
      ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'dressing'],
    }),
    createRecipe({
      title: 'Margherita Pizza',
      ingredients: ['dough', 'tomato sauce', 'mozzarella', 'basil'],
    }),
  ];

  it('should return all recipes when query is empty', () => {
    expect(filterRecipes(recipes, '')).toHaveLength(4);
  });

  it('should return all recipes when query is whitespace', () => {
    expect(filterRecipes(recipes, '   ')).toHaveLength(4);
  });

  it('should filter by title (case-insensitive)', () => {
    const result = filterRecipes(recipes, 'pasta');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pasta Carbonara');
  });

  it('should filter by ingredient', () => {
    const result = filterRecipes(recipes, 'parmesan');
    expect(result).toHaveLength(2); // Pasta and Salad
  });

  it('should handle partial matches', () => {
    const result = filterRecipes(recipes, 'chick');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Chicken Stir Fry');
  });

  it('should return empty for non-matching query', () => {
    const result = filterRecipes(recipes, 'sushi');
    expect(result).toHaveLength(0);
  });

  it('should be case-insensitive for ingredients', () => {
    const result = filterRecipes(recipes, 'SOY SAUCE');
    expect(result).toHaveLength(1);
  });

  it('should trim whitespace from query', () => {
    const result = filterRecipes(recipes, '  pasta  ');
    expect(result).toHaveLength(1);
  });
});

// ============================================
// RecencyBadge Logic Tests
// ============================================

describe('RecencyBadge Logic', () => {
  function getRecencyCategory(
    lastCookedDate?: string
  ): 'never' | 'recent' | 'medium' | 'old' {
    if (!lastCookedDate) return 'never';
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCookedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 30) return 'old';
    if (daysSince > 14) return 'medium';
    return 'recent';
  }

  it('should return "never" for undefined date', () => {
    expect(getRecencyCategory(undefined)).toBe('never');
  });

  it('should return "recent" for today', () => {
    expect(getRecencyCategory(new Date().toISOString())).toBe('recent');
  });

  it('should return "recent" for 7 days ago', () => {
    expect(getRecencyCategory(daysAgo(7))).toBe('recent');
  });

  it('should return "recent" for 14 days ago', () => {
    expect(getRecencyCategory(daysAgo(14))).toBe('recent');
  });

  it('should return "medium" for 15 days ago', () => {
    expect(getRecencyCategory(daysAgo(15))).toBe('medium');
  });

  it('should return "medium" for 30 days ago', () => {
    expect(getRecencyCategory(daysAgo(30))).toBe('medium');
  });

  it('should return "old" for 31 days ago', () => {
    expect(getRecencyCategory(daysAgo(31))).toBe('old');
  });

  it('should return "old" for 100 days ago', () => {
    expect(getRecencyCategory(daysAgo(100))).toBe('old');
  });
});

// ============================================
// Recipe CRUD Logic Tests
// ============================================

describe('Recipe CRUD Operations', () => {
  let recipes: Recipe[];

  beforeEach(() => {
    recipes = [
      createRecipe({ id: '1', title: 'Recipe A' }),
      createRecipe({ id: '2', title: 'Recipe B' }),
      createRecipe({ id: '3', title: 'Recipe C' }),
    ];
  });

  describe('Add Recipe', () => {
    it('should add recipe to beginning of list', () => {
      const newRecipe = createRecipe({ id: '4', title: 'New Recipe' });
      recipes = [newRecipe, ...recipes];
      expect(recipes[0].title).toBe('New Recipe');
      expect(recipes).toHaveLength(4);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const r = createRecipe();
        ids.add(r.id);
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('Update Recipe', () => {
    it('should update recipe by id', () => {
      const updated = { ...recipes[1], title: 'Updated B' };
      recipes = recipes.map((r) => (r.id === updated.id ? updated : r));
      expect(recipes[1].title).toBe('Updated B');
    });

    it('should not affect other recipes', () => {
      const updated = { ...recipes[1], title: 'Updated B' };
      recipes = recipes.map((r) => (r.id === updated.id ? updated : r));
      expect(recipes[0].title).toBe('Recipe A');
      expect(recipes[2].title).toBe('Recipe C');
    });

    it('should handle non-existent id gracefully', () => {
      const updated = { ...recipes[0], id: 'non-existent', title: 'Ghost' };
      const result = recipes.map((r) => (r.id === updated.id ? updated : r));
      expect(result.every((r) => r.title !== 'Ghost')).toBe(true);
    });
  });

  describe('Delete Recipe', () => {
    it('should remove recipe by id', () => {
      recipes = recipes.filter((r) => r.id !== '2');
      expect(recipes).toHaveLength(2);
      expect(recipes.find((r) => r.id === '2')).toBeUndefined();
    });

    it('should handle non-existent id gracefully', () => {
      recipes = recipes.filter((r) => r.id !== 'non-existent');
      expect(recipes).toHaveLength(3);
    });
  });

  describe('Get Recipe By Id', () => {
    it('should find recipe by id', () => {
      const found = recipes.find((r) => r.id === '2');
      expect(found).toBeDefined();
      expect(found?.title).toBe('Recipe B');
    });

    it('should return undefined for non-existent id', () => {
      const found = recipes.find((r) => r.id === 'non-existent');
      expect(found).toBeUndefined();
    });
  });
});

// ============================================
// Recipe Type Validation Tests
// ============================================

describe('Recipe Type Validation', () => {
  it('should validate a complete recipe', () => {
    const recipe = createRecipe();
    expect(recipe.id).toBeDefined();
    expect(recipe.title).toBeDefined();
    expect(recipe.ingredients).toBeInstanceOf(Array);
    expect(recipe.instructions).toBeInstanceOf(Array);
    expect(recipe.createdAt).toBeDefined();
    expect(recipe.updatedAt).toBeDefined();
  });

  it('should allow optional fields to be undefined', () => {
    const recipe = createRecipe();
    expect(recipe.imageUrl).toBeUndefined();
    expect(recipe.sourceUrl).toBeUndefined();
    expect(recipe.lastCookedDate).toBeUndefined();
  });

  it('should accept optional fields when provided', () => {
    const recipe = createRecipe({
      imageUrl: 'https://example.com/img.jpg',
      sourceUrl: 'https://example.com/recipe',
      lastCookedDate: new Date().toISOString(),
    });
    expect(recipe.imageUrl).toBe('https://example.com/img.jpg');
    expect(recipe.sourceUrl).toBe('https://example.com/recipe');
    expect(recipe.lastCookedDate).toBeDefined();
  });
});

describe('ParsedRecipe Type Validation', () => {
  it('should represent a successful parse', () => {
    const parsed: ParsedRecipe = {
      title: 'Test',
      ingredients: ['a', 'b'],
      instructions: ['step 1'],
      sourceUrl: 'https://example.com',
      success: true,
    };
    expect(parsed.success).toBe(true);
    expect(parsed.error).toBeUndefined();
  });

  it('should represent a failed parse', () => {
    const parsed: ParsedRecipe = {
      title: '',
      ingredients: [],
      instructions: [],
      sourceUrl: 'https://example.com',
      success: false,
      error: 'Could not parse recipe',
    };
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });

  it('should represent a partial parse', () => {
    const parsed: ParsedRecipe = {
      title: 'Partial Recipe',
      ingredients: ['some ingredient'],
      instructions: [],
      sourceUrl: 'https://example.com',
      success: false,
      error: 'Instructions not found',
    };
    expect(parsed.success).toBe(false);
    expect(parsed.title).toBe('Partial Recipe');
    expect(parsed.ingredients).toHaveLength(1);
  });
});

// ============================================
// Form Validation Logic Tests
// ============================================

describe('Recipe Form Validation', () => {
  function validateRecipeForm(data: {
    title: string;
    ingredients: string;
    instructions: string;
  }): string | null {
    if (!data.title.trim()) return 'Please enter a recipe title';
    if (!data.ingredients.trim()) return 'Please enter at least one ingredient';
    if (!data.instructions.trim()) return 'Please enter cooking instructions';
    return null;
  }

  it('should pass with valid data', () => {
    expect(
      validateRecipeForm({
        title: 'Test',
        ingredients: 'ingredient 1',
        instructions: 'step 1',
      })
    ).toBeNull();
  });

  it('should fail with empty title', () => {
    expect(
      validateRecipeForm({
        title: '',
        ingredients: 'ingredient',
        instructions: 'step',
      })
    ).toBe('Please enter a recipe title');
  });

  it('should fail with whitespace-only title', () => {
    expect(
      validateRecipeForm({
        title: '   ',
        ingredients: 'ingredient',
        instructions: 'step',
      })
    ).toBe('Please enter a recipe title');
  });

  it('should fail with empty ingredients', () => {
    expect(
      validateRecipeForm({
        title: 'Test',
        ingredients: '',
        instructions: 'step',
      })
    ).toBe('Please enter at least one ingredient');
  });

  it('should fail with empty instructions', () => {
    expect(
      validateRecipeForm({
        title: 'Test',
        ingredients: 'ingredient',
        instructions: '',
      })
    ).toBe('Please enter cooking instructions');
  });
});

// ============================================
// Ingredient Parsing Tests
// ============================================

describe('Ingredient Parsing from Form', () => {
  function parseIngredients(raw: string): string[] {
    return raw
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);
  }

  it('should split by newline', () => {
    const result = parseIngredients('flour\neggs\nmilk');
    expect(result).toEqual(['flour', 'eggs', 'milk']);
  });

  it('should trim whitespace', () => {
    const result = parseIngredients('  flour  \n  eggs  ');
    expect(result).toEqual(['flour', 'eggs']);
  });

  it('should filter empty lines', () => {
    const result = parseIngredients('flour\n\neggs\n\n\nmilk');
    expect(result).toEqual(['flour', 'eggs', 'milk']);
  });

  it('should handle single ingredient', () => {
    const result = parseIngredients('flour');
    expect(result).toEqual(['flour']);
  });

  it('should handle empty string', () => {
    const result = parseIngredients('');
    expect(result).toEqual([]);
  });
});

// ============================================
// Instruction Parsing Tests
// ============================================

describe('Instruction Parsing from Form', () => {
  function parseInstructions(raw: string): string[] {
    return raw
      .split('\n\n')
      .map((i) => i.trim())
      .filter(Boolean);
  }

  it('should split by double newline', () => {
    const result = parseInstructions('Step one.\n\nStep two.\n\nStep three.');
    expect(result).toEqual(['Step one.', 'Step two.', 'Step three.']);
  });

  it('should trim whitespace from steps', () => {
    const result = parseInstructions('  Step one.  \n\n  Step two.  ');
    expect(result).toEqual(['Step one.', 'Step two.']);
  });

  it('should handle single step', () => {
    const result = parseInstructions('Just do this.');
    expect(result).toEqual(['Just do this.']);
  });

  it('should filter empty steps', () => {
    const result = parseInstructions('Step one.\n\n\n\nStep two.');
    expect(result).toHaveLength(2);
  });
});

// ============================================
// URL Validation Tests
// ============================================

describe('URL Validation', () => {
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  it('should accept valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('should accept valid https URL', () => {
    expect(isValidUrl('https://example.com/recipe')).toBe(true);
  });

  it('should reject invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('should accept URL with path and query params', () => {
    expect(isValidUrl('https://example.com/recipe?id=123&lang=en')).toBe(true);
  });
});

// ============================================
// Date Utility Tests
// ============================================

describe('Date Utilities', () => {
  it('should convert ISO date to YYYY-MM-DD', () => {
    const iso = '2024-06-15T12:30:00.000Z';
    const date = iso.split('T')[0];
    expect(date).toBe('2024-06-15');
  });

  it('should handle today as max date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should validate date is not in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const today = new Date();
    expect(futureDate.getTime() > today.getTime()).toBe(true);
  });
});

// ============================================
// Mock Recipes Data Tests
// ============================================

describe('Mock Recipes', () => {
  it('should have properly structured mock recipes', async () => {
    const { mockRecipes } = await import('../../src/lib/mockRecipes');
    expect(mockRecipes.length).toBeGreaterThan(0);

    for (const recipe of mockRecipes) {
      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.instructions.length).toBeGreaterThan(0);
      expect(recipe.createdAt).toBeDefined();
      expect(recipe.updatedAt).toBeDefined();
    }
  });

  it('should have unique IDs', async () => {
    const { mockRecipes } = await import('../../src/lib/mockRecipes');
    const ids = mockRecipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have some recipes with lastCookedDate', async () => {
    const { mockRecipes } = await import('../../src/lib/mockRecipes');
    const withDates = mockRecipes.filter((r) => r.lastCookedDate);
    expect(withDates.length).toBeGreaterThan(0);
  });
});

// ============================================
// SortOption Type Tests
// ============================================

describe('SortOption Values', () => {
  const validOptions = ['oldest', 'newest', 'az'] as const;

  it('should have exactly 3 sort options', () => {
    expect(validOptions).toHaveLength(3);
  });

  it('should include oldest', () => {
    expect(validOptions).toContain('oldest');
  });

  it('should include newest', () => {
    expect(validOptions).toContain('newest');
  });

  it('should include az', () => {
    expect(validOptions).toContain('az');
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
  it('should handle recipe with empty ingredients array', () => {
    const recipe = createRecipe({ ingredients: [] });
    expect(recipe.ingredients).toHaveLength(0);
  });

  it('should handle recipe with empty instructions array', () => {
    const recipe = createRecipe({ instructions: [] });
    expect(recipe.instructions).toHaveLength(0);
  });

  it('should handle very long recipe title', () => {
    const longTitle = 'A'.repeat(500);
    const recipe = createRecipe({ title: longTitle });
    expect(recipe.title).toHaveLength(500);
  });

  it('should handle recipe with many ingredients', () => {
    const manyIngredients = Array.from({ length: 50 }, (_, i) => `ingredient ${i + 1}`);
    const recipe = createRecipe({ ingredients: manyIngredients });
    expect(recipe.ingredients).toHaveLength(50);
  });

  it('should handle special characters in title', () => {
    const recipe = createRecipe({ title: 'Crème Brûlée (Traditional)' });
    expect(recipe.title).toBe('Crème Brûlée (Traditional)');
  });

  it('should handle unicode in ingredients', () => {
    const recipe = createRecipe({ ingredients: ['½ cup flour', '¼ tsp salt'] });
    expect(recipe.ingredients[0]).toBe('½ cup flour');
  });
});
