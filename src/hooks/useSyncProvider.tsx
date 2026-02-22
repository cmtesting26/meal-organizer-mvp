/**
 * SyncProvider (Sprint 10)
 *
 * React context providing sync state to the entire app.
 * Handles:
 * - Online/offline detection
 * - Automatic sync queue processing on reconnect
 * - Supabase Realtime subscriptions for recipes & schedule_entries
 * - Sync status exposure for UI indicators
 *
 * @module useSyncProvider
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  processSyncQueue,
  getSyncQueueLength,
  pullFromCloud,
  getBackoffDelay,
  type SyncState,
  type SyncStatus,
} from '@/lib/syncService';
import { db } from '@/lib/database';
import type { Recipe, ScheduleEntry } from '@/types/recipe';
import type { RecipeRow, ScheduleEntryRow } from '@/types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SyncContextValue {
  syncState: SyncState;
  /** Force a full sync (pull + push queue) */
  forceSync: () => Promise<void>;
  /** Whether sync is available (authenticated + configured) */
  syncAvailable: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  syncState: {
    status: 'offline',
    lastSyncedAt: null,
    queueLength: 0,
    error: null,
  },
  forceSync: async () => {},
  syncAvailable: false,
});

export function useSyncState(): SyncContextValue {
  return useContext(SyncContext);
}

// ---------------------------------------------------------------------------
// Helpers: map cloud rows to local
// ---------------------------------------------------------------------------

function cloudRecipeToLocal(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    imageUrl: row.image_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    lastCookedDate: row.last_cooked_date ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cloudScheduleToLocal(row: ScheduleEntryRow): ScheduleEntry {
  return {
    id: row.id,
    recipeId: row.recipe_id ?? '',
    date: row.date,
    mealType: row.meal_type,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated, profile } = useAuth();
  const householdId = profile?.householdId ?? null;

  const [syncState, setSyncState] = useState<SyncState>({
    status: navigator.onLine ? 'synced' : 'offline',
    lastSyncedAt: null,
    queueLength: 0,
    error: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncAvailable = isSupabaseConfigured && isAuthenticated && !!householdId;

  // Update status helper
  const setStatus = useCallback((status: SyncStatus, error?: string | null) => {
    setSyncState((prev) => ({
      ...prev,
      status,
      error: error ?? null,
      ...(status === 'synced' ? { lastSyncedAt: new Date().toISOString() } : {}),
    }));
  }, []);

  // Update queue length
  const refreshQueueLength = useCallback(async () => {
    try {
      const len = await getSyncQueueLength();
      setSyncState((prev) => ({ ...prev, queueLength: len }));
    } catch {
      // Ignore errors reading queue
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Full sync: pull from cloud + process queue
  // ---------------------------------------------------------------------------
  const performSync = useCallback(async () => {
    if (!syncAvailable || !householdId || !navigator.onLine) return;

    setStatus('syncing');

    try {
      // 1. Pull cloud data
      await pullFromCloud(householdId);

      // 2. Process outbound queue
      await processSyncQueue(householdId);

      // 3. Update state
      await refreshQueueLength();
      retryCountRef.current = 0;
      setStatus('synced');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      console.error('[SyncProvider] Sync failed:', message);

      // Schedule retry with exponential backoff
      retryCountRef.current++;
      if (retryCountRef.current <= 5) {
        const delay = getBackoffDelay(retryCountRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          performSync();
        }, delay);
      }

      setStatus('error', message);
    }
  }, [syncAvailable, householdId, setStatus, refreshQueueLength]);

  // Public force sync
  const forceSync = useCallback(async () => {
    retryCountRef.current = 0;
    await performSync();
  }, [performSync]);

  // ---------------------------------------------------------------------------
  // Online / offline detection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      setStatus(syncAvailable ? 'syncing' : 'synced');
      if (syncAvailable) {
        performSync();
      }
    };

    const handleOffline = () => {
      setStatus('offline');
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncAvailable, performSync, setStatus]);

  // ---------------------------------------------------------------------------
  // Supabase Realtime subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!syncAvailable || !supabase || !householdId) {
      // Clean up any existing channel
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel(`household-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload) => {
          try {
            if (payload.eventType === 'DELETE' && payload.old) {
              await db.recipes.delete((payload.old as { id: string }).id);
            } else if (payload.new) {
              const localRecipe = cloudRecipeToLocal(payload.new as RecipeRow);
              const existing = await db.recipes.get(localRecipe.id);
              if (!existing || localRecipe.updatedAt >= existing.updatedAt) {
                await db.recipes.put(localRecipe);
              }
            }
          } catch (err) {
            console.warn('[SyncProvider] Realtime recipe handler error:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_entries',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload) => {
          try {
            if (payload.eventType === 'DELETE' && payload.old) {
              await db.scheduleEntries.delete((payload.old as { id: string }).id);
            } else if (payload.new) {
              const localEntry = cloudScheduleToLocal(payload.new as ScheduleEntryRow);
              await db.scheduleEntries.put(localEntry);
            }
          } catch (err) {
            console.warn('[SyncProvider] Realtime schedule handler error:', err);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Initial sync on mount
    performSync();

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [syncAvailable, householdId, performSync]);

  // Periodically refresh queue length
  useEffect(() => {
    refreshQueueLength();
    const interval = setInterval(refreshQueueLength, 10000);
    return () => clearInterval(interval);
  }, [refreshQueueLength]);

  return (
    <SyncContext.Provider value={{ syncState, forceSync, syncAvailable }}>
      {children}
    </SyncContext.Provider>
  );
}
