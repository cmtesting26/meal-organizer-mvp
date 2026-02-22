/**
 * useSchedule Hook (Sprint 10)
 *
 * Provides schedule operations backed by the sync-aware data layer.
 * When authenticated: reads/writes sync with Supabase via syncService.
 * When guest (local-only): operates against IndexedDB only.
 * Manages weekly meal schedule with auto-recency updates.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  addToSchedule,
  removeFromSchedule,
  getScheduleForWeek,
  swapMeals as swapMealsService,
  type WeekSchedule,
} from '@/lib/syncService';
import { useAuth } from '@/hooks/useAuth';
import { getWeekStart, getWeekEnd, toISODateString, getNextWeekStart, getPrevWeekStart } from '@/lib/dateHelpers';

interface UseScheduleReturn {
  weekSchedule: WeekSchedule;
  loading: boolean;
  error: Error | null;
  currentWeekStart: Date;
  addMeal: (recipeId: string, date: string, mealType: 'lunch' | 'dinner') => Promise<void>;
  removeMeal: (entryId: string) => Promise<void>;
  swapMeals: (sourceDate: string, sourceMealType: 'lunch' | 'dinner', targetDate: string, targetMealType: 'lunch' | 'dinner') => Promise<void>;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  goToCurrentWeek: () => void;
  refreshSchedule: () => Promise<void>;
}

export function useSchedule(): UseScheduleReturn {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { profile, user } = useAuth();
  const householdId = profile?.householdId ?? null;
  const userId = user?.id ?? null;

  const loadWeekSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = toISODateString(currentWeekStart);
      const endDate = toISODateString(getWeekEnd(currentWeekStart));
      const schedule = await getScheduleForWeek(startDate, endDate);
      setWeekSchedule(schedule);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load schedule'));
      setWeekSchedule({});
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    loadWeekSchedule();
  }, [loadWeekSchedule]);

  // S27-09: Subscribe to Supabase realtime changes on schedule_entries for household
  useEffect(() => {
    if (!householdId) return;

    let channel: any = null;

    (async () => {
      try {
        const { isSupabaseConfigured } = await import('@/lib/supabase');
        if (!isSupabaseConfigured) return;
        const { getSupabase } = await import('@/lib/supabase');
        const client = getSupabase();

        channel = client
          .channel(`schedule-${householdId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'schedule_entries',
              filter: `household_id=eq.${householdId}`,
            },
            () => {
              // Reload the week schedule when any change occurs
              loadWeekSchedule();
            }
          )
          .subscribe();
      } catch {
        // Realtime not available — fall back to manual refresh
      }
    })();

    return () => {
      if (channel) {
        (async () => {
          try {
            const { getSupabase } = await import('@/lib/supabase');
            getSupabase().removeChannel(channel);
          } catch { /* ignore */ }
        })();
      }
    };
  }, [householdId, loadWeekSchedule]);

  const addMeal = useCallback(
    async (recipeId: string, date: string, mealType: 'lunch' | 'dinner') => {
      await addToSchedule(recipeId, date, mealType, householdId, userId);
      await loadWeekSchedule();
    },
    [loadWeekSchedule, householdId, userId]
  );

  const removeMeal = useCallback(
    async (entryId: string) => {
      await removeFromSchedule(entryId, householdId);
      await loadWeekSchedule();
    },
    [loadWeekSchedule, householdId]
  );

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => getNextWeekStart(prev));
  }, []);

  const goToPrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => getPrevWeekStart(prev));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(getWeekStart(new Date()));
  }, []);

  const swapMeals = useCallback(
    async (sourceDate: string, sourceMealType: 'lunch' | 'dinner', targetDate: string, targetMealType: 'lunch' | 'dinner') => {
      await swapMealsService(sourceDate, sourceMealType, targetDate, targetMealType, householdId, userId);
      await loadWeekSchedule();
    },
    [loadWeekSchedule, householdId, userId]
  );

  return {
    weekSchedule,
    loading,
    error,
    currentWeekStart,
    addMeal,
    removeMeal,
    swapMeals,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    refreshSchedule: loadWeekSchedule,
  };
}
