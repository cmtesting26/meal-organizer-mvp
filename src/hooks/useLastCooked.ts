/**
 * useLastCooked Hook (Sprint 21)
 *
 * Computes "last cooked" dates from schedule entries (the single source of truth).
 * Only considers entries strictly before today — scheduling a meal for today or
 * the future doesn't count as having cooked it.
 *
 * Returns a Map<recipeId, lastCookedDate> for efficient lookups across multiple recipes.
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/database';

/**
 * Returns the most recent past schedule date for every recipe.
 * Recomputes when `refreshKey` changes (e.g., when RecipePicker opens).
 */
export function useLastCooked(refreshKey?: number) {
  const [lastCookedMap, setLastCookedMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const entries = await db.scheduleEntries.toArray();

      const map = new Map<string, string>();
      for (const entry of entries) {
        if (entry.date >= today) continue; // skip today and future
        const current = map.get(entry.recipeId);
        if (!current || entry.date > current) {
          map.set(entry.recipeId, entry.date);
        }
      }

      if (!cancelled) {
        setLastCookedMap(map);
        setLoading(false);
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /**
   * Get the last cooked date for a single recipe.
   * Returns undefined if never scheduled in the past.
   */
  function getLastCookedDate(recipeId: string): string | undefined {
    return lastCookedMap.get(recipeId);
  }

  return { lastCookedMap, getLastCookedDate, loading };
}
