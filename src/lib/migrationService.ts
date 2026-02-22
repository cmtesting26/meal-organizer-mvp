/**
 * Migration Service (Sprint 11 — S11-02, S11-04)
 *
 * Handles one-time migration of local IndexedDB data to a Supabase household.
 * Supports: recipes, schedule entries, and tags.
 * Includes rollback capability if migration fails.
 *
 * @module migrationService
 */

import { db } from './database';
import { getSupabase } from './supabase';
import type { Recipe, ScheduleEntry } from '../types/recipe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationSummary {
  recipes: number;
  scheduleEntries: number;
  tags: number;
}

export interface MigrationResult {
  success: boolean;
  summary: MigrationSummary;
  errors: string[];
  /** Snapshot of local data for rollback */
  snapshot?: MigrationSnapshot;
}

export interface MigrationSnapshot {
  recipes: Recipe[];
  scheduleEntries: ScheduleEntry[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIGRATION_STATUS_KEY = 'meal-org-migration-status';
const MIGRATION_SNAPSHOT_KEY = 'meal-org-migration-snapshot';
const BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export type MigrationStatus = 'not-started' | 'in-progress' | 'completed' | 'failed';

export function getMigrationStatus(): MigrationStatus {
  return (localStorage.getItem(MIGRATION_STATUS_KEY) as MigrationStatus) || 'not-started';
}

function setMigrationStatus(status: MigrationStatus): void {
  localStorage.setItem(MIGRATION_STATUS_KEY, status);
}

// ---------------------------------------------------------------------------
// Detection — count local data
// ---------------------------------------------------------------------------

/**
 * Detect local IndexedDB data and return a summary of what would be migrated.
 */
export async function detectLocalData(): Promise<MigrationSummary> {
  const recipes = await db.recipes.count();
  const scheduleEntries = await db.scheduleEntries.count();

  // Collect unique tags from all recipes
  const allRecipes = await db.recipes.toArray();
  const tagSet = new Set<string>();
  for (const recipe of allRecipes) {
    if (recipe.tags) {
      for (const tag of recipe.tags) {
        tagSet.add(tag);
      }
    }
  }

  return {
    recipes,
    scheduleEntries,
    tags: tagSet.size,
  };
}

/**
 * Whether there is any local data to migrate.
 */
export async function hasLocalData(): Promise<boolean> {
  const summary = await detectLocalData();
  return summary.recipes > 0 || summary.scheduleEntries > 0;
}

// ---------------------------------------------------------------------------
// Snapshot — for rollback capability (S11-04)
// ---------------------------------------------------------------------------

async function createSnapshot(): Promise<MigrationSnapshot> {
  const recipes = await db.recipes.toArray();
  const scheduleEntries = await db.scheduleEntries.toArray();

  const snapshot: MigrationSnapshot = {
    recipes,
    scheduleEntries,
    timestamp: new Date().toISOString(),
  };

  // Store snapshot in localStorage (compressed JSON) for rollback
  try {
    localStorage.setItem(MIGRATION_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // If too large for localStorage, we'll keep it in memory only
    console.warn('Migration snapshot too large for localStorage — kept in memory only');
  }

  return snapshot;
}

/**
 * Get the stored migration snapshot for rollback.
 */
export function getStoredSnapshot(): MigrationSnapshot | null {
  try {
    const raw = localStorage.getItem(MIGRATION_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Migration — push local data to cloud
// ---------------------------------------------------------------------------

/**
 * Migrate all local IndexedDB data to the Supabase household.
 *
 * Steps:
 * 1. Create a snapshot of all local data (for rollback)
 * 2. Upload recipes in batches
 * 3. Upload schedule entries in batches
 * 4. Mark migration as complete
 *
 * @param householdId - The household to migrate into
 * @param userId - The current authenticated user ID
 */
export async function migrateLocalToCloud(
  householdId: string,
  userId: string
): Promise<MigrationResult> {
  const client = getSupabase();
  const errors: string[] = [];
  const summary: MigrationSummary = { recipes: 0, scheduleEntries: 0, tags: 0 };

  setMigrationStatus('in-progress');

  // Step 1: Snapshot
  let snapshot: MigrationSnapshot;
  try {
    snapshot = await createSnapshot();
  } catch (err) {
    setMigrationStatus('failed');
    return {
      success: false,
      summary,
      errors: [`Failed to create snapshot: ${(err as Error).message}`],
    };
  }

  // Step 2: Upload recipes in batches
  const allRecipes = await db.recipes.toArray();
  for (let i = 0; i < allRecipes.length; i += BATCH_SIZE) {
    const batch = allRecipes.slice(i, i + BATCH_SIZE);
    const cloudRecipes = batch.map((recipe) => ({
      id: recipe.id,
      household_id: householdId,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      source_url: recipe.sourceUrl || null,
      image_url: recipe.imageUrl || null,
      last_cooked_date: recipe.lastCookedDate || null,
      tags: recipe.tags || [],
      created_by: userId,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('recipes')
      .upsert(cloudRecipes, { onConflict: 'id' });

    if (error) {
      errors.push(`Recipe batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      summary.recipes += batch.length;
    }
  }

  // Step 3: Upload schedule entries in batches
  // Verify which recipe IDs actually exist in cloud (handles partial recipe upload failures)
  let cloudRecipeIds = new Set<string>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cloudRecipes } = await (client as any)
      .from('recipes')
      .select('id')
      .eq('household_id', householdId);
    if (cloudRecipes) {
      cloudRecipeIds = new Set(cloudRecipes.map((r: { id: string }) => r.id));
    }
  } catch {
    // Fallback: use the set of recipes we attempted to upload
    cloudRecipeIds = new Set(allRecipes.map((r) => r.id));
  }

  const allEntries = await db.scheduleEntries.toArray();
  // Filter out entries whose recipe doesn't exist in cloud
  const validEntries = allEntries.filter((entry) => {
    if (!entry.recipeId) return true;
    return cloudRecipeIds.has(entry.recipeId);
  });
  const skippedEntries = allEntries.length - validEntries.length;
  if (skippedEntries > 0) {
    errors.push(`Skipped ${skippedEntries} schedule entries referencing missing recipes`);
  }

  for (let i = 0; i < validEntries.length; i += BATCH_SIZE) {
    const batch = validEntries.slice(i, i + BATCH_SIZE);
    const cloudEntries = batch.map((entry) => ({
      id: entry.id,
      household_id: householdId,
      recipe_id: entry.recipeId,
      date: entry.date,
      meal_type: entry.mealType,
      created_at: entry.createdAt,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('schedule_entries')
      .upsert(cloudEntries, { onConflict: 'id' });

    if (error) {
      errors.push(`Schedule batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      summary.scheduleEntries += batch.length;
    }
  }

  // Count tags from migrated recipes
  const tagSet = new Set<string>();
  for (const recipe of allRecipes) {
    if (recipe.tags) {
      for (const tag of recipe.tags) tagSet.add(tag);
    }
  }
  summary.tags = tagSet.size;

  // Step 4: Set status
  if (errors.length === 0) {
    setMigrationStatus('completed');
  } else if (summary.recipes > 0 || summary.scheduleEntries > 0) {
    // Partial success — some data migrated
    setMigrationStatus('completed');
  } else {
    setMigrationStatus('failed');
  }

  return {
    success: errors.length === 0,
    summary,
    errors,
    snapshot,
  };
}

// ---------------------------------------------------------------------------
// Rollback — restore local-only mode (S11-04)
// ---------------------------------------------------------------------------

/**
 * Rollback a failed or unwanted migration.
 * Restores local data from snapshot and clears migration state.
 */
export async function rollbackMigration(): Promise<{ success: boolean; error?: string }> {
  const snapshot = getStoredSnapshot();
  if (!snapshot) {
    return { success: false, error: 'No migration snapshot found for rollback' };
  }

  try {
    // Restore recipes
    await db.recipes.clear();
    if (snapshot.recipes.length > 0) {
      await db.recipes.bulkPut(snapshot.recipes);
    }

    // Restore schedule entries
    await db.scheduleEntries.clear();
    if (snapshot.scheduleEntries.length > 0) {
      await db.scheduleEntries.bulkPut(snapshot.scheduleEntries);
    }

    // Clear migration state
    setMigrationStatus('not-started');
    localStorage.removeItem(MIGRATION_SNAPSHOT_KEY);

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Clear the migration snapshot from localStorage (after user confirms migration is good).
 */
export function clearMigrationSnapshot(): void {
  localStorage.removeItem(MIGRATION_SNAPSHOT_KEY);
}
