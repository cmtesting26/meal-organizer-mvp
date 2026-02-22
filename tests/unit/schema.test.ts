/**
 * Database Schema Tests (Sprint 9 — S9-14)
 *
 * Validates the SQL migration file structure.
 * Note: Actual RLS security testing requires a live Supabase instance.
 * These tests verify the migration SQL is well-formed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const migrationPath = resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

describe('Database Migration SQL', () => {
  it('should create households table', () => {
    expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS public.households');
    expect(migrationSQL).toContain('id UUID PRIMARY KEY');
    expect(migrationSQL).toContain('invite_code TEXT UNIQUE');
  });

  it('should create users table with auth reference', () => {
    expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS public.users');
    expect(migrationSQL).toContain('REFERENCES auth.users(id)');
    expect(migrationSQL).toContain('household_id UUID NOT NULL REFERENCES public.households');
  });

  it('should create recipes table scoped to household', () => {
    expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS public.recipes');
    expect(migrationSQL).toContain('household_id UUID NOT NULL REFERENCES public.households');
    expect(migrationSQL).toContain("ingredients TEXT[] NOT NULL DEFAULT '{}'");
    expect(migrationSQL).toContain("instructions TEXT[] NOT NULL DEFAULT '{}'");
    expect(migrationSQL).toContain('last_cooked_date DATE');
    expect(migrationSQL).toContain("tags TEXT[] DEFAULT '{}'");
  });

  it('should create schedule_entries table scoped to household', () => {
    expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS public.schedule_entries');
    expect(migrationSQL).toContain('household_id UUID NOT NULL REFERENCES public.households');
    expect(migrationSQL).toContain("meal_type TEXT NOT NULL CHECK (meal_type IN ('lunch', 'dinner'))");
  });

  it('should create tags table scoped to household', () => {
    expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS public.tags');
    expect(migrationSQL).toContain('UNIQUE(household_id, name)');
  });

  it('should create indexes for performance', () => {
    expect(migrationSQL).toContain('idx_users_household');
    expect(migrationSQL).toContain('idx_recipes_household');
    expect(migrationSQL).toContain('idx_recipes_title');
    expect(migrationSQL).toContain('idx_recipes_last_cooked');
    expect(migrationSQL).toContain('idx_schedule_household');
    expect(migrationSQL).toContain('idx_schedule_date');
    expect(migrationSQL).toContain('idx_tags_household');
  });
});

describe('Row-Level Security Policies (S9-14)', () => {
  it('should enable RLS on all tables', () => {
    expect(migrationSQL).toContain('ALTER TABLE public.households ENABLE ROW LEVEL SECURITY');
    expect(migrationSQL).toContain('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY');
    expect(migrationSQL).toContain('ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY');
    expect(migrationSQL).toContain('ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY');
    expect(migrationSQL).toContain('ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY');
  });

  it('should create SELECT policies for household isolation', () => {
    expect(migrationSQL).toContain('"Users can view own household"');
    expect(migrationSQL).toContain('"Authenticated users can view users"');
    expect(migrationSQL).toContain('"Users can view household recipes"');
    expect(migrationSQL).toContain('"Users can view household schedule"');
    expect(migrationSQL).toContain('"Users can view household tags"');
  });

  it('should create INSERT policies for household scoping', () => {
    expect(migrationSQL).toContain('"Users can insert household recipes"');
    expect(migrationSQL).toContain('"Users can insert household schedule"');
    expect(migrationSQL).toContain('"Users can insert household tags"');
    expect(migrationSQL).toContain('"Users can insert own record"');
  });

  it('should create UPDATE policies for household data', () => {
    expect(migrationSQL).toContain('"Users can update household recipes"');
    expect(migrationSQL).toContain('"Users can update household schedule"');
    expect(migrationSQL).toContain('"Users can update household tags"');
  });

  it('should create DELETE policies for household data', () => {
    expect(migrationSQL).toContain('"Users can delete household recipes"');
    expect(migrationSQL).toContain('"Users can delete household schedule"');
    expect(migrationSQL).toContain('"Users can delete household tags"');
  });

  it('should use auth.uid() for RLS enforcement', () => {
    // Count occurrences of auth.uid() — should be used in every policy
    const authUidCount = (migrationSQL.match(/auth\.uid\(\)/g) || []).length;
    // At least 15+ occurrences (one per policy + functions)
    expect(authUidCount).toBeGreaterThanOrEqual(15);
  });

  it('should scope all data access through household_id subquery', () => {
    const householdSubqueryCount = (
      migrationSQL.match(/SELECT household_id FROM public\.users WHERE id = auth\.uid\(\)/g) || []
    ).length;
    // Used in most policies
    expect(householdSubqueryCount).toBeGreaterThanOrEqual(10);
  });
});

describe('Database Functions', () => {
  it('should define create_household function', () => {
    expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION public.create_household');
    expect(migrationSQL).toContain('household_name TEXT');
    expect(migrationSQL).toContain('user_display_name TEXT');
    expect(migrationSQL).toContain('SECURITY DEFINER');
  });

  it('should define join_household function', () => {
    expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION public.join_household');
    expect(migrationSQL).toContain('invite_code_input TEXT');
    expect(migrationSQL).toContain("'Invalid invite code'");
  });

  it('should define generate_invite function', () => {
    expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION public.generate_invite');
    expect(migrationSQL).toContain('household_id_input UUID');
    expect(migrationSQL).toContain("'Access denied: not a member of this household'");
  });

  it('should prevent duplicate household membership in create_household', () => {
    expect(migrationSQL).toContain("'User already belongs to a household'");
  });

  it('should prevent duplicate household membership in join_household', () => {
    // The join function also checks for existing membership
    const matches = (migrationSQL.match(/User already belongs to a household/g) || []);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('should create auto-update trigger for recipes', () => {
    expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION public.update_updated_at');
    expect(migrationSQL).toContain('CREATE TRIGGER recipes_updated_at');
  });
});
