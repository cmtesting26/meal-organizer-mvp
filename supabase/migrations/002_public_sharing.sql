-- =============================================================================
-- Sprint 11: Add public recipe sharing support
-- =============================================================================
-- Adds a `shared` boolean column to recipes and an RLS policy that allows
-- anonymous (unauthenticated) users to read shared recipes.
--
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- Add shared column
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT false;

-- Create index for shared lookups
CREATE INDEX IF NOT EXISTS idx_recipes_shared ON public.recipes(shared) WHERE shared = true;

-- Allow anonymous users to read shared recipes
-- This policy lets anyone (even unauthenticated) SELECT a recipe where shared = true
CREATE POLICY "Anyone can view shared recipes"
  ON public.recipes
  FOR SELECT
  TO anon
  USING (shared = true);
