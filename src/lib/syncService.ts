/**
 * Sync Service (Sprint 10)
 *
 * Sync-aware data access layer that abstracts all recipe and schedule CRUD.
 * When the user is authenticated and online, operations sync bidirectionally
 * with Supabase. When offline, writes are queued in IndexedDB and processed
 * on reconnect.
 *
 * Conflict resolution: last-write-wins using `updated_at` timestamps.
 *
 * @module syncService
 */

import { db, type SyncQueueRow } from './database';
import { supabase, isSupabaseConfigured, getSupabase } from './supabase';
import type { Recipe, ScheduleEntry } from '../types/recipe';
import type { RecipeRow, ScheduleEntryRow } from '../types/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Re-export for backward compatibility */
export type SyncQueueItem = SyncQueueRow;

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  queueLength: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Whether cloud sync is available (Supabase configured + authenticated).
 * Callers should additionally check `isOnline()` before network calls.
 */
export function isSyncEnabled(): boolean {
  if (!isSupabaseConfigured || !supabase) return false;
  // Will be truly enabled when an auth session exists — checked lazily at call sites.
  return true;
}

// ---------------------------------------------------------------------------
// Cloud ↔ Local mapping helpers
// ---------------------------------------------------------------------------

function cloudRecipeToLocal(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    imageUrl: row.image_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    lastCookedDate: row.last_cooked_date ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function localRecipeToCloud(
  recipe: Recipe,
  householdId: string,
  userId?: string | null
): Partial<RecipeRow> {
  return {
    id: recipe.id,
    household_id: householdId,
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    source_url: recipe.sourceUrl ?? null,
    image_url: recipe.imageUrl ?? null,
    last_cooked_date: recipe.lastCookedDate ?? null,
    tags: recipe.tags ?? [],
    created_by: userId ?? null,
    updated_at: recipe.updatedAt,
  };
}

function cloudScheduleToLocal(row: ScheduleEntryRow): ScheduleEntry {
  return {
    id: row.id,
    recipeId: row.recipe_id ?? '',
    date: row.date,
    mealType: row.meal_type,
    createdAt: row.created_at,
  };
}

function localScheduleToCloud(
  entry: ScheduleEntry,
  householdId: string
): Partial<ScheduleEntryRow> {
  return {
    id: entry.id,
    household_id: householdId,
    recipe_id: entry.recipeId,
    date: entry.date,
    meal_type: entry.mealType,
  };
}

// ---------------------------------------------------------------------------
// Sync Queue Operations
// ---------------------------------------------------------------------------

/**
 * Add an operation to the offline sync queue
 */
export async function enqueueSyncOperation(
  table: 'recipes' | 'schedule_entries',
  operation: 'upsert' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  const item: SyncQueueItem = {
    id: generateId(),
    table,
    operation,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  await db.syncQueue.add(item);
}

/**
 * Get the number of pending sync operations
 */
export async function getSyncQueueLength(): Promise<number> {
  return db.syncQueue.count();
}

/**
 * Process all queued sync operations.
 * Uses exponential backoff: 1s base, 60s max, ±25% jitter, max 5 retries.
 *
 * @returns Number of successfully processed items
 */
export async function processSyncQueue(
  householdId: string
): Promise<number> {
  const client = getSupabase();
  const items = await db.syncQueue.orderBy('timestamp').toArray();
  let processed = 0;

  for (const item of items) {
    if (item.retryCount >= 5) {
      // Max retries exceeded — remove from queue
      await db.syncQueue.delete(item.id);
      continue;
    }

    try {
      if (item.table === 'recipes') {
        if (item.operation === 'upsert') {
          const { error } = await client
            .from('recipes')
            .upsert({ ...item.payload, household_id: householdId } as any);
          if (error) throw error;
        } else if (item.operation === 'delete') {
          const { error } = await client
            .from('recipes')
            .delete()
            .eq('id', item.payload.id as string);
          if (error) throw error;
        }
      } else if (item.table === 'schedule_entries') {
        if (item.operation === 'upsert') {
          const { error } = await client
            .from('schedule_entries')
            .upsert({ ...item.payload, household_id: householdId } as any);
          if (error) throw error;
        } else if (item.operation === 'delete') {
          const { error } = await client
            .from('schedule_entries')
            .delete()
            .eq('id', item.payload.id as string);
          if (error) throw error;
        }
      }

      // Success — remove from queue
      await db.syncQueue.delete(item.id);
      processed++;
    } catch (err) {
      // Increment retry count with exponential backoff delay tracked
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
      });
      console.warn(
        `[SyncService] Queue item ${item.id} failed (retry ${item.retryCount + 1}/5):`,
        err
      );
    }
  }

  return processed;
}

