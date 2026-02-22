/**
 * Export/Import Tests (Sprint 13 — S13-14)
 *
 * Tests for: enhanced export structure, format detection,
 * Paprika import, Recipe Keeper import, round-trip validation.
 *
 * Implementation Plan Phase 19 · Roadmap V1.3 Epic 5
 */

import { describe, it, expect } from 'vitest';
import {
  detectImportFormat,
  parsePaprikaRecipes,
  parseRecipeKeeperRecipes,
  previewImport,
} from '../../src/lib/exportImport';

// ---------------------------------------------------------------------------
// Format Detection
// ---------------------------------------------------------------------------

describe('Import Format Detection', () => {
  it('detects Meal Organizer format by appName (legacy backward compat)', () => {
    const content = JSON.stringify({ appName: 'Meal Organizer', version: 2, data: {} });
    expect(detectImportFormat(content)).toBe('meal-organizer');
  });

  it('detects Fork and Spoon format by appName', () => {
    const content = JSON.stringify({ appName: 'Fork and Spoon', version: 2, data: {} });
    expect(detectImportFormat(content)).toBe('meal-organizer');
  });

  it('detects Paprika format by file extension', () => {
    expect(detectImportFormat('{}', 'my-recipes.paprikarecipes')).toBe('paprika');
  });

  it('detects Paprika format by JSON structure', () => {
    const content = JSON.stringify([
      { name: 'Test', ingredients: '1 cup flour', directions: 'Mix and bake' },
    ]);
    expect(detectImportFormat(content)).toBe('paprika');
  });

  it('detects Recipe Keeper format by file extension', () => {
    expect(detectImportFormat('{}', 'export.recipekeeperxml')).toBe('recipe-keeper');
    expect(detectImportFormat('<xml/>', 'export.xml')).toBe('recipe-keeper');
  });

  it('detects Recipe Keeper XML format by content', () => {
    const content = '<?xml version="1.0"?><RecipeKeeper><Recipe><n>Test</n></Recipe></RecipeKeeper>';
    expect(detectImportFormat(content)).toBe('recipe-keeper');
  });

  it('returns unknown for unrecognised formats', () => {
    expect(detectImportFormat('random text')).toBe('unknown');
    expect(detectImportFormat(JSON.stringify({ foo: 'bar' }))).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// Paprika Import
// ---------------------------------------------------------------------------

describe('Paprika Import', () => {
  it('parses a single Paprika recipe', () => {
    const content = JSON.stringify([{
      name: 'Spaghetti Bolognese',
      ingredients: '500g spaghetti\n400g ground beef\n1 can tomatoes\nsalt and pepper',
      directions: 'Cook pasta.\nBrown the beef.\nAdd tomatoes and simmer.\nSeason to taste.',
      source_url: 'https://example.com/recipe',
      photo_url: 'https://example.com/photo.jpg',
      categories: ['Italian', 'Dinner'],
    }]);

    const recipes = parsePaprikaRecipes(content);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Spaghetti Bolognese');
    expect(recipes[0].ingredients).toHaveLength(4);
    expect(recipes[0].instructions).toHaveLength(4);
    expect(recipes[0].sourceUrl).toBe('https://example.com/recipe');
    expect(recipes[0].tags).toEqual(['Italian', 'Dinner']);
    expect(recipes[0].id).toBeDefined();
    expect(recipes[0].createdAt).toBeDefined();
  });

  it('parses multiple Paprika recipes', () => {
    const content = JSON.stringify([
      { name: 'Recipe 1', ingredients: 'flour\neggs', directions: 'Mix.' },
      { name: 'Recipe 2', ingredients: 'rice\nwater', directions: 'Boil.' },
      { name: 'Recipe 3', ingredients: 'bread\nbutter', directions: 'Toast.' },
    ]);

    const recipes = parsePaprikaRecipes(content);
    expect(recipes).toHaveLength(3);
  });

  it('skips recipes without a name', () => {
    const content = JSON.stringify([
      { name: 'Valid', ingredients: 'flour', directions: 'Mix.' },
      { ingredients: 'water', directions: 'Boil.' },
    ]);

    const recipes = parsePaprikaRecipes(content);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Valid');
  });

  it('handles empty Paprika file', () => {
    expect(parsePaprikaRecipes('[]')).toHaveLength(0);
    expect(parsePaprikaRecipes('invalid json')).toHaveLength(0);
  });

  it('handles Paprika recipe with empty ingredients/directions', () => {
    const content = JSON.stringify([{ name: 'Empty Recipe' }]);
    const recipes = parsePaprikaRecipes(content);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].ingredients).toEqual([]);
    expect(recipes[0].instructions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Recipe Keeper Import
// ---------------------------------------------------------------------------

describe('Recipe Keeper Import', () => {
  it('parses Recipe Keeper JSON format', () => {
    const content = JSON.stringify({
      recipes: [{
        name: 'Chicken Curry',
        ingredients: '2 chicken breasts\n1 can coconut milk\ncurry paste',
        directions: 'Cook chicken.\nAdd coconut milk.\nSimmer with curry paste.',
        recipeSource: 'https://example.com',
        recipeCategory: 'Indian,Dinner',
      }],
    });

    const recipes = parseRecipeKeeperRecipes(content);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Chicken Curry');
    expect(recipes[0].ingredients).toHaveLength(3);
    expect(recipes[0].instructions).toHaveLength(3);
    expect(recipes[0].tags).toEqual(['Indian', 'Dinner']);
  });

  it('handles empty Recipe Keeper file', () => {
    expect(parseRecipeKeeperRecipes(JSON.stringify({ recipes: [] }))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Preview Import
// ---------------------------------------------------------------------------

describe('Preview Import', () => {
  it('previews valid Meal Organizer backup v2', () => {
    const content = JSON.stringify({
      version: 2,
      appName: 'Meal Organizer',
      exportedAt: '2026-02-13T12:00:00Z',
      data: {
        recipes: [{ id: '1', title: 'Test' }],
        scheduleEntries: [],
        recipeIngredients: [{ id: '1', recipeId: '1', name: 'flour' }],
      },
    });

    const preview = previewImport(content);
    expect(preview.valid).toBe(true);
    expect(preview.format).toBe('meal-organizer');
    expect(preview.recipeCount).toBe(1);
    expect(preview.recipeIngredientCount).toBe(1);
  });

  it('previews Paprika file', () => {
    const content = JSON.stringify([
      { name: 'Recipe 1', ingredients: 'flour', directions: 'Mix.' },
      { name: 'Recipe 2', ingredients: 'sugar', directions: 'Bake.' },
    ]);

    const preview = previewImport(content);
    expect(preview.valid).toBe(true);
    expect(preview.format).toBe('paprika');
    expect(preview.recipeCount).toBe(2);
  });

  it('rejects unknown format', () => {
    const preview = previewImport('random text');
    expect(preview.valid).toBe(false);
    expect(preview.format).toBe('unknown');
  });

  it('rejects future version backup', () => {
    const content = JSON.stringify({
      version: 999,
      appName: 'Meal Organizer',
      data: { recipes: [], scheduleEntries: [] },
    });

    const preview = previewImport(content);
    expect(preview.valid).toBe(false);
    expect(preview.errors.some(e => e.includes('newer'))).toBe(true);
  });

  it('handles v1 backup format (backward compatible)', () => {
    const content = JSON.stringify({
      version: 1,
      appName: 'Meal Organizer',
      exportedAt: '2026-01-01T00:00:00Z',
      data: {
        recipes: [{ id: '1', title: 'Old Recipe' }],
        scheduleEntries: [],
      },
    });

    const preview = previewImport(content);
    expect(preview.valid).toBe(true);
    expect(preview.recipeCount).toBe(1);
    expect(preview.recipeIngredientCount).toBe(0);
  });
});
