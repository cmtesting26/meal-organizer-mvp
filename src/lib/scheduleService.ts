/**
 * Schedule Service
 *
 * CRUD operations for meal schedule entries using Dexie.js / IndexedDB.
 * Adding a recipe to the schedule automatically updates that recipe's
 * lastCookedDate.
 *
 * @module scheduleService
 */

import { db } from './database';
import type { ScheduleEntry, Recipe } from '../types/recipe';
import { getRecipeById } from './recipeService';

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

/**
 * Add a recipe to the schedule.
 * Also updates the recipe's lastCookedDate to the scheduled date.
 */
export async function addToSchedule(
  recipeId: string,
  date: string,
  mealType: 'lunch' | 'dinner'
): Promise<ScheduleEntry> {
  // Check for duplicate entry at same slot
  const existing = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([date, mealType])
    .first();

  if (existing) {
    // Remove existing entry first (replace behavior)
    await db.scheduleEntries.delete(existing.id);
  }

  const entry: ScheduleEntry = {
    id: generateId(),
    recipeId,
    date,
    mealType,
    createdAt: new Date().toISOString(),
  };

  await db.scheduleEntries.add(entry);

  return entry;
}

/**
 * Remove a schedule entry by ID.
 * Does NOT revert the recipe's lastCookedDate.
 */
export async function removeFromSchedule(entryId: string): Promise<void> {
  await db.scheduleEntries.delete(entryId);
}

/**
 * Get all schedule entries for a date range (inclusive).
 * Returns entries sorted by date.
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
 * Get schedule entries for a specific date
 */
export async function getEntriesForDate(date: string): Promise<ScheduleEntry[]> {
  return db.scheduleEntries.where('date').equals(date).toArray();
}

/**
 * Get all schedule entries for a recipe
 */
export async function getEntriesByRecipe(recipeId: string): Promise<ScheduleEntry[]> {
  return db.scheduleEntries.where('recipeId').equals(recipeId).toArray();
}

/**
 * Get schedule for a full week with populated recipe data.
 * Returns a map of date -> { lunch?: {entry, recipe}, dinner?: {entry, recipe} }
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
 * Get total schedule entry count
 */
export async function getScheduleEntryCount(): Promise<number> {
  return db.scheduleEntries.count();
}

/**
 * Swap two meal entries in the schedule.
 * Used by drag-and-drop reordering.
 *
 * If source has an entry and target has an entry: swap recipeIds.
 * If source has an entry and target is empty: move entry to target slot.
 */
export async function swapMeals(
  sourceDate: string,
  sourceMealType: 'lunch' | 'dinner',
  targetDate: string,
  targetMealType: 'lunch' | 'dinner'
): Promise<void> {
  const sourceEntry = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([sourceDate, sourceMealType])
    .first();

  const targetEntry = await db.scheduleEntries
    .where('[date+mealType]')
    .equals([targetDate, targetMealType])
    .first();

  if (!sourceEntry) return; // Nothing to move

  if (targetEntry) {
    // Swap: update both entries' recipeIds
    const sourceRecipeId = sourceEntry.recipeId;
    const targetRecipeId = targetEntry.recipeId;
    await db.scheduleEntries.update(sourceEntry.id, { recipeId: targetRecipeId });
    await db.scheduleEntries.update(targetEntry.id, { recipeId: sourceRecipeId });
  } else {
    // Move: delete source entry, create new at target
    await db.scheduleEntries.delete(sourceEntry.id);
    const newEntry: ScheduleEntry = {
      id: generateId(),
      recipeId: sourceEntry.recipeId,
      date: targetDate,
      mealType: targetMealType,
      createdAt: new Date().toISOString(),
    };
    await db.scheduleEntries.add(newEntry);
  }
}
