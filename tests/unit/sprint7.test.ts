/**
 * Sprint 7 Tests
 *
 * Tests for:
 * - Database v2 migration (tags field)
 * - Tag CRUD operations
 * - Quick-log cooked today + undo
 * - i18n configuration
 * - Share utility
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/database';
import {
  createRecipe,
  getRecipes,
  updateRecipe,
  getAllTags,
  filterRecipesByTag,
} from '@/lib/recipeService';
import type { Recipe } from '@/types/recipe';

// Reset database before each test
beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('Database V2 Migration — Tags', () => {
  test('new recipes default to empty tags array', async () => {
    const recipe = await createRecipe({
      title: 'Test Recipe',
      ingredients: ['flour', 'sugar'],
      instructions: ['mix', 'bake'],
    });
    expect(recipe.tags).toEqual([]);
  });

  test('recipes can be created with tags', async () => {
    const recipe = await createRecipe({
      title: 'Tagged Recipe',
      ingredients: ['pasta'],
      instructions: ['boil'],
      tags: ['italian', 'quick'],
    });
    expect(recipe.tags).toEqual(['italian', 'quick']);
  });

  test('tags are persisted and retrievable', async () => {
    await createRecipe({
      title: 'Pasta',
      ingredients: ['pasta'],
      instructions: ['boil'],
      tags: ['italian', 'vegetarian'],
    });

    const recipes = await getRecipes();
    expect(recipes[0].tags).toEqual(['italian', 'vegetarian']);
  });

  test('tags can be updated on existing recipe', async () => {
    const recipe = await createRecipe({
      title: 'Soup',
      ingredients: ['water'],
      instructions: ['heat'],
      tags: ['winter'],
    });

    await updateRecipe(recipe.id, { tags: ['winter', 'comfort-food'] });
    const recipes = await getRecipes();
    const updated = recipes.find(r => r.id === recipe.id);
    expect(updated?.tags).toEqual(['winter', 'comfort-food']);
  });
});

describe('getAllTags', () => {
  test('returns empty array when no recipes', async () => {
    const tags = await getAllTags();
    expect(tags).toEqual([]);
  });

  test('returns unique sorted tags across all recipes', async () => {
    await createRecipe({
      title: 'R1', ingredients: ['a'], instructions: ['b'],
      tags: ['italian', 'quick'],
    });
    await createRecipe({
      title: 'R2', ingredients: ['a'], instructions: ['b'],
      tags: ['quick', 'vegetarian'],
    });

    const tags = await getAllTags();
    expect(tags).toEqual(['italian', 'quick', 'vegetarian']);
  });

  test('handles recipes with no tags', async () => {
    await createRecipe({
      title: 'R1', ingredients: ['a'], instructions: ['b'],
      tags: ['italian'],
    });
    await createRecipe({
      title: 'R2', ingredients: ['a'], instructions: ['b'],
    });

    const tags = await getAllTags();
    expect(tags).toEqual(['italian']);
  });
});

describe('filterRecipesByTag', () => {
  test('filters recipes by tag', async () => {
    await createRecipe({
      title: 'Pasta', ingredients: ['pasta'], instructions: ['boil'],
      tags: ['italian', 'quick'],
    });
    await createRecipe({
      title: 'Salad', ingredients: ['lettuce'], instructions: ['toss'],
      tags: ['healthy', 'quick'],
    });
    await createRecipe({
      title: 'Steak', ingredients: ['beef'], instructions: ['grill'],
      tags: ['protein'],
    });

    const quickRecipes = await filterRecipesByTag('quick');
    expect(quickRecipes).toHaveLength(2);
    expect(quickRecipes.map(r => r.title).sort()).toEqual(['Pasta', 'Salad']);

    const italianRecipes = await filterRecipesByTag('italian');
    expect(italianRecipes).toHaveLength(1);
    expect(italianRecipes[0].title).toBe('Pasta');
  });

  test('returns empty array for non-existent tag', async () => {
    await createRecipe({
      title: 'R1', ingredients: ['a'], instructions: ['b'],
      tags: ['italian'],
    });

    const results = await filterRecipesByTag('nonexistent');
    expect(results).toEqual([]);
  });
});

describe('i18n Configuration', () => {
  test('en.json has all required top-level keys', async () => {
    const mod = await import('@/i18n/en.json');
    const en = mod.default || mod;
    const requiredKeys = ['app', 'nav', 'header', 'recipes', 'recipeForm', 'recipeDetail',
      'schedule', 'sort', 'tags', 'emptyState', 'delete', 'editDate',
      'settings', 'dataManagement', 'toast', 'share', 'pwa'];
    for (const key of requiredKeys) {
      expect(en).toHaveProperty(key);
    }
    // 'import' is a keyword — check via bracket notation
    expect((en as Record<string, unknown>)['import']).toBeDefined();
  });

  test('de.json has all required top-level keys', async () => {
    const mod = await import('@/i18n/de.json');
    const de = mod.default || mod;
    const requiredKeys = ['app', 'nav', 'header', 'recipes', 'recipeForm', 'recipeDetail',
      'schedule', 'sort', 'tags', 'emptyState', 'delete', 'editDate',
      'settings', 'dataManagement', 'toast', 'share', 'pwa'];
    for (const key of requiredKeys) {
      expect(de).toHaveProperty(key);
    }
    expect((de as Record<string, unknown>)['import']).toBeDefined();
  });

  test('en.json and de.json have matching keys', async () => {
    const enMod = await import('@/i18n/en.json');
    const deMod = await import('@/i18n/de.json');
    const en = enMod.default || enMod;
    const de = deMod.default || deMod;

    const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
      return Object.entries(obj).flatMap(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return getKeys(value as Record<string, unknown>, fullKey);
        }
        return [fullKey];
      });
    };

    const enKeys = getKeys(en as Record<string, unknown>).sort();
    const deKeys = getKeys(de as Record<string, unknown>).sort();
    expect(enKeys).toEqual(deKeys);
  });
});

describe('Share Utility', () => {
  test('shareRecipe module exports expected functions', async () => {
    const shareModule = await import('@/lib/share');
    expect(shareModule.canNativeShare).toBeDefined();
    expect(shareModule.shareRecipe).toBeDefined();
  });
});

describe('Recipe Type — tags field', () => {
  test('Recipe type accepts tags as optional string array', () => {
    const recipe: Recipe = {
      id: '1',
      title: 'Test',
      ingredients: [],
      instructions: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      tags: ['italian', 'quick'],
    };
    expect(recipe.tags).toEqual(['italian', 'quick']);
  });

  test('Recipe type allows undefined tags', () => {
    const recipe: Recipe = {
      id: '1',
      title: 'Test',
      ingredients: [],
      instructions: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(recipe.tags).toBeUndefined();
  });
});