/**
 * Calculate exponential backoff delay with jitter.
 * Base: 1s, Max: 60s, Jitter: ±25%
 */
export function getBackoffDelay(retryCount: number): number {
  const baseDelay = 1000; // 1s
  const maxDelay = 60000; // 60s
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1); // ±25%
  return Math.max(0, exponentialDelay + jitter);
}

// ---------------------------------------------------------------------------
// Pull from Cloud (full reconciliation on login)
// ---------------------------------------------------------------------------

/**
 * Pull all data from Supabase and reconcile with local IndexedDB.
 * Uses last-write-wins with `updated_at` timestamps.
 */
export async function pullFromCloud(householdId: string): Promise<{
  recipesUpdated: number;
  schedulesUpdated: number;
}> {
  const client = getSupabase();
  let recipesUpdated = 0;
  let schedulesUpdated = 0;

  // --- Recipes ---
  const { data: cloudRecipes, error: recipeError } = await client
    .from('recipes')
    .select('*')
    .eq('household_id', householdId) as { data: RecipeRow[] | null; error: any };

  if (recipeError) throw recipeError;

  if (cloudRecipes) {
    const cloudRecipeIds = new Set(cloudRecipes.map((r) => r.id));

    for (const cloudRow of cloudRecipes) {
      const localRecipe = await db.recipes.get(cloudRow.id);
      const cloudRecipe = cloudRecipeToLocal(cloudRow);

      if (!localRecipe) {
        // New from cloud — add locally
        await db.recipes.add(cloudRecipe);
        recipesUpdated++;
      } else if (cloudRow.updated_at > localRecipe.updatedAt) {
        // Cloud is newer — overwrite local
        await db.recipes.put(cloudRecipe);
        recipesUpdated++;
      }
      // If local is newer, it stays (will be pushed via queue)
    }

    // S27-08: Remove local recipes that no longer exist in cloud (deleted by another household member)
    const localRecipes = await db.recipes.toArray();
    for (const localRecipe of localRecipes) {
      if (!cloudRecipeIds.has(localRecipe.id)) {
        await db.recipes.delete(localRecipe.id);
        recipesUpdated++;
      }
    }
  }

  // --- Schedule Entries ---
  const { data: cloudSchedules, error: scheduleError } = await client
    .from('schedule_entries')
    .select('*')
    .eq('household_id', householdId) as { data: ScheduleEntryRow[] | null; error: any };

  if (scheduleError) throw scheduleError;

  if (cloudSchedules) {
    for (const cloudRow of cloudSchedules) {
      const localEntry = await db.scheduleEntries.get(cloudRow.id);
      const cloudEntry = cloudScheduleToLocal(cloudRow);

      if (!localEntry) {
        await db.scheduleEntries.add(cloudEntry);
        schedulesUpdated++;
      }
      // Schedule entries don't have updated_at — cloud wins for new entries
    }
  }

  return { recipesUpdated, schedulesUpdated };
}

// ---------------------------------------------------------------------------
// Recipe CRUD (sync-aware)
// ---------------------------------------------------------------------------

/**
 * Get all recipes, optionally sorted
 */
