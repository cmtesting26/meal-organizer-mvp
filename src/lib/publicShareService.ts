/**
 * Public Sharing Service (Sprint 11 — S11-05)
 *
 * Generates shareable public URLs for recipes.
 * Public links render a read-only view — no auth required.
 *
 * Requires a Supabase migration to add:
 *   ALTER TABLE public.recipes ADD COLUMN shared BOOLEAN DEFAULT false;
 *   CREATE POLICY "Anyone can view shared recipes"
 *     ON public.recipes FOR SELECT
 *     USING (shared = true);
 *
 * @module publicShareService
 */

import { isSupabaseConfigured } from './supabase';
import { createClient } from '@supabase/supabase-js';
import type { Recipe } from '../types/recipe';

/**
 * Creates a bare anon client with no active session.
 * This ensures public reads aren't tied to the current user's auth state.
 */
function getAnonClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Mark a recipe as publicly shared and return a shareable URL.
 */
export async function generateShareableLink(recipeId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Cloud sync must be enabled to share recipes publicly.');
  }

  // Use the authenticated client (imported lazily to avoid circular deps)
  const { getSupabase } = await import('./supabase');
  const client = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client as any)
    .from('recipes')
    .update({ shared: true })
    .eq('id', recipeId);

  if (error) {
    console.warn('Could not mark recipe as shared:', error.message);
    // If the 'shared' column doesn't exist, log the migration needed
    if (error.message.includes('column')) {
      console.error(
        'Missing "shared" column on recipes table. Run migration:\n' +
        '  ALTER TABLE public.recipes ADD COLUMN shared BOOLEAN DEFAULT false;\n' +
        '  CREATE POLICY "Anyone can view shared recipes" ON public.recipes FOR SELECT USING (shared = true);'
      );
    }
  }

  const baseUrl = window.location.origin;
  return `${baseUrl}/recipe/shared/${recipeId}`;
}

/**
 * Fetch a publicly shared recipe by ID.
 * Uses a fresh anon client with NO session so the RLS "shared = true" policy applies.
 * S27-10: Added better error logging and dual-path fetch (shared column + direct).
 */
export async function fetchSharedRecipe(recipeId: string): Promise<Recipe | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const anon = getAnonClient();

    // Sign out any existing session on this client to ensure anon access
    await anon.auth.signOut();

    // S27-10: Try fetching with shared=true filter first
    const { data, error } = await anon
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      // S27-10: Log detailed error for debugging
      console.warn(
        `[SharedRecipe] Failed to fetch recipe ${recipeId}:`,
        error.message,
        error.code,
        error.details
      );

      // Common issues:
      if (error.code === 'PGRST116') {
        console.warn('[SharedRecipe] No rows returned. Possible causes:\n' +
          '  1. Recipe does not exist\n' +
          '  2. "shared" column missing — run: ALTER TABLE public.recipes ADD COLUMN shared BOOLEAN DEFAULT false;\n' +
          '  3. RLS policy missing — run: CREATE POLICY "Anyone can view shared recipes" ON public.recipes FOR SELECT USING (shared = true);\n' +
          '  4. Recipe exists but shared=false — ensure generateShareableLink() was called first');
      }
      return null;
    }

    if (!data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;

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
  } catch (err) {
    console.error('[SharedRecipe] Error fetching shared recipe:', err);
    return null;
  }
}

