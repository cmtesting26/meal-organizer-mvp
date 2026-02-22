/**
 * useNewRecipes Hook (Sprint 21)
 *
 * Fetches recipes added to the household since the current user's
 * last_seen_at timestamp, by *other* household members (not the
 * current user).
 *
 * Also updates last_seen_at on app open so the next session
 * gets a fresh baseline.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27–28
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/types/recipe';

interface NewRecipeWithAuthor extends Recipe {
  /** Display name of the household member who added it */
  addedByName: string;
}

interface UseNewRecipesReturn {
  /** Recipes added by other household members since last login */
  newRecipes: NewRecipeWithAuthor[];
  /** Whether there are any new recipes */
  hasNew: boolean;
  /** Count of new recipes (for badge) */
  count: number;
  /** Whether the query is loading */
  loading: boolean;
  /** Dismiss all new recipes (mark as seen) */
  dismiss: () => void;
  /** Whether feed has been dismissed this session */
  dismissed: boolean;
}

export function useNewRecipes(): UseNewRecipesReturn {
  const [newRecipes, setNewRecipes] = useState<NewRecipeWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasUpdatedLastSeen = useRef(false);

  const { profile, user, isAuthenticated, isLocalOnly } = useAuth();
  const householdId = profile?.householdId ?? null;
  const userId = user?.id ?? null;
  const lastSeenAt = profile?.lastSeenAt ?? null;

  // Fetch new recipes on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated || isLocalOnly || !supabase || !householdId || !userId) {
      setNewRecipes([]);
      return;
    }

    async function fetchNewRecipes() {
      if (!supabase || !householdId || !userId) return;

      setLoading(true);
      try {
        // Use last_seen_at as baseline, or fall back to 24h ago
        const since = lastSeenAt || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Query recipes created after last_seen_at by OTHER household members
        const { data: recipes, error } = await (supabase as any)
          .from('recipes')
          .select(`
            id, title, ingredients, instructions, image_url, source_url,
            last_cooked_date, created_at, updated_at, tags, user_id
          `)
          .eq('household_id', householdId)
          .neq('user_id', userId)
          .gt('created_at', since)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch new recipes:', error);
          setNewRecipes([]);
          return;
        }

        if (!recipes || recipes.length === 0) {
          setNewRecipes([]);
          return;
        }

        // Fetch display names for the users who added recipes
        const userIds = [...new Set((recipes as any[]).map((r: any) => r.user_id))];
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, display_name')
          .in('id', userIds);

        const nameMap = new Map<string, string>();
        (users as any[])?.forEach((u: any) => nameMap.set(u.id, u.display_name || 'Someone'));

        const enriched: NewRecipeWithAuthor[] = (recipes as any[]).map((r: any) => ({
          id: r.id,
          title: r.title,
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          imageUrl: r.image_url,
          sourceUrl: r.source_url,
          lastCookedDate: r.last_cooked_date,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          tags: r.tags || [],
          addedByName: nameMap.get(r.user_id) || 'Someone',
        }));

        setNewRecipes(enriched);
      } catch (err) {
        console.error('useNewRecipes error:', err);
        setNewRecipes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNewRecipes();
  }, [isAuthenticated, isLocalOnly, householdId, userId, lastSeenAt]);

  // Update last_seen_at on app open (once per session)
  useEffect(() => {
    if (hasUpdatedLastSeen.current) return;
    if (!isAuthenticated || isLocalOnly || !supabase || !userId) return;

    hasUpdatedLastSeen.current = true;

    (supabase as any)
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Failed to update last_seen_at:', error);
      });
  }, [isAuthenticated, isLocalOnly, userId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    newRecipes: dismissed ? [] : newRecipes,
    hasNew: !dismissed && newRecipes.length > 0,
    count: dismissed ? 0 : newRecipes.length,
    loading,
    dismiss,
    dismissed,
  };
}
