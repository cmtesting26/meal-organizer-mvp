/**
 * Recipe Service Tests
 *
 * Tests CRUD operations against IndexedDB via Dexie.js.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/lib/database';
import {
  getRecipes,
  getRecipeById,
  searchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeCount,
} from '../../src/lib/recipeService';

beforeEach(async () => {
  await db.recipes.clear();
  await db.scheduleEntries.clear();
});

describe('recipeService', () => {
  describe('createRecipe', () => {
    it('creates a recipe with auto-generated id and timestamps', async () => {
      const recipe = await createRecipe({
        title: 'Pasta Carbonara',
        ingredients: ['spaghetti', 'eggs', 'pancetta'],
        instructions: ['Boil pasta', 'Fry pancetta', 'Mix'],
      });

      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBe('Pasta Carbonara');
      expect(recipe.createdAt).toBeDefined();
      expect(recipe.updatedAt).toBeDefined();
    });

    it('stores recipe in IndexedDB', async () => {
      const recipe = await createRecipe({
        title: 'Test Recipe',
        ingredients: ['item1'],
        instructions: ['step1'],
      });

      const stored = await db.recipes.get(recipe.id);
      expect(stored).toBeDefined();
      expect(stored!.title).toBe('Test Recipe');
    });
  });

  describe('getRecipes', () => {
    it('returns empty array when no recipes exist', async () => {
      const recipes = await getRecipes();
      expect(recipes).toEqual([]);
    });

    it('returns all recipes sorted by createdAt (newest first)', async () => {
      await createRecipe({ title: 'First', ingredients: [], instructions: [] });
      await new Promise((r) => setTimeout(r, 10));
      await createRecipe({ title: 'Second', ingredients: [], instructions: [] });

      const recipes = await getRecipes();
      expect(recipes).toHaveLength(2);
      expect(recipes[0].title).toBe('Second');
    });

    it('sorts by title when requested', async () => {
      await createRecipe({ title: 'Zebra Cake', ingredients: [], instructions: [] });
      await createRecipe({ title: 'Apple Pie', ingredients: [], instructions: [] });

      const recipes = await getRecipes('title');
      expect(recipes[0].title).toBe('Apple Pie');
      expect(recipes[1].title).toBe('Zebra Cake');
    });

    it('sorts by lastCookedDate with never-cooked first', async () => {
      await createRecipe({ title: 'Never', ingredients: [], instructions: [] });
      await createRecipe({
        title: 'Recent',
        ingredients: [],
        instructions: [],
        lastCookedDate: '2026-02-10',
      });
      await createRecipe({
        title: 'Old',
        ingredients: [],
        instructions: [],
        lastCookedDate: '2026-01-01',
      });

      const recipes = await getRecipes('lastCookedDate');
      expect(recipes[0].title).toBe('Never');
      expect(recipes[1].title).toBe('Old');
      expect(recipes[2].title).toBe('Recent');
    });
  });

  describe('getRecipeById', () => {
    it('returns recipe by id', async () => {
      const created = await createRecipe({ title: 'Find Me', ingredients: [], instructions: [] });
      const found = await getRecipeById(created.id);
      expect(found!.title).toBe('Find Me');
    });

    it('returns undefined for non-existent id', async () => {
      const found = await getRecipeById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('searchRecipes', () => {
    beforeEach(async () => {
      await createRecipe({ title: 'Pasta Carbonara', ingredients: ['eggs', 'pancetta'], instructions: [] });
      await createRecipe({ title: 'Thai Red Curry', ingredients: ['coconut milk', 'red paste'], instructions: [] });
      await createRecipe({ title: 'Egg Fried Rice', ingredients: ['eggs', 'rice'], instructions: [] });
    });

    it('searches by title', async () => {
      const results = await searchRecipes('pasta');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Pasta Carbonara');
    });

    it('searches by ingredient', async () => {
      const results = await searchRecipes('eggs');
      expect(results).toHaveLength(2);
    });

    it('returns all recipes for empty query', async () => {
      const results = await searchRecipes('');
      expect(results).toHaveLength(3);
    });

    it('returns empty array for no matches', async () => {
      const results = await searchRecipes('sushi');
      expect(results).toHaveLength(0);
    });
  });

  describe('updateRecipe', () => {
    it('updates recipe fields', async () => {
      const recipe = await createRecipe({ title: 'Old Title', ingredients: [], instructions: [] });
      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));
      await updateRecipe(recipe.id, { title: 'New Title' });

      const updated = await getRecipeById(recipe.id);
      expect(updated!.title).toBe('New Title');
    });
  });

  describe('deleteRecipe', () => {
    it('removes recipe from database', async () => {
      const recipe = await createRecipe({ title: 'Delete Me', ingredients: [], instructions: [] });
      await deleteRecipe(recipe.id);

      const found = await getRecipeById(recipe.id);
      expect(found).toBeUndefined();
      expect(await getRecipeCount()).toBe(0);
    });
  });
});