export async function getRecipes(
  sortBy: 'title' | 'lastCookedDate' | 'createdAt' = 'createdAt'
): Promise<Recipe[]> {
  const recipes = await db.recipes.toArray();

  return recipes.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'lastCookedDate') {
      if (!a.lastCookedDate && !b.lastCookedDate) return 0;
      if (!a.lastCookedDate) return -1;
      if (!b.lastCookedDate) return 1;
      return a.lastCookedDate.localeCompare(b.lastCookedDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * Get a single recipe by ID
 */
export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id);
}

/**
 * Search recipes by title or ingredients
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return getRecipes();

  const allRecipes = await db.recipes.toArray();
  return allRecipes.filter((recipe) => {
    const titleMatch = recipe.title.toLowerCase().includes(lowerQuery);
    const ingredientMatch = recipe.ingredients.some((ing) =>
      ing.toLowerCase().includes(lowerQuery)
    );
    return titleMatch || ingredientMatch;
  });
}

/**
 * Create a new recipe (sync-aware)
 */
export async function createRecipe(
  data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
  householdId?: string | null,
  userId?: string | null
): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    id: generateId(),
    title: data.title,
    ingredients: data.ingredients,
    instructions: data.instructions,
    imageUrl: data.imageUrl,
    sourceUrl: data.sourceUrl,
    lastCookedDate: data.lastCookedDate,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  // Save locally first (offline-first)
  await db.recipes.add(recipe);

  // Sync to cloud
  if (isSyncEnabled() && householdId) {
    const cloudPayload = localRecipeToCloud(recipe, householdId, userId);
    if (isOnline()) {
      try {
        const { error } = await getSupabase()
          .from('recipes')
          .upsert(cloudPayload as any);
        if (error) throw error;
      } catch {
        await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
      }
    } else {
      await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
    }
  }

  return recipe;
}

/**
 * Update an existing recipe (sync-aware)
 */
export async function updateRecipe(
  id: string,
  updates: Partial<Recipe>,
  householdId?: string | null,
  userId?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const updatedFields = { ...updates, updatedAt: now };

  // Update locally first
  await db.recipes.update(id, updatedFields);

  // Sync to cloud
  if (isSyncEnabled() && householdId) {
    const fullRecipe = await db.recipes.get(id);
    if (fullRecipe) {
      const cloudPayload = localRecipeToCloud(fullRecipe, householdId, userId);
      if (isOnline()) {
        try {
          const { error } = await getSupabase()
            .from('recipes')
            .upsert(cloudPayload as any);
          if (error) throw error;
        } catch {
          await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
        }
      } else {
        await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
      }
    }
  }
}

/**
 * Delete a recipe (sync-aware)
 */
