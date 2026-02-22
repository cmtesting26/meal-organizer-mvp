/**
 * Supabase Client Tests (Sprint 9)
 *
 * Tests for the Supabase client configuration module.
 */

import { describe, it, expect, vi } from 'vitest';

describe('Supabase Client Configuration', () => {
  it('should report as not configured when env vars are empty', async () => {
    // Reset module to test with empty env vars
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    // Dynamic import to re-evaluate the module
    const mod = await import('../../src/lib/supabase');

    // With empty env vars, should not be configured
    expect(mod.isSupabaseConfigured).toBe(false);
    expect(mod.supabase).toBeNull();
  });

  it('getSupabase should throw when not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const mod = await import('../../src/lib/supabase');

    expect(() => mod.getSupabase()).toThrow('Supabase is not configured');
  });
});

describe('Supabase Types', () => {
  it('should export database types', async () => {
    const types = await import('../../src/types/supabase');
    // Just verify the module loads without errors
    expect(types).toBeDefined();
  });

  it('should export auth types', async () => {
    const types = await import('../../src/types/auth');
    expect(types).toBeDefined();
  });
});
