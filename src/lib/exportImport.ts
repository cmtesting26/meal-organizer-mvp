/**
 * Data Export/Import Module (Sprint 13 — Enhanced)
 *
 * Provides JSON-based backup and restore for all app data.
 * Sprint 13 enhancements:
 * - Full cloud data backup (recipes, schedule, tags, recipeIngredients)
 * - Paprika (.paprikarecipes) import support
 * - Recipe Keeper import support
 * - Export metadata (app version, data counts)
 *
 * Implementation Plan Phase 19 · Roadmap V1.3 Epic 5
 *
 * @module exportImport
 */

import { db } from './database';
import type { Recipe, ScheduleEntry, RecipeIngredient } from '../types/recipe';

/** Version of the export format */
const EXPORT_VERSION = 2;

/** Export file structure (v2 — includes recipeIngredients and tags) */
export interface ExportData {
  version: number;
  exportedAt: string;
  appName: string;
  appVersion: string;
  stats: {
    recipeCount: number;
    scheduleEntryCount: number;
    recipeIngredientCount: number;
    tagCount: number;
  };
  data: {
    recipes: Recipe[];
    scheduleEntries: ScheduleEntry[];
    recipeIngredients: RecipeIngredient[];
  };
}

/** Preview of what an import contains */
export interface ImportPreview {
  valid: boolean;
  version: number;
  exportedAt: string;
  recipeCount: number;
  scheduleEntryCount: number;
  recipeIngredientCount: number;
  format: 'meal-organizer' | 'paprika' | 'recipe-keeper' | 'unknown';
  errors: string[];
}

/**
 * Export all app data (local + cloud) as a JSON string
 */
