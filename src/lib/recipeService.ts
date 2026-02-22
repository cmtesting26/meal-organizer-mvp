/**
 * Recipe Service
 *
 * CRUD operations for recipes using Dexie.js / IndexedDB.
 *
 * @module recipeService
 */

import { db } from './database';
import type { Recipe } from '../types/recipe';

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
 * Get all recipes, optionally sorted by a field
 */
export async function getRecipes(sortBy: 'title' | 'lastCookedDate' | 'createdAt' = 'createdAt'): Promise<Recipe[]> {
  const recipes = await db.recipes.toArray();

  return recipes.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'lastCookedDate') {
      // Null/undefined dates sort to the top (oldest / never cooked first)
      if (!a.lastCookedDate && !b.lastCookedDate) return 0;
      if (!a.lastCookedDate) return -1;
      if (!b.lastCookedDate) return 1;
      return a.lastCookedDate.localeCompare(b.lastCookedDate);
    }
    // Default: newest first
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
 * Create a new recipe
 */
export async function createRecipe(
  data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
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
  await db.recipes.add(recipe);
  return recipe;
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
  await db.recipes.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a recipe by ID
 */
export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id);
}

/**
 * Get recipe count
 */
export async function getRecipeCount(): Promise<number> {
  return db.recipes.count();
}

/**
 * Get all unique tags across all recipes
 */
export async function getAllTags(): Promise<string[]> {
  const recipes = await db.recipes.toArray();
  const tagSet = new Set<string>();
  recipes.forEach(r => (r.tags || []).forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Filter recipes by tag
 */
export async function filterRecipesByTag(tag: string): Promise<Recipe[]> {
  const recipes = await db.recipes.toArray();
  return recipes.filter(r => (r.tags || []).includes(tag));
}

/**
 * Bulk delete multiple recipes by IDs
 */
export async function bulkDeleteRecipes(ids: string[]): Promise<void> {
  await db.recipes.bulkDelete(ids);
}

/**
 * Bulk assign a tag to multiple recipes (additive — does not remove existing tags)
 */
export async function bulkAssignTag(ids: string[], tag: string): Promise<void> {
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
}
