/**
 * Sprint 8 Tests
 *
 * Tests for:
 * - Bulk delete recipes
 * - Bulk assign tags to recipes
 * - Schedule swapMeals (drag-and-drop backend)
 * - MealSlot ID encode/decode
 * - i18n Sprint 8 key parity (en.json == de.json)
 */

import { describe, test, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/database';
import {
  createRecipe,
  getRecipes,
  bulkDeleteRecipes,
  bulkAssignTag,
  getAllTags,
} from '@/lib/recipeService';
import {
  addToSchedule,
  swapMeals,
  getScheduleForWeek,
} from '@/lib/scheduleService';
import {
  encodeMealSlotId,
  decodeMealSlotId,
} from '@/components/schedule/MealSlot';

// Reset database before each test
beforeEach(async () => {
  await db.delete();
  await db.open();
});

// ─── Bulk Delete ────────────────────────────────────────────────

describe('bulkDeleteRecipes', () => {
  test('deletes multiple recipes at once', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    const r2 = await createRecipe({ title: 'R2', ingredients: ['a'], instructions: ['b'] });
    const r3 = await createRecipe({ title: 'R3', ingredients: ['a'], instructions: ['b'] });

    await bulkDeleteRecipes([r1.id, r2.id]);

    const remaining = await getRecipes();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(r3.id);
  });

  test('handles empty ID array gracefully', async () => {
    await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    await bulkDeleteRecipes([]);
    const remaining = await getRecipes();
    expect(remaining).toHaveLength(1);
  });

  test('handles non-existent IDs without error', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    await bulkDeleteRecipes(['nonexistent-id', r1.id]);
    const remaining = await getRecipes();
    expect(remaining).toHaveLength(0);
  });

  test('deletes all recipes when all IDs provided', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    const r2 = await createRecipe({ title: 'R2', ingredients: ['a'], instructions: ['b'] });
    await bulkDeleteRecipes([r1.id, r2.id]);
    const remaining = await getRecipes();
    expect(remaining).toHaveLength(0);
  });
});

// ─── Bulk Assign Tag ────────────────────────────────────────────

describe('bulkAssignTag', () => {
  test('assigns tag to multiple recipes', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    const r2 = await createRecipe({ title: 'R2', ingredients: ['a'], instructions: ['b'] });
    const r3 = await createRecipe({ title: 'R3', ingredients: ['a'], instructions: ['b'] });

    await bulkAssignTag([r1.id, r2.id], 'quick');

    const recipes = await getRecipes();
    const tagged = recipes.filter(r => (r.tags || []).includes('quick'));
    expect(tagged).toHaveLength(2);
    // R3 should not have the tag
    const r3Updated = recipes.find(r => r.id === r3.id);
    expect(r3Updated?.tags || []).not.toContain('quick');
  });

  test('does not duplicate existing tags', async () => {
    const r1 = await createRecipe({
      title: 'R1', ingredients: ['a'], instructions: ['b'],
      tags: ['quick'],
    });

    await bulkAssignTag([r1.id], 'quick');

    const recipes = await getRecipes();
    const r1Updated = recipes.find(r => r.id === r1.id);
    const quickCount = (r1Updated?.tags || []).filter(t => t === 'quick').length;
    expect(quickCount).toBe(1);
  });

  test('adds tag alongside existing tags', async () => {
    const r1 = await createRecipe({
      title: 'R1', ingredients: ['a'], instructions: ['b'],
      tags: ['italian'],
    });

    await bulkAssignTag([r1.id], 'dinner');

    const recipes = await getRecipes();
    const r1Updated = recipes.find(r => r.id === r1.id);
    expect(r1Updated?.tags).toContain('italian');
    expect(r1Updated?.tags).toContain('dinner');
  });

  test('updates allTags after bulk assign', async () => {
    await createRecipe({ title: 'R1', ingredients: ['a'], instructions: ['b'] });
    await createRecipe({ title: 'R2', ingredients: ['a'], instructions: ['b'] });

    await bulkAssignTag(
      (await getRecipes()).map(r => r.id),
      'new-tag'
    );

    const tags = await getAllTags();
    expect(tags).toContain('new-tag');
  });
});

// ─── Schedule swapMeals ─────────────────────────────────────────

