/**
 * useRecipes Hook (Sprint 10)
 *
 * Provides recipe CRUD operations backed by the sync-aware data layer.
 * When authenticated: reads/writes sync with Supabase via syncService.
 * When guest (local-only): operates against IndexedDB only.
 * Sprint 7 additions: quickLog with undo, tags support, tag filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getRecipes,
  searchRecipes as searchRecipesService,
  createRecipe,
  updateRecipe as updateRecipeService,
  deleteRecipe as deleteRecipeService,
  getAllTags,
  bulkDeleteRecipes as bulkDeleteRecipesService,
  bulkAssignTag as bulkAssignTagService,
} from '@/lib/syncService';
import { useAuth } from '@/hooks/useAuth';
import type { Recipe } from '@/types/recipe';

interface UseRecipesReturn {
  recipes: Recipe[];
  loading: boolean;
  error: Error | null;
  allTags: string[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  bulkDeleteRecipes: (ids: string[]) => Promise<void>;
  bulkAssignTag: (ids: string[], tag: string) => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
  searchRecipes: (query: string) => Promise<void>;
  refreshRecipes: () => Promise<void>;
}

export function useRecipes(): UseRecipesReturn {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const { profile, user } = useAuth();
  const householdId = profile?.householdId ?? null;
  const userId = user?.id ?? null;

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const [data, tags] = await Promise.all([getRecipes(), getAllTags()]);
      setRecipes(data);
      setAllTags(tags);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load recipes'));
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const addRecipe = useCallback(
    async (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> => {
      const recipe = await createRecipe(data, householdId, userId);
      await loadRecipes();
      return recipe;
    },
    [loadRecipes, householdId, userId]
  );

  const handleUpdateRecipe = useCallback(
    async (recipe: Recipe): Promise<void> => {
      await updateRecipeService(recipe.id, recipe, householdId, userId);
      await loadRecipes();
    },
    [loadRecipes, householdId, userId]
  );

  const handleDeleteRecipe = useCallback(
    async (id: string): Promise<void> => {
      await deleteRecipeService(id, householdId);
      await loadRecipes();
    },
    [loadRecipes, householdId]
  );

  const handleSearchRecipes = useCallback(async (query: string): Promise<void> => {
    try {
      setLoading(true);
      const results = await searchRecipesService(query);
      setRecipes(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecipeByIdLocal = useCallback(
    (id: string): Recipe | undefined => {
      return recipes.find((r) => r.id === id);
    },
    [recipes]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      await bulkDeleteRecipesService(ids, householdId);
      await loadRecipes();
    },
    [loadRecipes, householdId]
  );

  const handleBulkAssignTag = useCallback(
    async (ids: string[], tag: string): Promise<void> => {
      await bulkAssignTagService(ids, tag, householdId, userId);
      await loadRecipes();
    },
    [loadRecipes, householdId, userId]
  );

  return {
    recipes,
    loading,
    error,
    allTags,
    addRecipe,
    updateRecipe: handleUpdateRecipe,
    deleteRecipe: handleDeleteRecipe,
    bulkDeleteRecipes: handleBulkDelete,
    bulkAssignTag: handleBulkAssignTag,
    getRecipeById: getRecipeByIdLocal,
    searchRecipes: handleSearchRecipes,
    refreshRecipes: loadRecipes,
  };
}


