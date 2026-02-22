/**
 * useCookFrequency Hook (Sprint 21)
 *
 * Aggregates cook frequency per recipe from schedule_entries.
 * Returns total cook count, this-month count, and this-year count.
 *
 * Works in both Supabase (cloud) and local-only (IndexedDB) modes.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27–28
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/database';

interface CookFrequencyData {
  /** Total number of times this recipe has been cooked (all time) */
  total: number;
  /** Number of times cooked this calendar month */
  thisMonth: number;
  /** Number of times cooked this calendar year */
  thisYear: number;
}

interface UseCookFrequencyReturn {
  /** Frequency data for a single recipe (when recipeId is provided) */
  frequency: CookFrequencyData;
  /** Map of recipeId → CookFrequencyData for all recipes */
  frequencyMap: Map<string, CookFrequencyData>;
  /** Recipes ranked by total cook count descending */
  mostCooked: Array<{ recipeId: string; total: number }>;
  /** Whether data is loading */
  loading: boolean;
}

const EMPTY_FREQUENCY: CookFrequencyData = { total: 0, thisMonth: 0, thisYear: 0 };

/**
 * Hook to get cook frequency stats.
 *
 * @param recipeId - Optional: get stats for a specific recipe.
 *                   When omitted, loads stats for ALL recipes (for Most Cooked view).
 */
export function useCookFrequency(recipeId?: string): UseCookFrequencyReturn {
  const [frequencyMap, setFrequencyMap] = useState<Map<string, CookFrequencyData>>(new Map());
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, isLocalOnly, profile } = useAuth();
  const householdId = profile?.householdId ?? null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const loadFrequencies = useCallback(async () => {
    setLoading(true);
    try {
      const map = new Map<string, CookFrequencyData>();
      const today = new Date().toISOString().split('T')[0];

      if (isAuthenticated && !isLocalOnly && supabase && householdId) {
        // ── Cloud mode: query Supabase schedule_entries ──
        let query = (supabase as any)
          .from('schedule_entries')
          .select('recipe_id, date')
          .eq('household_id', householdId);

        if (recipeId) {
          query = query.eq('recipe_id', recipeId);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Cook frequency query error:', error);
          setFrequencyMap(map);
          return;
        }

        if (data) {
          for (const entry of data as any[]) {
            if ((entry.date as string) >= today) continue; // only count past entries
            const rid = entry.recipe_id;
            const [yearStr, monthStr] = (entry.date as string).split('-');
            const entryYear = parseInt(yearStr, 10);
            const entryMonth = parseInt(monthStr, 10) - 1; // 0-indexed
            const existing = map.get(rid) || { total: 0, thisMonth: 0, thisYear: 0 };

            existing.total += 1;
            if (entryYear === currentYear) {
              existing.thisYear += 1;
              if (entryMonth === currentMonth) {
                existing.thisMonth += 1;
              }
            }

            map.set(rid, existing);
          }
        }
      } else {
        // ── Local-only mode: query IndexedDB ──
        try {
          const entries = await (db as any).scheduleEntries?.toArray() ?? [];
          const filtered = recipeId
            ? entries.filter((e: any) => e.recipeId === recipeId)
            : entries;

          for (const entry of filtered) {
            if ((entry.date as string) >= today) continue; // only count past entries
            const rid = entry.recipeId;
            const [yearStr, monthStr] = (entry.date as string).split('-');
            const entryYear = parseInt(yearStr, 10);
            const entryMonth = parseInt(monthStr, 10) - 1; // 0-indexed
            const existing = map.get(rid) || { total: 0, thisMonth: 0, thisYear: 0 };

            existing.total += 1;
            if (entryYear === currentYear) {
              existing.thisYear += 1;
              if (entryMonth === currentMonth) {
                existing.thisMonth += 1;
              }
            }

            map.set(rid, existing);
          }
        } catch {
          // IndexedDB might not be available
        }
      }

      setFrequencyMap(map);
    } catch (err) {
      console.error('useCookFrequency error:', err);
      setFrequencyMap(new Map());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLocalOnly, householdId, recipeId, currentYear, currentMonth]);

  useEffect(() => {
    loadFrequencies();
  }, [loadFrequencies]);

  // Single recipe frequency
  const frequency = useMemo(
    () => (recipeId ? frequencyMap.get(recipeId) || EMPTY_FREQUENCY : EMPTY_FREQUENCY),
    [frequencyMap, recipeId],
  );

  // Most cooked ranking (sorted by total desc)
  const mostCooked = useMemo(() => {
    const entries: Array<{ recipeId: string; total: number }> = [];
    frequencyMap.forEach((data, id) => {
      if (data.total > 0) {
        entries.push({ recipeId: id, total: data.total });
      }
    });
    return entries.sort((a, b) => b.total - a.total);
  }, [frequencyMap]);

  return {
    frequency,
    frequencyMap,
    mostCooked,
    loading,
  };
}
