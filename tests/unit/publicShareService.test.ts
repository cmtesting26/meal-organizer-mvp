/**
 * Public Sharing Service Tests (Sprint 11 — S11-10)
 *
 * Tests for generating shareable links and fetching shared recipes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables for getAnonClient
vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key');

// Mock createClient from supabase-js (used by getAnonClient)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-id',
              title: 'Test Recipe',
              ingredients: ['item1'],
              instructions: ['step1'],
              image_url: null,
              source_url: 'https://example.com',
              last_cooked_date: null,
              tags: ['tag1'],
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
            error: null,
          }),
        }),
      }),
    })),
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

// Mock the local supabase module
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {},
  getSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })),
  }),
}));

import { generateShareableLink, fetchSharedRecipe } from '@/lib/publicShareService';

describe('Public Sharing Service', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://mealorganizer.app' },
      writable: true,
    });
  });

  describe('generateShareableLink', () => {
    it('should generate a URL with the recipe ID', async () => {
      const url = await generateShareableLink('recipe-123');
      expect(url).toBe('https://mealorganizer.app/recipe/shared/recipe-123');
    });
  });

  describe('fetchSharedRecipe', () => {
    it('should return a mapped recipe from Supabase', async () => {
      const recipe = await fetchSharedRecipe('test-id');

      expect(recipe).not.toBeNull();
      expect(recipe!.id).toBe('test-id');
      expect(recipe!.title).toBe('Test Recipe');
      expect(recipe!.ingredients).toEqual(['item1']);
      expect(recipe!.sourceUrl).toBe('https://example.com');
      expect(recipe!.tags).toEqual(['tag1']);
    });
  });
});
