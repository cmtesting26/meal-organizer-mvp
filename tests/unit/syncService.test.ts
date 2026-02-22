/**
 * Sync Service Tests (Sprint 10)
 *
 * Tests for the sync-aware data access layer:
 * - Local CRUD operations (recipes + schedules)
 * - Sync queue operations (enqueue, process)
 * - Conflict resolution (last-write-wins)
 * - Backoff delay calculations
 * - Cloud-local mapping helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/database';
import {
  getRecipes,
  getRecipeById,
  searchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeCount,
  getAllTags,
  filterRecipesByTag,
  bulkDeleteRecipes,
  bulkAssignTag,
  addToSchedule,
  removeFromSchedule,
  getScheduleEntries,
  getEntriesForDate,
  getScheduleForWeek,
  swapMeals,
  getScheduleEntryCount,
  enqueueSyncOperation,
  getSyncQueueLength,
  getBackoffDelay,
  type SyncQueueItem,
} from '@/lib/syncService';

// Mock supabase as not configured (local-only mode for tests)
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: null,
  getSupabase: () => {
    throw new Error('Supabase not configured');
  },
}));

beforeEach(async () => {
  await db.recipes.clear();
  await db.scheduleEntries.clear();
  await db.syncQueue.clear();
});

// ---------------------------------------------------------------------------
// Recipe CRUD
// ---------------------------------------------------------------------------

describe('syncService — Recipe CRUD', () => {
  it('creates a recipe with generated ID and timestamps', async () => {
    const recipe = await createRecipe({
      title: 'Test Pasta',
      ingredients: ['pasta', 'sauce'],
      instructions: ['boil', 'mix'],
      tags: ['italian'],
    });

    expect(recipe.id).toBeDefined();
    expect(recipe.title).toBe('Test Pasta');
    expect(recipe.createdAt).toBeDefined();
    expect(recipe.updatedAt).toBeDefined();
    expect(recipe.tags).toEqual(['italian']);
  });

  it('gets all recipes sorted by createdAt (newest first)', async () => {
    await createRecipe({ title: 'A Recipe', ingredients: [], instructions: [] });
    await new Promise((r) => setTimeout(r, 10));
    await createRecipe({ title: 'B Recipe', ingredients: [], instructions: [] });

    const recipes = await getRecipes();
    expect(recipes).toHaveLength(2);
    expect(recipes[0].title).toBe('B Recipe');
  });

  it('gets recipes sorted by title', async () => {
    await createRecipe({ title: 'Zucchini', ingredients: [], instructions: [] });
    await createRecipe({ title: 'Apple Pie', ingredients: [], instructions: [] });

    const recipes = await getRecipes('title');
    expect(recipes[0].title).toBe('Apple Pie');
    expect(recipes[1].title).toBe('Zucchini');
  });

  it('gets recipe by ID', async () => {
    const created = await createRecipe({ title: 'Find Me', ingredients: [], instructions: [] });
    const found = await getRecipeById(created.id);
    expect(found?.title).toBe('Find Me');
  });

  it('returns undefined for non-existent recipe', async () => {
    const found = await getRecipeById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('searches recipes by title', async () => {
    await createRecipe({ title: 'Chicken Curry', ingredients: ['chicken'], instructions: [] });
    await createRecipe({ title: 'Beef Stew', ingredients: ['beef'], instructions: [] });

    const results = await searchRecipes('chicken');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Chicken Curry');
  });

  it('searches recipes by ingredient', async () => {
    await createRecipe({ title: 'Salad', ingredients: ['lettuce', 'tomato'], instructions: [] });
    const results = await searchRecipes('tomato');
    expect(results).toHaveLength(1);
  });

  it('returns all recipes for empty search query', async () => {
    await createRecipe({ title: 'A', ingredients: [], instructions: [] });
    await createRecipe({ title: 'B', ingredients: [], instructions: [] });
    const results = await searchRecipes('');
    expect(results).toHaveLength(2);
  });

  it('updates a recipe', async () => {
    const recipe = await createRecipe({ title: 'Old Title', ingredients: [], instructions: [] });
    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));
    await updateRecipe(recipe.id, { title: 'New Title' });
    const updated = await getRecipeById(recipe.id);
    expect(updated?.title).toBe('New Title');
    expect(updated?.updatedAt).toBeDefined();
  });

  it('deletes a recipe', async () => {
    const recipe = await createRecipe({ title: 'Delete Me', ingredients: [], instructions: [] });
    await deleteRecipe(recipe.id);
    const found = await getRecipeById(recipe.id);
    expect(found).toBeUndefined();
  });

  it('gets recipe count', async () => {
    await createRecipe({ title: 'A', ingredients: [], instructions: [] });
    await createRecipe({ title: 'B', ingredients: [], instructions: [] });
    const count = await getRecipeCount();
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

describe('syncService — Tags', () => {
  it('gets all unique tags sorted', async () => {
    await createRecipe({ title: 'A', ingredients: [], instructions: [], tags: ['italian', 'quick'] });
    await createRecipe({ title: 'B', ingredients: [], instructions: [], tags: ['quick', 'vegan'] });

    const tags = await getAllTags();
    expect(tags).toEqual(['italian', 'quick', 'vegan']);
  });

  it('filters recipes by tag', async () => {
    await createRecipe({ title: 'Pasta', ingredients: [], instructions: [], tags: ['italian'] });
    await createRecipe({ title: 'Tofu', ingredients: [], instructions: [], tags: ['vegan'] });

    const filtered = await filterRecipesByTag('italian');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Pasta');
  });

  it('bulk assigns a tag', async () => {
    const a = await createRecipe({ title: 'A', ingredients: [], instructions: [], tags: [] });
    const b = await createRecipe({ title: 'B', ingredients: [], instructions: [], tags: ['existing'] });

    await bulkAssignTag([a.id, b.id], 'new-tag');

    const updatedA = await getRecipeById(a.id);
    const updatedB = await getRecipeById(b.id);
    expect(updatedA?.tags).toContain('new-tag');
    expect(updatedB?.tags).toContain('new-tag');
    expect(updatedB?.tags).toContain('existing');
  });

  it('does not duplicate tags on bulk assign', async () => {
    const a = await createRecipe({ title: 'A', ingredients: [], instructions: [], tags: ['dup'] });
    await bulkAssignTag([a.id], 'dup');

    const updated = await getRecipeById(a.id);
    expect(updated?.tags?.filter((t) => t === 'dup')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Quick Log
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bulk Delete
// ---------------------------------------------------------------------------

describe('syncService — Bulk Delete', () => {
  it('deletes multiple recipes', async () => {
    const a = await createRecipe({ title: 'A', ingredients: [], instructions: [] });
    const b = await createRecipe({ title: 'B', ingredients: [], instructions: [] });
    await createRecipe({ title: 'C', ingredients: [], instructions: [] });

    await bulkDeleteRecipes([a.id, b.id]);
    const remaining = await getRecipes();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('C');
  });
});

// ---------------------------------------------------------------------------
// Schedule CRUD
// ---------------------------------------------------------------------------

describe('syncService — Schedule CRUD', () => {
  it('adds a meal to schedule', async () => {
    const recipe = await createRecipe({ title: 'Dinner', ingredients: [], instructions: [] });
    const entry = await addToSchedule(recipe.id, '2026-02-12', 'dinner');

    expect(entry.id).toBeDefined();
    expect(entry.recipeId).toBe(recipe.id);
    expect(entry.date).toBe('2026-02-12');
    expect(entry.mealType).toBe('dinner');
  });

  it('replaces existing entry at same slot', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: [], instructions: [] });
    const r2 = await createRecipe({ title: 'R2', ingredients: [], instructions: [] });

    await addToSchedule(r1.id, '2026-02-12', 'lunch');
    await addToSchedule(r2.id, '2026-02-12', 'lunch');

    const entries = await getEntriesForDate('2026-02-12');
    const lunchEntries = entries.filter((e) => e.mealType === 'lunch');
    expect(lunchEntries).toHaveLength(1);
    expect(lunchEntries[0].recipeId).toBe(r2.id);
  });

  it('removes from schedule', async () => {
    const recipe = await createRecipe({ title: 'Remove', ingredients: [], instructions: [] });
    const entry = await addToSchedule(recipe.id, '2026-02-12', 'dinner');
    await removeFromSchedule(entry.id);

    const entries = await getEntriesForDate('2026-02-12');
    expect(entries).toHaveLength(0);
  });

  it('gets schedule entries for date range', async () => {
    const recipe = await createRecipe({ title: 'R', ingredients: [], instructions: [] });
    await addToSchedule(recipe.id, '2026-02-10', 'lunch');
    await addToSchedule(recipe.id, '2026-02-12', 'dinner');
    await addToSchedule(recipe.id, '2026-02-15', 'lunch');

    const entries = await getScheduleEntries('2026-02-10', '2026-02-12');
    expect(entries).toHaveLength(2);
  });

  it('gets populated week schedule', async () => {
    const recipe = await createRecipe({ title: 'Pasta', ingredients: [], instructions: [] });
    await addToSchedule(recipe.id, '2026-02-10', 'dinner');

    const week = await getScheduleForWeek('2026-02-10', '2026-02-16');
    expect(week['2026-02-10']?.dinner?.recipe?.title).toBe('Pasta');
  });

  it('swaps two meals', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: [], instructions: [] });
    const r2 = await createRecipe({ title: 'R2', ingredients: [], instructions: [] });
    await addToSchedule(r1.id, '2026-02-10', 'lunch');
    await addToSchedule(r2.id, '2026-02-11', 'dinner');

    await swapMeals('2026-02-10', 'lunch', '2026-02-11', 'dinner');

    const week = await getScheduleForWeek('2026-02-10', '2026-02-11');
    expect(week['2026-02-10']?.lunch?.recipe?.title).toBe('R2');
    expect(week['2026-02-11']?.dinner?.recipe?.title).toBe('R1');
  });

  it('moves meal to empty slot', async () => {
    const recipe = await createRecipe({ title: 'Move Me', ingredients: [], instructions: [] });
    await addToSchedule(recipe.id, '2026-02-10', 'lunch');

    await swapMeals('2026-02-10', 'lunch', '2026-02-11', 'dinner');

    const week = await getScheduleForWeek('2026-02-10', '2026-02-11');
    expect(week['2026-02-10']?.lunch).toBeUndefined();
    expect(week['2026-02-11']?.dinner?.recipe?.title).toBe('Move Me');
  });

  it('gets schedule entry count', async () => {
    const recipe = await createRecipe({ title: 'R', ingredients: [], instructions: [] });
    await addToSchedule(recipe.id, '2026-02-10', 'lunch');
    await addToSchedule(recipe.id, '2026-02-11', 'dinner');
    const count = await getScheduleEntryCount();
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Sync Queue
// ---------------------------------------------------------------------------

describe('syncService — Sync Queue', () => {
  it('enqueues a sync operation', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'test-1', title: 'Test' });
    const length = await getSyncQueueLength();
    expect(length).toBe(1);
  });

  it('enqueues multiple operations', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1' });
    await enqueueSyncOperation('recipes', 'delete', { id: 'r2' });
    await enqueueSyncOperation('schedule_entries', 'upsert', { id: 's1' });

    const length = await getSyncQueueLength();
    expect(length).toBe(3);
  });

  it('queue items have correct structure', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Test' });
    const items = await db.syncQueue.toArray();

    expect(items).toHaveLength(1);
    expect(items[0].table).toBe('recipes');
    expect(items[0].operation).toBe('upsert');
    expect(items[0].payload).toEqual({ id: 'r1', title: 'Test' });
    expect(items[0].retryCount).toBe(0);
    expect(items[0].timestamp).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Backoff Delay
// ---------------------------------------------------------------------------

describe('syncService — Backoff Delay', () => {
  it('returns base delay ~1s for retry 0', () => {
    const delays = Array.from({ length: 100 }, () => getBackoffDelay(0));
    const avg = delays.reduce((a, b) => a + b, 0) / delays.length;
    expect(avg).toBeGreaterThan(500);
    expect(avg).toBeLessThan(1500);
  });

  it('increases delay exponentially', () => {
    const d0 = getBackoffDelay(0);
    const d3 = getBackoffDelay(3);
    // At retry 3, base delay is 8s (2^3 * 1s), so with jitter it should be 6-10s
    // Just ensure it's significantly larger than retry 0
    expect(d3).toBeGreaterThan(d0);
  });

  it('caps at 60s max', () => {
    const delays = Array.from({ length: 100 }, () => getBackoffDelay(10));
    for (const d of delays) {
      expect(d).toBeLessThanOrEqual(75000); // 60s + 25% jitter max
    }
  });

  it('always returns non-negative', () => {
    for (let i = 0; i < 20; i++) {
      expect(getBackoffDelay(i)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Conflict Resolution (last-write-wins)
// ---------------------------------------------------------------------------

describe('syncService — Conflict Resolution', () => {
  it('newer update overwrites older via updateRecipe', async () => {
    const recipe = await createRecipe({
      title: 'Original',
      ingredients: [],
      instructions: [],
    });

    // First update
    await updateRecipe(recipe.id, { title: 'Update 1' });
    const after1 = await getRecipeById(recipe.id);

    // Second update (simulates another device)
    await new Promise((r) => setTimeout(r, 10));
    await updateRecipe(recipe.id, { title: 'Update 2' });
    const after2 = await getRecipeById(recipe.id);

    expect(after2?.title).toBe('Update 2');
    expect(after2!.updatedAt > after1!.updatedAt).toBe(true);
  });

  it('concurrent recipe creates have distinct IDs', async () => {
    const [a, b] = await Promise.all([
      createRecipe({ title: 'A', ingredients: [], instructions: [] }),
      createRecipe({ title: 'B', ingredients: [], instructions: [] }),
    ]);

    expect(a.id).not.toBe(b.id);
    const count = await getRecipeCount();
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// S10-11: Offline Sync Queue Tests
// ---------------------------------------------------------------------------

describe('syncService — Offline Queue (S10-11)', () => {
  it('queues operations when offline and items persist', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Pasta' });
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r2', title: 'Salad' });
    await enqueueSyncOperation('schedule_entries', 'upsert', { id: 's1', date: '2026-01-01' });

    const queueLen = await getSyncQueueLength();
    expect(queueLen).toBe(3);
  });

  it('queued items have correct structure and order', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    await enqueueSyncOperation('recipes', 'delete', { id: 'r2' });

    const items = await db.syncQueue.orderBy('timestamp').toArray();
    expect(items).toHaveLength(2);

    // First item
    expect(items[0].table).toBe('recipes');
    expect(items[0].operation).toBe('upsert');
    expect(items[0].payload.title).toBe('First');
    expect(items[0].retryCount).toBe(0);

    // Second item — later timestamp
    expect(items[1].table).toBe('recipes');
    expect(items[1].operation).toBe('delete');
    expect(items[1].timestamp >= items[0].timestamp).toBe(true);
  });

  it('queue items survive clear of main tables', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Queued' });
    await db.recipes.clear();
    await db.scheduleEntries.clear();

    const queueLen = await getSyncQueueLength();
    expect(queueLen).toBe(1);
  });

  it('mixed operation types are queued correctly', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Create' });
    await new Promise((r) => setTimeout(r, 5));
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Update' });
    await new Promise((r) => setTimeout(r, 5));
    await enqueueSyncOperation('recipes', 'delete', { id: 'r1' });

    const items = await db.syncQueue.orderBy('timestamp').toArray();
    expect(items).toHaveLength(3);
    expect(items.map(i => i.operation)).toEqual(['upsert', 'upsert', 'delete']);
  });

  it('delete operations are queued for schedule entries', async () => {
    await enqueueSyncOperation('schedule_entries', 'delete', { id: 's1' });

    const items = await db.syncQueue.toArray();
    expect(items).toHaveLength(1);
    expect(items[0].table).toBe('schedule_entries');
    expect(items[0].operation).toBe('delete');
    expect(items[0].payload.id).toBe('s1');
  });

  it('queue can be manually cleared', async () => {
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r1', title: 'Test' });
    await enqueueSyncOperation('recipes', 'upsert', { id: 'r2', title: 'Test2' });
    expect(await getSyncQueueLength()).toBe(2);

    await db.syncQueue.clear();
    expect(await getSyncQueueLength()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// S10-12: Conflict Resolution Tests
// ---------------------------------------------------------------------------

describe('syncService — Conflict Resolution (S10-12)', () => {
  it('later update wins over earlier update (last-write-wins)', async () => {
    const recipe = await createRecipe({ title: 'Original', ingredients: [], instructions: [] });

    // First edit
    await new Promise((r) => setTimeout(r, 10));
    await updateRecipe(recipe.id, { title: 'Edit A' });
    const afterA = await getRecipeById(recipe.id);

    // Second edit (later timestamp)
    await new Promise((r) => setTimeout(r, 10));
    await updateRecipe(recipe.id, { title: 'Edit B' });
    const afterB = await getRecipeById(recipe.id);

    expect(afterB?.title).toBe('Edit B');
    expect(afterB!.updatedAt >= afterA!.updatedAt).toBe(true);
  });

  it('no data corruption from rapid concurrent writes', async () => {
    const recipe = await createRecipe({
      title: 'Base',
      ingredients: ['flour', 'water'],
      instructions: ['mix', 'bake'],
    });

    // Rapid updates to different fields
    await Promise.all([
      updateRecipe(recipe.id, { title: 'Updated Title' }),
      updateRecipe(recipe.id, { tags: ['quick', 'easy'] }),
    ]);

    const result = await getRecipeById(recipe.id);
    expect(result).toBeDefined();
    // At least one update should have applied
    expect(result!.id).toBe(recipe.id);
    // Ingredients and instructions should not be corrupted
    expect(result!.ingredients).toEqual(['flour', 'water']);
    expect(result!.instructions).toEqual(['mix', 'bake']);
  });

  it('delete after update removes the recipe', async () => {
    const recipe = await createRecipe({ title: 'To Delete', ingredients: [], instructions: [] });
    await updateRecipe(recipe.id, { title: 'Updated' });
    await deleteRecipe(recipe.id);

    const result = await getRecipeById(recipe.id);
    expect(result).toBeUndefined();
    expect(await getRecipeCount()).toBe(0);
  });

  it('update after create preserves created data', async () => {
    const recipe = await createRecipe({
      title: 'Created',
      ingredients: ['a', 'b'],
      instructions: ['step 1'],
      tags: ['tag1'],
    });

    await new Promise((r) => setTimeout(r, 5));
    await updateRecipe(recipe.id, { title: 'Updated' });

    const result = await getRecipeById(recipe.id);
    expect(result?.title).toBe('Updated');
    expect(result?.ingredients).toEqual(['a', 'b']);
    expect(result?.instructions).toEqual(['step 1']);
    expect(result?.tags).toEqual(['tag1']);
    expect(result?.createdAt).toBe(recipe.createdAt);
  });

  it('simultaneous schedule entry additions at different slots both persist', async () => {
    const recipe1 = await createRecipe({ title: 'R1', ingredients: [], instructions: [] });
    const recipe2 = await createRecipe({ title: 'R2', ingredients: [], instructions: [] });

    await Promise.all([
      addToSchedule(recipe1.id, '2026-03-01', 'lunch'),
      addToSchedule(recipe2.id, '2026-03-01', 'dinner'),
    ]);

    const entries = await getEntriesForDate('2026-03-01');
    expect(entries).toHaveLength(2);
    const mealTypes = entries.map(e => e.mealType).sort();
    expect(mealTypes).toEqual(['dinner', 'lunch']);
  });

  it('schedule replacement correctly overwrites the slot', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: [], instructions: [] });
    const r2 = await createRecipe({ title: 'R2', ingredients: [], instructions: [] });

    await addToSchedule(r1.id, '2026-03-01', 'lunch');
    await addToSchedule(r2.id, '2026-03-01', 'lunch'); // Replace

    const entries = await getEntriesForDate('2026-03-01');
    const lunchEntries = entries.filter(e => e.mealType === 'lunch');
    expect(lunchEntries).toHaveLength(1);
    expect(lunchEntries[0].recipeId).toBe(r2.id);
  });
});

// ---------------------------------------------------------------------------
// S10-13: Regression — V1.0-1.1 Features via Sync Layer
// ---------------------------------------------------------------------------

describe('syncService — Regression (S10-13)', () => {
  it('recipe CRUD cycle works end-to-end through sync layer', async () => {
    // Create
    const recipe = await createRecipe({
      title: 'Full Cycle',
      ingredients: ['a'],
      instructions: ['do it'],
      tags: ['test'],
    });
    expect(recipe.id).toBeDefined();

    // Read
    const fetched = await getRecipeById(recipe.id);
    expect(fetched?.title).toBe('Full Cycle');

    // Update
    await updateRecipe(recipe.id, { title: 'Updated Cycle' });
    const updated = await getRecipeById(recipe.id);
    expect(updated?.title).toBe('Updated Cycle');

    // Delete
    await deleteRecipe(recipe.id);
    expect(await getRecipeById(recipe.id)).toBeUndefined();
  });

  it('schedule CRUD cycle works end-to-end through sync layer', async () => {
    const recipe = await createRecipe({ title: 'Sched Test', ingredients: [], instructions: [] });

    // Add
    const entry = await addToSchedule(recipe.id, '2026-04-01', 'dinner');
    expect(entry.id).toBeDefined();

    // Read
    const entries = await getScheduleEntries('2026-04-01', '2026-04-01');
    expect(entries).toHaveLength(1);

    // Remove
    await removeFromSchedule(entry.id);
    const after = await getScheduleEntries('2026-04-01', '2026-04-01');
    expect(after).toHaveLength(0);
  });

  it('search and filter work through sync layer', async () => {
    await createRecipe({ title: 'Pasta Carbonara', ingredients: ['pasta', 'egg'], instructions: [], tags: ['italian'] });
    await createRecipe({ title: 'Caesar Salad', ingredients: ['lettuce', 'croutons'], instructions: [], tags: ['salad'] });

    // Search by title
    const pastaResults = await searchRecipes('pasta');
    expect(pastaResults).toHaveLength(1);
    expect(pastaResults[0].title).toBe('Pasta Carbonara');

    // Search by ingredient
    const eggResults = await searchRecipes('egg');
    expect(eggResults).toHaveLength(1);

    // Filter by tag
    const italianResults = await filterRecipesByTag('italian');
    expect(italianResults).toHaveLength(1);
    expect(italianResults[0].title).toBe('Pasta Carbonara');

    // Get all tags
    const tags = await getAllTags();
    expect(tags).toEqual(['italian', 'salad']);
  });

  it('bulk operations work through sync layer', async () => {
    const r1 = await createRecipe({ title: 'R1', ingredients: [], instructions: [] });
    const r2 = await createRecipe({ title: 'R2', ingredients: [], instructions: [] });
    const r3 = await createRecipe({ title: 'R3', ingredients: [], instructions: [] });

    // Bulk tag
    await bulkAssignTag([r1.id, r2.id], 'batch');
    const tagged = await filterRecipesByTag('batch');
    expect(tagged).toHaveLength(2);

    // Bulk delete
    await bulkDeleteRecipes([r1.id, r2.id]);
    expect(await getRecipeCount()).toBe(1);
    expect(await getRecipeById(r3.id)).toBeDefined();
  });

  it('drag-and-drop swap works through sync layer', async () => {
    const r1 = await createRecipe({ title: 'Swap1', ingredients: [], instructions: [] });
    const r2 = await createRecipe({ title: 'Swap2', ingredients: [], instructions: [] });

    await addToSchedule(r1.id, '2026-05-01', 'lunch');
    await addToSchedule(r2.id, '2026-05-01', 'dinner');

    await swapMeals('2026-05-01', 'lunch', '2026-05-01', 'dinner');

    const schedule = await getScheduleForWeek('2026-05-01', '2026-05-01');
    expect(schedule['2026-05-01']?.lunch?.recipe?.title).toBe('Swap2');
    expect(schedule['2026-05-01']?.dinner?.recipe?.title).toBe('Swap1');
  });

  it('getScheduleForWeek returns populated data through sync layer', async () => {
    const r1 = await createRecipe({ title: 'Week Test', ingredients: ['x'], instructions: ['y'] });
    await addToSchedule(r1.id, '2026-06-01', 'lunch');

    const schedule = await getScheduleForWeek('2026-06-01', '2026-06-07');
    expect(schedule['2026-06-01']?.lunch).toBeDefined();
    expect(schedule['2026-06-01']?.lunch?.recipe?.title).toBe('Week Test');
    expect(schedule['2026-06-01']?.lunch?.recipe?.ingredients).toEqual(['x']);
  });
});
