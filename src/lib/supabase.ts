/**
 * Supabase Client Configuration (Sprint 9)
 *
 * Initializes the Supabase client for authentication and cloud sync.
 * Falls back gracefully when credentials are not configured (local-only mode).
 *
 * @module supabase
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Whether Supabase is configured with valid credentials.
 * When false, the app operates in local-only mode (IndexedDB only).
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client instance.
 * Only usable when isSupabaseConfigured is true.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

/**
 * Get the Supabase client, throwing if not configured.
 * Use this in code paths that require cloud connectivity.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
  return supabase;
}
