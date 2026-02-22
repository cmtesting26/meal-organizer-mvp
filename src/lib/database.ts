/**
 * IndexedDB Database Configuration (Dexie.js)
 *
 * Central database for Fork and Spoon MVP.
 * Tables: recipes, scheduleEntries, syncQueue
 *
 * @module database
 */

import Dexie, { type Table } from 'dexie';
import type { Recipe, ScheduleEntry, RecipeIngredient } from '../types/recipe';

/** Shape of a sync queue item stored in IndexedDB */
export interface SyncQueueRow {
  id: string;
  table: 'recipes' | 'schedule_entries';
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

export class MealOrganizerDatabase extends Dexie {
  recipes!: Table<Recipe>;
  scheduleEntries!: Table<ScheduleEntry>;
  syncQueue!: Table<SyncQueueRow>;
  recipeIngredients!: Table<RecipeIngredient>;

  constructor() {
    // Keep legacy DB name 'MealOrganizerDB' for backward compat — renaming would lose existing data
    super('MealOrganizerDB');
    
    // V1 — MVP schema
    this.version(1).stores({
      recipes: 'id, title, lastCookedDate, createdAt',
      scheduleEntries: 'id, recipeId, [date+mealType], date',
    });

    // V2 — Add tags (multi-entry index for filtering)
    this.version(2).stores({
      recipes: 'id, title, lastCookedDate, createdAt, *tags',
      scheduleEntries: 'id, recipeId, [date+mealType], date',
    }).upgrade(tx => {
      // Migrate existing recipes: add empty tags array
      return tx.table('recipes').toCollection().modify(recipe => {
        if (!recipe.tags) {
          recipe.tags = [];
        }
      });
    });

    // V3 — Add sync queue for offline-first cloud sync (Sprint 10)
    this.version(3).stores({
      recipes: 'id, title, lastCookedDate, createdAt, *tags',
      scheduleEntries: 'id, recipeId, [date+mealType], date',
      syncQueue: 'id, table, timestamp',
    });

    // V4 — Add recipeIngredients for structured ingredient parsing/scaling (Sprint 12)
    this.version(4).stores({
      recipes: 'id, title, lastCookedDate, createdAt, *tags',
      scheduleEntries: 'id, recipeId, [date+mealType], date',
      syncQueue: 'id, table, timestamp',
      recipeIngredients: 'id, recipeId, sortOrder',
    });
  }
}

export const db = new MealOrganizerDatabase();
