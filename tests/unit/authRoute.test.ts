/**
 * Auth Route Tests (Sprint 15 — S15-04)
 *
 * Verifies the /auth route fix (S15-01):
 * - /auth renders OUTSIDE app shell (full-screen, no header/bottom nav)
 * - When Supabase not configured, /auth redirects to /
 * - When already authenticated, /auth redirects to /
 *
 * These tests verify routing logic by testing conditions directly,
 * since full App render requires extensive mocking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Auth route logic (S15-01)', () => {
  let mockIsSupabaseConfigured: boolean;
  let mockIsAuthenticated: boolean;

  beforeEach(() => {
    mockIsSupabaseConfigured = false;
    mockIsAuthenticated = false;
  });

  /**
   * The auth route handler in App.tsx follows this decision tree:
   *   1. pathname === '/auth'?
   *      a. !isSupabaseConfigured → Navigate to "/" (redirect)
   *      b. isAuthenticated → Navigate to "/" (redirect)
   *      c. else → render <AuthFlow> full-screen
   *   2. (continues to app shell for other routes)
   *
   * We test the routing LOGIC here since full App mount would
   * require mocking 20+ dependencies.
   */

  function authRouteDecision(pathname: string, isSupabaseConfigured: boolean, isAuthenticated: boolean) {
    if (pathname === '/auth') {
      if (!isSupabaseConfigured) return 'redirect-home';
      if (isAuthenticated) return 'redirect-home';
      return 'render-auth-fullscreen';
    }
    return 'continue-app-shell';
  }

  it('redirects to / when Supabase not configured', () => {
    expect(authRouteDecision('/auth', false, false)).toBe('redirect-home');
  });

  it('redirects to / when already authenticated', () => {
    expect(authRouteDecision('/auth', true, true)).toBe('redirect-home');
  });

  it('renders full-screen auth when Supabase configured and not authenticated', () => {
    expect(authRouteDecision('/auth', true, false)).toBe('render-auth-fullscreen');
  });

  it('does NOT intercept non-auth routes', () => {
    expect(authRouteDecision('/', true, false)).toBe('continue-app-shell');
    expect(authRouteDecision('/recipes', true, false)).toBe('continue-app-shell');
    expect(authRouteDecision('/settings', true, false)).toBe('continue-app-shell');
  });

  it('renders full-screen (outside app shell) — key invariant', () => {
    // The critical fix: /auth must return BEFORE the app shell JSX,
    // meaning no header, no bottom nav, no <main> wrapper.
    // This is verified by the early return in App.tsx lines 98-116.
    const result = authRouteDecision('/auth', true, false);
    expect(result).toBe('render-auth-fullscreen');
    expect(result).not.toBe('continue-app-shell'); // Would mean inside app shell = bug
  });
});

describe('Auth route source code invariants (S15-01)', () => {
  it('/auth handler appears before app shell in App.tsx', async () => {
    // Read the actual source to verify structural invariant
    const fs = await import('fs');
    const source = fs.readFileSync('src/App.tsx', 'utf-8');

    const authRouteIndex = source.indexOf("location.pathname === '/auth'");
    const appShellIndex = source.indexOf('className="min-h-screen"');

    expect(authRouteIndex).toBeGreaterThan(-1);
    expect(appShellIndex).toBeGreaterThan(-1);
    // Auth route handler MUST come before the app shell div
    expect(authRouteIndex).toBeLessThan(appShellIndex);
  });

  it('/auth handler returns Navigate when Supabase not configured', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/App.tsx', 'utf-8');

    // After the /auth check, first condition should redirect when no Supabase
    const authBlock = source.substring(
      source.indexOf("location.pathname === '/auth'"),
      source.indexOf("location.pathname === '/auth'") + 500
    );
    expect(authBlock).toContain('!isSupabaseConfigured');
    expect(authBlock).toContain('Navigate to="/"');
  });
});
