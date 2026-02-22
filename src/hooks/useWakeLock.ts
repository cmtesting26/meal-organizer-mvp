/**
 * useWakeLock Hook (Sprint 19)
 *
 * Integrates Screen Wake Lock API to keep the display on during cooking mode.
 * Acquires wake lock on mount, releases on unmount.
 * Graceful fallback for unsupported browsers (Safari pre-16.4) — returns
 * `isSupported: false` so the UI can show a helpful info toast.
 *
 * Re-acquires after page visibility change (e.g., user switches tabs and comes back).
 *
 * Implementation Plan Phase 26 · Roadmap V1.5 Epic 1
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface WakeLockState {
  /** Whether the Wake Lock API is supported in this browser */
  isSupported: boolean;
  /** Whether a wake lock is currently held */
  isActive: boolean;
  /** Request a wake lock (idempotent if already active) */
  request: () => Promise<void>;
  /** Release the current wake lock */
  release: () => Promise<void>;
}

export function useWakeLock(): WakeLockState {
  const [isSupported] = useState(() => 'wakeLock' in navigator);
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false);
        sentinelRef.current = null;
      });
    } catch {
      // Wake lock request failed (e.g., low battery, page not visible)
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Already released
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Auto-acquire on mount, release on unmount
  useEffect(() => {
    request();
    return () => {
      release();
    };
  }, [request, release]);

  // Re-acquire when page becomes visible again (wake lock is released on visibility change)
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, request]);

  return { isSupported, isActive, request, release };
}