describe('swapMeals', () => {
  test('swaps two filled slots', async () => {
    const r1 = await createRecipe({ title: 'Pasta', ingredients: ['pasta'], instructions: ['boil'] });
    const r2 = await createRecipe({ title: 'Salad', ingredients: ['lettuce'], instructions: ['toss'] });

    await addToSchedule(r1.id, '2026-02-16', 'lunch');
    await addToSchedule(r2.id, '2026-02-16', 'dinner');

    await swapMeals('2026-02-16', 'lunch', '2026-02-16', 'dinner');

    const schedule = await getScheduleForWeek('2026-02-16', '2026-02-22');
    expect(schedule['2026-02-16']?.lunch?.recipe?.title).toBe('Salad');
    expect(schedule['2026-02-16']?.dinner?.recipe?.title).toBe('Pasta');
  });

  test('moves filled slot to empty slot', async () => {
    const r1 = await createRecipe({ title: 'Pasta', ingredients: ['pasta'], instructions: ['boil'] });

    await addToSchedule(r1.id, '2026-02-16', 'lunch');

    await swapMeals('2026-02-16', 'lunch', '2026-02-17', 'dinner');

    const schedule = await getScheduleForWeek('2026-02-16', '2026-02-22');
    expect(schedule['2026-02-16']?.lunch).toBeUndefined();
    expect(schedule['2026-02-17']?.dinner?.recipe?.title).toBe('Pasta');
  });

  test('does nothing when source slot is empty', async () => {
    const r1 = await createRecipe({ title: 'Pasta', ingredients: ['pasta'], instructions: ['boil'] });
    await addToSchedule(r1.id, '2026-02-16', 'dinner');

    // Source is empty lunch
    await swapMeals('2026-02-16', 'lunch', '2026-02-16', 'dinner');

    const schedule = await getScheduleForWeek('2026-02-16', '2026-02-22');
    // Dinner should remain unchanged
    expect(schedule['2026-02-16']?.dinner?.recipe?.title).toBe('Pasta');
  });

  test('moves across different days', async () => {
    const r1 = await createRecipe({ title: 'Steak', ingredients: ['beef'], instructions: ['grill'] });
    await addToSchedule(r1.id, '2026-02-16', 'dinner');

    await swapMeals('2026-02-16', 'dinner', '2026-02-20', 'lunch');

    const schedule = await getScheduleForWeek('2026-02-16', '2026-02-22');
    expect(schedule['2026-02-16']?.dinner).toBeUndefined();
    expect(schedule['2026-02-20']?.lunch?.recipe?.title).toBe('Steak');
  });
});

// ─── MealSlot ID Encoding ───────────────────────────────────────

describe('MealSlot ID encode/decode', () => {
  test('encodes date and mealType', () => {
    const id = encodeMealSlotId('2026-02-16', 'lunch');
    expect(id).toBe('2026-02-16__lunch');
  });

  test('decodes to original date and mealType', () => {
    const result = decodeMealSlotId('2026-02-16__dinner');
    expect(result).toEqual({ date: '2026-02-16', mealType: 'dinner' });
  });

  test('roundtrips correctly', () => {
    const original = { date: '2026-03-01', mealType: 'lunch' as const };
    const encoded = encodeMealSlotId(original.date, original.mealType);
    const decoded = decodeMealSlotId(encoded);
    expect(decoded).toEqual(original);
  });
});

// ─── i18n Sprint 8 Key Parity ───────────────────────────────────

describe('i18n Sprint 8 keys', () => {
  test('en.json has bulk section', async () => {
    const mod = await import('@/i18n/en.json');
    const en = mod.default || mod;
    expect(en).toHaveProperty('bulk');
    expect((en as any).bulk).toHaveProperty('selectMode');
    expect((en as any).bulk).toHaveProperty('deleteTitle');
    expect((en as any).bulk).toHaveProperty('assignTagTitle');
  });

  test('de.json has bulk section', async () => {
    const mod = await import('@/i18n/de.json');
    const de = mod.default || mod;
    expect(de).toHaveProperty('bulk');
    expect((de as any).bulk).toHaveProperty('selectMode');
    expect((de as any).bulk).toHaveProperty('deleteTitle');
    expect((de as any).bulk).toHaveProperty('assignTagTitle');
  });

  test('en.json has schedule.dragMeal key', async () => {
    const mod = await import('@/i18n/en.json');
    const en = mod.default || mod;
    expect((en as any).schedule).toHaveProperty('dragMeal');
  });

  test('de.json has schedule.dragMeal key', async () => {
    const mod = await import('@/i18n/de.json');
    const de = mod.default || mod;
    expect((de as any).schedule).toHaveProperty('dragMeal');
  });

  test('en.json and de.json bulk keys match', async () => {
    const enMod = await import('@/i18n/en.json');
    const deMod = await import('@/i18n/de.json');
    const en = (enMod.default || enMod) as Record<string, any>;
    const de = (deMod.default || deMod) as Record<string, any>;

    const enBulkKeys = Object.keys(en.bulk).sort();
    const deBulkKeys = Object.keys(de.bulk).sort();
    expect(enBulkKeys).toEqual(deBulkKeys);
  });

  test('en.json and de.json have matching top-level key count', async () => {
    const enMod = await import('@/i18n/en.json');
    const deMod = await import('@/i18n/de.json');
    const en = (enMod.default || enMod) as Record<string, unknown>;
    const de = (deMod.default || deMod) as Record<string, unknown>;

    const getKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
      return Object.entries(obj).flatMap(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return getKeys(value as Record<string, unknown>, fullKey);
        }
        return [fullKey];
      });
    };

    const enKeys = getKeys(en).sort();
    const deKeys = getKeys(de).sort();
    expect(enKeys).toEqual(deKeys);
  });
});