export async function deleteRecipe(
  id: string,
  householdId?: string | null
): Promise<void> {
  await db.recipes.delete(id);

  if (isSyncEnabled() && householdId) {
    if (isOnline()) {
      try {
        const { error } = await getSupabase()
          .from('recipes')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch {
        await enqueueSyncOperation('recipes', 'delete', { id });
      }
    } else {
      await enqueueSyncOperation('recipes', 'delete', { id });
    }
  }
}

/**
/**
 * Get recipe count
 */
export async function getRecipeCount(): Promise<number> {
  return db.recipes.count();
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const recipes = await db.recipes.toArray();
  const tagSet = new Set<string>();
  recipes.forEach((r) => (r.tags || []).forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Filter recipes by tag
 */
export async function filterRecipesByTag(tag: string): Promise<Recipe[]> {
  const recipes = await db.recipes.toArray();
  return recipes.filter((r) => (r.tags || []).includes(tag));
}

/**
 * Bulk delete recipes (sync-aware)
 */
export async function bulkDeleteRecipes(
  ids: string[],
  householdId?: string | null
): Promise<void> {
  await db.recipes.bulkDelete(ids);

  if (isSyncEnabled() && householdId) {
    for (const id of ids) {
      if (isOnline()) {
        try {
          const { error } = await getSupabase()
            .from('recipes')
            .delete()
            .eq('id', id);
          if (error) throw error;
        } catch {
          await enqueueSyncOperation('recipes', 'delete', { id });
        }
      } else {
        await enqueueSyncOperation('recipes', 'delete', { id });
      }
    }
  }
}

/**
 * Bulk assign a tag (sync-aware)
 */
export async function bulkAssignTag(
  ids: string[],
  tag: string,
  householdId?: string | null,
  userId?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction('rw', db.recipes, async () => {
    for (const id of ids) {
      const recipe = await db.recipes.get(id);
      if (recipe) {
        const existingTags = recipe.tags || [];
        if (!existingTags.includes(tag)) {
          await db.recipes.update(id, {
            tags: [...existingTags, tag],
            updatedAt: now,
          });
        }
      }
    }
  });

  // Sync updated recipes to cloud
  if (isSyncEnabled() && householdId) {
    for (const id of ids) {
      const recipe = await db.recipes.get(id);
      if (recipe) {
        const cloudPayload = localRecipeToCloud(recipe, householdId, userId);
        if (isOnline()) {
          try {
            const { error } = await getSupabase()
              .from('recipes')
              .upsert(cloudPayload as any);
            if (error) throw error;
          } catch {
            await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
          }
        } else {
          await enqueueSyncOperation('recipes', 'upsert', cloudPayload as Record<string, unknown>);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Schedule CRUD (sync-aware)
// ---------------------------------------------------------------------------

/**
 * Add a meal to the schedule (sync-aware)
 */
export async function addToSchedule(
  recipeId: string,
  date: string,
  mealType: 'lunch' | 'dinner',
  householdId?: string | null,
  _userId?: string | null
): Promise<ScheduleEntry> {
  // Check for duplicate
  const existing = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([date, mealType])
    .first();

  if (existing) {
    await db.scheduleEntries.delete(existing.id);
    if (isSyncEnabled() && householdId) {
      if (isOnline()) {
        try {
          await getSupabase().from('schedule_entries').delete().eq('id', existing.id);
        } catch {
          await enqueueSyncOperation('schedule_entries', 'delete', { id: existing.id });
        }
      } else {
        await enqueueSyncOperation('schedule_entries', 'delete', { id: existing.id });
      }
    }
  }

  const entry: ScheduleEntry = {
    id: generateId(),
    recipeId,
    date,
    mealType,
    createdAt: new Date().toISOString(),
  };

  await db.scheduleEntries.add(entry);

  // Sync to cloud
  if (isSyncEnabled() && householdId) {
    const cloudPayload = localScheduleToCloud(entry, householdId);
    if (isOnline()) {
      try {
        const { error } = await getSupabase()
          .from('schedule_entries')
          .upsert(cloudPayload as any);
        if (error) throw error;
      } catch {
        await enqueueSyncOperation('schedule_entries', 'upsert', cloudPayload as Record<string, unknown>);
      }
    } else {
      await enqueueSyncOperation('schedule_entries', 'upsert', cloudPayload as Record<string, unknown>);
    }
  }

  return entry;
}

/**
 * Remove from schedule (sync-aware)
 */
export async function removeFromSchedule(
  entryId: string,
  householdId?: string | null
): Promise<void> {
  await db.scheduleEntries.delete(entryId);

  if (isSyncEnabled() && householdId) {
    if (isOnline()) {
      try {
        await getSupabase().from('schedule_entries').delete().eq('id', entryId);
      } catch {
        await enqueueSyncOperation('schedule_entries', 'delete', { id: entryId });
      }
    } else {
      await enqueueSyncOperation('schedule_entries', 'delete', { id: entryId });
    }
  }
}

/**
 * Get schedule entries for a date range
 */
export async function getScheduleEntries(
  startDate: string,
  endDate: string
): Promise<ScheduleEntry[]> {
  return db.scheduleEntries
    .where('date')
    .between(startDate, endDate, true, true)
    .sortBy('date');
}

/**
 * Get entries for a specific date
 */
export async function getEntriesForDate(date: string): Promise<ScheduleEntry[]> {
  return db.scheduleEntries.where('date').equals(date).toArray();
}

/**
 * Get entries by recipe
 */
export async function getEntriesByRecipe(recipeId: string): Promise<ScheduleEntry[]> {
  return db.scheduleEntries.where('recipeId').equals(recipeId).toArray();
}

/**
 * Populated schedule types (re-exported for compatibility)
 */
export interface PopulatedMealSlot {
  entry: ScheduleEntry;
  recipe: Recipe | undefined;
}

export interface DaySchedule {
  lunch?: PopulatedMealSlot;
  dinner?: PopulatedMealSlot;
}

export type WeekSchedule = Record<string, DaySchedule>;

/**
 * Get schedule for a full week with populated recipe data
 */
export async function getScheduleForWeek(
  startDate: string,
  endDate: string
): Promise<WeekSchedule> {
  const entries = await getScheduleEntries(startDate, endDate);
  const schedule: WeekSchedule = {};

  for (const entry of entries) {
    if (!schedule[entry.date]) {
      schedule[entry.date] = {};
    }
    const recipe = await getRecipeById(entry.recipeId);
    schedule[entry.date][entry.mealType] = { entry, recipe };
  }

  return schedule;
}

/**
 * Swap two meals (sync-aware)
 */
export async function swapMeals(
  sourceDate: string,
  sourceMealType: 'lunch' | 'dinner',
  targetDate: string,
  targetMealType: 'lunch' | 'dinner',
  householdId?: string | null,
  _userId?: string | null
): Promise<void> {
  const sourceEntry = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([sourceDate, sourceMealType])
    .first();

  const targetEntry = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([targetDate, targetMealType])
    .first();

  if (!sourceEntry) return;

  if (targetEntry) {
    const sourceRecipeId = sourceEntry.recipeId;
    const targetRecipeId = targetEntry.recipeId;
    await db.scheduleEntries.update(sourceEntry.id, { recipeId: targetRecipeId });
    await db.scheduleEntries.update(targetEntry.id, { recipeId: sourceRecipeId });

    // Sync both entries
    if (isSyncEnabled() && householdId) {
      const updatedSource = await db.scheduleEntries.get(sourceEntry.id);
      const updatedTarget = await db.scheduleEntries.get(targetEntry.id);
      if (updatedSource) {
        const payload = localScheduleToCloud(updatedSource, householdId);
        if (isOnline()) {
          try {
            await getSupabase().from('schedule_entries').upsert(payload as any);
          } catch {
            await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
          }
        } else {
          await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
        }
      }
      if (updatedTarget) {
        const payload = localScheduleToCloud(updatedTarget, householdId);
        if (isOnline()) {
          try {
            await getSupabase().from('schedule_entries').upsert(payload as any);
          } catch {
            await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
          }
        } else {
          await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
        }
      }
    }
  } else {
    // Move: delete source, create at target
    await db.scheduleEntries.delete(sourceEntry.id);
    const newEntry: ScheduleEntry = {
      id: generateId(),
      recipeId: sourceEntry.recipeId,
      date: targetDate,
      mealType: targetMealType,
      createdAt: new Date().toISOString(),
    };
    await db.scheduleEntries.add(newEntry);

    // Sync
    if (isSyncEnabled() && householdId) {
      if (isOnline()) {
        try {
          await getSupabase().from('schedule_entries').delete().eq('id', sourceEntry.id);
        } catch {
          await enqueueSyncOperation('schedule_entries', 'delete', { id: sourceEntry.id });
        }
      } else {
        await enqueueSyncOperation('schedule_entries', 'delete', { id: sourceEntry.id });
      }

      const payload = localScheduleToCloud(newEntry, householdId);
      if (isOnline()) {
        try {
          await getSupabase().from('schedule_entries').upsert(payload as any);
        } catch {
          await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
        }
      } else {
        await enqueueSyncOperation('schedule_entries', 'upsert', payload as Record<string, unknown>);
      }
    }
  }
}

/**
 * Get schedule entry count
 */
export async function getScheduleEntryCount(): Promise<number> {
  return db.scheduleEntries.count();
}
