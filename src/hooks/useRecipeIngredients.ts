/**
 * useRecipeIngredients Hook (Sprint 12 — S12-03)
 *
 * Manages structured ingredient data for recipes.
 * Parses raw ingredient strings into structured {quantity, unit, name} objects,
 * stores them in IndexedDB (recipeIngredients table), and provides scaling.
 *
 * @module useRecipeIngredients
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/database';
import { parseIngredient, scaleIngredient, formatScaledIngredient, formatQuantity } from '@/lib/ingredientParser';
import type { ParsedIngredient } from '@/lib/ingredientParser';
import type { Recipe, RecipeIngredient } from '@/types/recipe';

interface UseRecipeIngredientsReturn {
  /** Structured ingredients for this recipe */
  ingredients: RecipeIngredient[];
  /** Whether ingredients are loading */
  loading: boolean;
  /** Scale ingredients by serving multiplier */
  getScaledIngredients: (servings: number, defaultServings: number) => ScaledIngredient[];
  /** Parse and store ingredients for a recipe */
  parseAndStore: (recipe: Recipe) => Promise<RecipeIngredient[]>;
  /** Check if structured ingredients exist for a recipe */
  hasStructuredIngredients: boolean;
}

export interface ScaledIngredient {
  /** Display string for the scaled ingredient */
  display: string;
  /** Formatted quantity */
  quantity: string;
  /** Formatted max quantity (if range) */
  quantityMax: string;
  /** Unit */
  unit: string;
  /** Ingredient name */
  name: string;
  /** Raw text fallback */
  rawText: string;
}

/**
 * Generate a UUID v4
 */
function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Convert a ParsedIngredient to a RecipeIngredient (for storage)
 */
function toRecipeIngredient(
  parsed: ParsedIngredient,
  recipeId: string,
  sortOrder: number
): RecipeIngredient {
  return {
    id: uuid(),
    recipeId,
    quantity: parsed.quantity,
    quantityMax: parsed.quantityMax ?? null,
    unit: parsed.unit,
    name: parsed.name,
    rawText: parsed.rawText,
    sortOrder,
  };
}

export function useRecipeIngredients(recipeId: string | undefined): UseRecipeIngredientsReturn {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Load structured ingredients from IndexedDB
  useEffect(() => {
    if (!recipeId) {
      setIngredients([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const stored = await db.recipeIngredients
          .where('recipeId')
          .equals(recipeId!)
          .sortBy('sortOrder');

        if (!cancelled) {
          setIngredients(stored);
        }
      } catch {
        // Table might not exist yet in older DB versions
        if (!cancelled) setIngredients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [recipeId]);

  const hasStructuredIngredients = ingredients.length > 0;

  /**
   * Parse raw ingredient strings from a recipe and store as structured data.
   */
  const parseAndStore = useCallback(async (recipe: Recipe): Promise<RecipeIngredient[]> => {
    if (!recipe.ingredients?.length) return [];

    // Parse each ingredient string
    const parsed: RecipeIngredient[] = recipe.ingredients.map((raw, index) =>
      toRecipeIngredient(parseIngredient(raw), recipe.id, index)
    );

    // Clear existing ingredients for this recipe, then bulk-add
    await db.transaction('rw', db.recipeIngredients, async () => {
      await db.recipeIngredients.where('recipeId').equals(recipe.id).delete();
      await db.recipeIngredients.bulkAdd(parsed);
    });

    setIngredients(parsed);
    return parsed;
  }, []);

  /**
   * Get ingredients scaled to a target number of servings.
   */
  const getScaledIngredients = useCallback(
    (servings: number, defaultServings: number): ScaledIngredient[] => {
      if (defaultServings <= 0) defaultServings = 4; // fallback
      const factor = servings / defaultServings;

      return ingredients.map((ing) => {
        const parsed: ParsedIngredient = {
          quantity: ing.quantity,
          quantityMax: ing.quantityMax,
          unit: ing.unit,
          name: ing.name,
          rawText: ing.rawText,
        };

        const scaled = scaleIngredient(parsed, factor);

        return {
          display: formatScaledIngredient(scaled),
          quantity: formatQuantity(scaled.quantity),
          quantityMax: formatQuantity(scaled.quantityMax ?? null),
          unit: scaled.unit,
          name: scaled.name,
          rawText: ing.rawText,
        };
      });
    },
    [ingredients]
  );

  return {
    ingredients,
    loading,
    getScaledIngredients,
    parseAndStore,
    hasStructuredIngredients,
  };
}
