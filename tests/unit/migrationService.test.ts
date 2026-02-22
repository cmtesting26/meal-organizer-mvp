/**
 * Migration Service Tests (Sprint 11 — S11-10)
 *
 * Tests for local → cloud data migration, rollback, and detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectLocalData,
  hasLocalData,
  getMigrationStatus,
  type MigrationSummary,
} from '@/lib/migrationService';

// Mock Dexie/IndexedDB
const mockRecipes = [
  {
    id: '1',
    title: 'Pasta',
    ingredients: ['pasta', 'sauce'],
    instructions: ['boil', 'serve'],
    tags: ['italian', 'quick'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Salad',
    ingredients: ['lettuce', 'tomato'],
    instructions: ['chop', 'mix'],
    tags: ['healthy'],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockScheduleEntries = [
  {
    id: 's1',
    recipeId: '1',
    date: '2024-01-15',
    mealType: 'dinner' as const,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
];

// Mock the database module
vi.mock('@/lib/database', () => ({
  db: {
    recipes: {
      count: vi.fn().mockResolvedValue(2),
      toArray: vi.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Pasta',
          ingredients: ['pasta', 'sauce'],
          instructions: ['boil', 'serve'],
          tags: ['italian', 'quick'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'Salad',
          ingredients: ['lettuce', 'tomato'],
          instructions: ['chop', 'mix'],
          tags: ['healthy'],
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ]),
      clear: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
    scheduleEntries: {
      count: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([
        {
          id: 's1',
          recipeId: '1',
          date: '2024-01-15',
          mealType: 'dinner',
          createdAt: '2024-01-15T00:00:00.000Z',
        },
      ]),
      clear: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
    syncQueue: {
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: null,
  getSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

describe('Migration Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('detectLocalData', () => {
    it('should return summary of local data', async () => {
      const summary: MigrationSummary = await detectLocalData();

      expect(summary.recipes).toBe(2);
      expect(summary.scheduleEntries).toBe(1);
      expect(summary.tags).toBe(3); // 'italian', 'quick', 'healthy'
    });
  });

  describe('hasLocalData', () => {
    it('should return true when recipes exist', async () => {
      const result = await hasLocalData();
      expect(result).toBe(true);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return not-started by default', () => {
      expect(getMigrationStatus()).toBe('not-started');
    });

    it('should return stored status', () => {
      localStorage.setItem('meal-org-migration-status', 'completed');
      expect(getMigrationStatus()).toBe('completed');
    });
  });
});
