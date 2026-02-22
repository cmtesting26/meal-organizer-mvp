/**
 * Auth Types (Sprint 9)
 *
 * Types for authentication, household management, and user state.
 *
 * @module auth types
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * The shape of household data in the app
 */
export interface Household {
  id: string;
  name: string;
  inviteCode: string | null;
}

/**
 * App user profile (from public.users table)
 */
export interface UserProfile {
  id: string;
  householdId: string;
  displayName: string | null;
  email: string | null;
  /** ISO timestamp of when the user last opened the app (Sprint 21) */
  lastSeenAt: string | null;
}

/**
 * Auth context value provided to the entire app
 */
export interface AuthContextValue {
  /** Supabase session (null if not logged in or local-only) */
  session: Session | null;
  /** Supabase auth user (null if not logged in) */
  user: User | null;
  /** App user profile from public.users (null if not logged in) */
  profile: UserProfile | null;
  /** Current household (null if not logged in) */
  household: Household | null;
  /** Whether we're still loading the initial auth state */
  loading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the app is in local-only mode (no Supabase or not logged in) */
  isLocalOnly: boolean;

  // ─── Auth Actions ──────────────────────────────────────────────────
  /** Sign up with email and password */
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Reset password via email */
  resetPassword: (email: string) => Promise<{ error?: string }>;

  // ─── Household Actions ─────────────────────────────────────────────
  /** Create a new household (first-time signup) */
  createHousehold: (householdName: string, displayName: string) => Promise<{ error?: string }>;
  /** Join an existing household via invite code */
  joinHousehold: (inviteCode: string, displayName: string) => Promise<{ error?: string }>;
  /** Generate a new invite code for the current household */
  generateInvite: () => Promise<{ inviteCode?: string; error?: string }>;
}

/**
 * Auth screen modes for the auth flow
 */
export type AuthScreen =
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'create-household'
  | 'join-household';
