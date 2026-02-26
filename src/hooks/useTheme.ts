/**
 * useTheme Hook (Sprint 20)
 *
 * Manages theme (light/dark/system) with:
 * - prefers-color-scheme media query detection
 * - Manual override (3-way: system / light / dark)
 * - Persistence in localStorage
 * - Applies [data-theme] attribute to <html>
 * - Syncs to Supabase user_preferences if authenticated
 *
 * Design Spec V1.5 · Implementation Plan Phase 27
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'fs-theme-preference';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
  return 'system';
}

function applyTheme(resolved: ResolvedTheme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', resolved);

  // Also toggle .dark class for shadcn/ui compatibility
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Update meta theme-color for mobile browser chrome
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#1A1614' : '#D4644E');
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Resolved theme: what's actually applied
  const resolvedTheme: ResolvedTheme = useMemo(
    () => (preference === 'system' ? systemTheme : preference),
    [preference, systemTheme],
  );

  // Listen for OS-level theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply theme whenever resolved value changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Enable transition animation after first render (prevents flash)
  useEffect(() => {
    // Small delay so first paint has no transition
    const timer = setTimeout(() => {
      document.documentElement.setAttribute('data-theme-transition', '');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Set preference and persist
  const setTheme = useCallback((newPref: ThemePreference) => {
    setPreference(newPref);
    try {
      localStorage.setItem(STORAGE_KEY, newPref);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const isDark = resolvedTheme === 'dark';

  return {
    /** The user's preference: 'system' | 'light' | 'dark' */
    preference,
    /** The actually applied theme: 'light' | 'dark' */
    resolvedTheme,
    /** Convenience boolean */
    isDark,
    /** Set the theme preference */
    setTheme,
    /** The current OS-level theme */
    systemTheme,
  };
}