export async function exportAllData(): Promise<string> {
  const recipes = await db.recipes.toArray();
  const scheduleEntries = await db.scheduleEntries.toArray();
  const recipeIngredients = await db.recipeIngredients.toArray();

  // Count unique tags
  const allTags = new Set<string>();
  recipes.forEach(r => r.tags?.forEach(t => allTags.add(t)));

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Fork and Spoon',
    appVersion: '1.6.0',
    stats: {
      recipeCount: recipes.length,
      scheduleEntryCount: scheduleEntries.length,
      recipeIngredientCount: recipeIngredients.length,
      tagCount: allTags.size,
    },
    data: {
      recipes,
      scheduleEntries,
      recipeIngredients,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Trigger a file download of the exported data
 */
export async function downloadExport(): Promise<void> {
  const jsonString = await exportAllData();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `fork-and-spoon-backup-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Import: format detection
// ---------------------------------------------------------------------------

/** Detect the format of an uploaded file */
export function detectImportFormat(
  content: string,
  filename?: string
): 'meal-organizer' | 'paprika' | 'recipe-keeper' | 'unknown' {
  // Paprika files (.paprikarecipes) are gzipped, but when unzipped they're JSON
  if (filename?.endsWith('.paprikarecipes')) return 'paprika';

  // Recipe Keeper exports as XML or JSON with specific structure
  if (filename?.endsWith('.xml') || filename?.endsWith('.recipekeeperxml')) return 'recipe-keeper';

  try {
    const parsed = JSON.parse(content);
    if (parsed.appName === 'Fork and Spoon' || parsed.appName === 'Meal Organizer') return 'meal-organizer';

    // Paprika JSON format has "name", "ingredients", "directions" fields
    if (Array.isArray(parsed) && parsed[0]?.directions !== undefined) return 'paprika';

    // Recipe Keeper JSON
    if (parsed.recipes && Array.isArray(parsed.recipes) && parsed.recipes[0]?.recipeSource !== undefined) {
      return 'recipe-keeper';
    }
  } catch {
    // Not JSON — could be XML (Recipe Keeper)
    if (content.trim().startsWith('<?xml') || content.includes('<RecipeKeeper>')) {
      return 'recipe-keeper';
    }
  }

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Import: Paprika format
// ---------------------------------------------------------------------------

interface PaprikaRecipe {
  name?: string;
  ingredients?: string;
  directions?: string;
  source?: string;
  source_url?: string;
  photo_url?: string;
  categories?: string[];
  notes?: string;
}

/** Parse Paprika recipes into our Recipe format */
export function parsePaprikaRecipes(content: string): Recipe[] {
  let parsed: PaprikaRecipe[];
  try {
    const data = JSON.parse(content);
    parsed = Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }

  return parsed
    .filter((r) => r.name)
    .map((r) => ({
      id: crypto.randomUUID(),
      title: r.name || 'Untitled Recipe',
      ingredients: r.ingredients
        ? r.ingredients.split('\n').filter((line) => line.trim())
        : [],
      instructions: r.directions
        ? r.directions.split('\n').filter((line) => line.trim())
        : [],
      imageUrl: r.photo_url,
      sourceUrl: r.source_url || r.source,
      tags: r.categories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
}

// ---------------------------------------------------------------------------
// Import: Recipe Keeper format
// ---------------------------------------------------------------------------

/** Parse Recipe Keeper XML/JSON into our Recipe format */
export function parseRecipeKeeperRecipes(content: string): Recipe[] {
  // Try JSON first
  try {
    const data = JSON.parse(content);
    const recipes = data.recipes || (Array.isArray(data) ? data : []);
    return recipes
      .filter((r: Record<string, unknown>) => r.name || r.recipeName)
      .map((r: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        title: (r.name || r.recipeName || 'Untitled Recipe') as string,
        ingredients: typeof r.ingredients === 'string'
          ? (r.ingredients as string).split('\n').filter((l: string) => l.trim())
          : Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: typeof r.directions === 'string'
          ? (r.directions as string).split('\n').filter((l: string) => l.trim())
          : Array.isArray(r.directions) ? r.directions : [],
        sourceUrl: (r.source_url || r.recipeSource || '') as string,
        tags: Array.isArray(r.categories)
          ? r.categories
          : typeof r.recipeCategory === 'string'
            ? (r.recipeCategory as string).split(',').map((s: string) => s.trim())
            : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
  } catch {
    // Not JSON — try XML parsing
  }

  // XML parsing — extract recipe elements
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const recipeElements = doc.querySelectorAll('Recipe, recipe');
    const recipes: Recipe[] = [];

    recipeElements.forEach((el) => {
      const getField = (name: string) =>
        el.querySelector(name)?.textContent?.trim() || '';

      const title = getField('Name') || getField('name') || getField('RecipeName');
      if (!title) return;

      recipes.push({
        id: crypto.randomUUID(),
        title,
        ingredients: getField('Ingredients')
          .split('\n')
          .filter((l) => l.trim()),
        instructions: getField('Directions')
          .split('\n')
          .filter((l) => l.trim()),
        sourceUrl: getField('Source') || getField('SourceUrl'),
        tags: getField('Categories')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return recipes;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Import: validation and preview
// ---------------------------------------------------------------------------

/**
 * Validate and preview an import file without modifying data
 */
export function previewImport(
  content: string,
  filename?: string
): ImportPreview {
  const errors: string[] = [];
  const format = detectImportFormat(content, filename);

  if (format === 'unknown') {
    return {
      valid: false, version: 0, exportedAt: '', recipeCount: 0,
      scheduleEntryCount: 0, recipeIngredientCount: 0, format,
      errors: ['Unrecognised file format. Supported: Fork and Spoon JSON, Paprika, Recipe Keeper.'],
    };
  }

  if (format === 'paprika') {
    const recipes = parsePaprikaRecipes(content);
    return {
      valid: recipes.length > 0,
      version: 0, exportedAt: '', recipeCount: recipes.length,
      scheduleEntryCount: 0, recipeIngredientCount: 0, format,
      errors: recipes.length === 0 ? ['Could not parse any recipes from this Paprika file.'] : [],
    };
  }

  if (format === 'recipe-keeper') {
    const recipes = parseRecipeKeeperRecipes(content);
    return {
      valid: recipes.length > 0,
      version: 0, exportedAt: '', recipeCount: recipes.length,
      scheduleEntryCount: 0, recipeIngredientCount: 0, format,
      errors: recipes.length === 0 ? ['Could not parse any recipes from this Recipe Keeper file.'] : [],
    };
  }

  // Meal Organizer format
  // Fork and Spoon format (accepts legacy "Meal Organizer" backups for backward compatibility)
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      valid: false, version: 0, exportedAt: '', recipeCount: 0,
      scheduleEntryCount: 0, recipeIngredientCount: 0, format,
      errors: ['Invalid JSON file. Please select a valid backup file.'],
    };
  }

  const data = parsed as Record<string, unknown>;

  if (!data.version || typeof data.version !== 'number') {
    errors.push('Missing or invalid version field.');
  }

  if (!data.appName || (data.appName !== 'Fork and Spoon' && data.appName !== 'Meal Organizer')) {
    errors.push('This file is not a Fork and Spoon backup.');
  }

  if (typeof data.version === 'number' && data.version > EXPORT_VERSION) {
    errors.push(
      `Backup version ${data.version} is newer than this app supports (v${EXPORT_VERSION}). Please update the app.`
    );
  }

  const innerData = data.data as Record<string, unknown> | undefined;
  if (!innerData || typeof innerData !== 'object') {
    errors.push('Missing data section in backup file.');
    return {
      valid: false, version: (data.version as number) || 0,
      exportedAt: (data.exportedAt as string) || '', recipeCount: 0,
      scheduleEntryCount: 0, recipeIngredientCount: 0, format,
      errors,
    };
  }

  const recipes = innerData.recipes as unknown[];
  const scheduleEntries = innerData.scheduleEntries as unknown[];
  const recipeIngredients = innerData.recipeIngredients as unknown[] | undefined;

  if (!Array.isArray(recipes)) {
    errors.push('Invalid or missing recipes array.');
  }
  if (!Array.isArray(scheduleEntries)) {
    errors.push('Invalid or missing schedule entries array.');
  }

  if (Array.isArray(recipes) && recipes.length > 0) {
    const sample = recipes[0] as Record<string, unknown>;
    if (!sample.id || !sample.title) {
      errors.push('Recipe data appears malformed (missing id or title).');
    }
  }

  return {
    valid: errors.length === 0,
    version: (data.version as number) || 0,
    exportedAt: (data.exportedAt as string) || '',
    recipeCount: Array.isArray(recipes) ? recipes.length : 0,
    scheduleEntryCount: Array.isArray(scheduleEntries) ? scheduleEntries.length : 0,
    recipeIngredientCount: Array.isArray(recipeIngredients) ? recipeIngredients.length : 0,
    format,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Import: execute
// ---------------------------------------------------------------------------

/**
 * Import data from a file, supporting multiple formats
 */
export async function importData(
  content: string,
  mode: 'replace' | 'merge' = 'replace',
  filename?: string
): Promise<{ recipesImported: number; scheduleEntriesImported: number }> {
  const format = detectImportFormat(content, filename);

  if (format === 'paprika') {
    return importExternalRecipes(parsePaprikaRecipes(content), mode);
  }

  if (format === 'recipe-keeper') {
    return importExternalRecipes(parseRecipeKeeperRecipes(content), mode);
  }

  // Fork and Spoon native format (also accepts legacy "Meal Organizer" backups)
  const preview = previewImport(content, filename);
  if (!preview.valid) {
    throw new Error(`Invalid import: ${preview.errors.join(', ')}`);
  }

  const parsed = JSON.parse(content) as ExportData;
  const { recipes, scheduleEntries, recipeIngredients } = parsed.data;

  if (mode === 'replace') {
    await db.transaction('rw', db.recipes, db.scheduleEntries, db.recipeIngredients, async () => {
      await db.recipes.clear();
      await db.scheduleEntries.clear();
      await db.recipeIngredients.clear();
      await db.recipes.bulkAdd(recipes);
      await db.scheduleEntries.bulkAdd(scheduleEntries);
      if (recipeIngredients?.length) {
        await db.recipeIngredients.bulkAdd(recipeIngredients);
      }
    });
  } else {
    await db.transaction('rw', db.recipes, db.scheduleEntries, db.recipeIngredients, async () => {
      for (const recipe of recipes) {
        const existing = await db.recipes.get(recipe.id);
        if (!existing) await db.recipes.add(recipe);
      }
      for (const entry of scheduleEntries) {
        const existing = await db.scheduleEntries.get(entry.id);
        if (!existing) await db.scheduleEntries.add(entry);
      }
      if (recipeIngredients?.length) {
        for (const ri of recipeIngredients) {
          const existing = await db.recipeIngredients.get(ri.id);
          if (!existing) await db.recipeIngredients.add(ri);
        }
      }
    });
  }

  return {
    recipesImported: recipes.length,
    scheduleEntriesImported: scheduleEntries.length,
  };
}

/** Helper: import recipes from external formats (Paprika, Recipe Keeper) */
async function importExternalRecipes(
  recipes: Recipe[],
  mode: 'replace' | 'merge'
): Promise<{ recipesImported: number; scheduleEntriesImported: number }> {
  if (mode === 'replace') {
    await db.transaction('rw', db.recipes, async () => {
      await db.recipes.clear();
      await db.recipes.bulkAdd(recipes);
    });
  } else {
    await db.transaction('rw', db.recipes, async () => {
      for (const recipe of recipes) {
        // For external formats, check by title since IDs are generated
        const existing = await db.recipes
          .where('title')
          .equals(recipe.title)
          .first();
        if (!existing) await db.recipes.add(recipe);
      }
    });
  }

  return { recipesImported: recipes.length, scheduleEntriesImported: 0 };
}

/**
 * Read a File object and return its text content
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

