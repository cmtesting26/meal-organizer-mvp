/**
 * Schedule Service Tests
 *
 * Tests schedule CRUD and auto-recency update logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/lib/database';
import {
  addToSchedule,
  removeFromSchedule,
  getScheduleEntries,
  getEntriesForDate,
  getEntriesByRecipe,
  getScheduleForWeek,
  getScheduleEntryCount,
} from '../../src/lib/scheduleService';
import { createRecipe, getRecipeById } from '../../src/lib/recipeService';
import type { Recipe } from '../../src/types/recipe';

let testRecipe: Recipe;

beforeEach(async () => {
  await db.recipes.clear();
  await db.scheduleEntries.clear();

  testRecipe = await createRecipe({
    title: 'Test Pasta',
    ingredients: ['pasta', 'sauce'],
    instructions: ['Cook pasta', 'Add sauce'],
  });
});

describe('scheduleService', () => {
  describe('addToSchedule', () => {
    it('creates a schedule entry', async () => {
      const entry = await addToSchedule(testRecipe.id, '2026-02-11', 'dinner');
      expect(entry.id).toBeDefined();
      expect(entry.recipeId).toBe(testRecipe.id);
      expect(entry.date).toBe('2026-02-11');
      expect(entry.mealType).toBe('dinner');
    });

    it('does NOT update recipe lastCookedDate (recency computed from schedule history)', async () => {
      await addToSchedule(testRecipe.id, '2026-02-11', 'dinner');

      const updated = await getRecipeById(testRecipe.id);
      expect(updated!.lastCookedDate).toBeUndefined();
    });

    it('replaces existing entry at same slot', async () => {
      const recipe2 = await createRecipe({
        title: 'Another Recipe',
        ingredients: [],
        instructions: [],
      });

      await addToSchedule(testRecipe.id, '2026-02-11', 'dinner');
      await addToSchedule(recipe2.id, '2026-02-11', 'dinner');

      const entries = await getEntriesForDate('2026-02-11');
      const dinnerEntries = entries.filter((e) => e.mealType === 'dinner');
      expect(dinnerEntries).toHaveLength(1);
      expect(dinnerEntries[0].recipeId).toBe(recipe2.id);
    });
  });

  describe('removeFromSchedule', () => {
    it('removes a schedule entry', async () => {
      const entry = await addToSchedule(testRecipe.id, '2026-02-11', 'lunch');
      await removeFromSchedule(entry.id);

      expect(await getScheduleEntryCount()).toBe(0);
    });

    it('does NOT affect recipe lastCookedDate (recency computed from schedule history)', async () => {
      const entry = await addToSchedule(testRecipe.id, '2026-02-11', 'dinner');
      await removeFromSchedule(entry.id);

      const recipe = await getRecipeById(testRecipe.id);
      expect(recipe!.lastCookedDate).toBeUndefined();
    });
  });

  describe('getScheduleEntries', () => {
    it('returns entries in date range', async () => {
      await addToSchedule(testRecipe.id, '2026-02-10', 'lunch');
      await addToSchedule(testRecipe.id, '2026-02-12', 'dinner');
      await addToSchedule(testRecipe.id, '2026-02-15', 'lunch');

      const entries = await getScheduleEntries('2026-02-10', '2026-02-14');
      expect(entries).toHaveLength(2);
    });
  });

  describe('getEntriesForDate', () => {
    it('returns all entries for a specific date', async () => {
      await addToSchedule(testRecipe.id, '2026-02-11', 'lunch');
      await addToSchedule(testRecipe.id, '2026-02-11', 'dinner');

      const entries = await getEntriesForDate('2026-02-11');
      expect(entries).toHaveLength(2);
    });

    it('returns empty for date with no entries', async () => {
      const entries = await getEntriesForDate('2099-01-01');
      expect(entries).toHaveLength(0);
    });
  });

  describe('getEntriesByRecipe', () => {
    it('returns all schedule entries for a recipe', async () => {
      await addToSchedule(testRecipe.id, '2026-02-11', 'lunch');
      await addToSchedule(testRecipe.id, '2026-02-12', 'dinner');

      const entries = await getEntriesByRecipe(testRecipe.id);
      expect(entries).toHaveLength(2);
    });
  });

  describe('getScheduleForWeek', () => {
    it('returns populated week schedule', async () => {
      await addToSchedule(testRecipe.id, '2026-02-10', 'dinner');
      await addToSchedule(testRecipe.id, '2026-02-12', 'lunch');

      const week = await getScheduleForWeek('2026-02-10', '2026-02-16');

      expect(week['2026-02-10']).toBeDefined();
      expect(week['2026-02-10'].dinner).toBeDefined();
      expect(week['2026-02-10'].dinner!.recipe!.title).toBe('Test Pasta');

      expect(week['2026-02-12']).toBeDefined();
      expect(week['2026-02-12'].lunch).toBeDefined();
    });

    it('returns empty object for week with no entries', async () => {
      const week = await getScheduleForWeek('2099-01-01', '2099-01-07');
      expect(Object.keys(week)).toHaveLength(0);
    });
  });
});
