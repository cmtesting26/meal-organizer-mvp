/**
 * Auth Context Provider (Sprint 9 — S9-06, S9-11)
 *
 * Provides authentication state and actions to the entire app.
 * Handles Supabase auth, household management, and local-only fallback.
 *
 * @module AuthContext
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AuthContextValue, Household, UserProfile } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(session && user);
  const isLocalOnly = !isSupabaseConfigured || !isAuthenticated;

  // ─── Fetch user profile and household from Supabase ────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, household_id, display_name, email')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        // User exists in auth but not in public.users yet (needs household setup)
        setProfile(null);
        setHousehold(null);
        return;
      }

      const uData = userData as { id: string; household_id: string; display_name: string | null; email: string | null; last_seen_at?: string | null };

      setProfile({
        id: uData.id,
        householdId: uData.household_id,
        displayName: uData.display_name,
        email: uData.email,
        lastSeenAt: uData.last_seen_at ?? null,
      });

      // Fetch household
      const { data: householdData } = await supabase
        .from('households')
        .select('id, name, invite_code')
        .eq('id', uData.household_id)
        .single();

      if (householdData) {
        const hData = householdData as { id: string; name: string; invite_code: string | null };
        setHousehold({
          id: hData.id,
          name: hData.name,
          inviteCode: hData.invite_code,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  // ─── Initialize auth state on mount ────────────────────────────────

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Sprint 23 production fix: Explicitly exchange PKCE code if present in URL.
    // On Netlify, `detectSessionInUrl` may not fire reliably because the
    // `/auth/callback` rewrite loads index.html and the Supabase client
    // initializes before the URL hash/params are fully available.
    // This explicit check guarantees the code is exchanged on /auth/callback.
    const client = supabase; // capture non-null reference for closures
    const handlePKCECodeExchange = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code && window.location.pathname === '/auth/callback') {
        try {
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('PKCE code exchange failed:', error.message);
          } else if (data.session) {
            // Clean URL after successful exchange
            window.history.replaceState({}, '', '/auth/callback');
          }
        } catch (err) {
          console.error('PKCE exchange error:', err);
        }
      }
    };

    // Run code exchange first, then get session
    handlePKCECodeExchange().then(() => {
      client.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          fetchProfile(initialSession.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ─── Auth Actions ──────────────────────────────────────────────────

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: 'Supabase not configured' };

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: 'Supabase not configured' };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setHousehold(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: 'Supabase not configured' };

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  // ─── Household Actions ─────────────────────────────────────────────

  const createHousehold = useCallback(
    async (householdName: string, displayName: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: 'Supabase not configured' };

      const { error } = await (supabase as any).rpc('create_household', {
        household_name: householdName,
        user_display_name: displayName,
      });

      if (error) return { error: error.message };

      // Refresh profile after household creation
      if (user) {
        await fetchProfile(user.id);
      }

      return {};
    },
    [user, fetchProfile]
  );

  const joinHousehold = useCallback(
    async (inviteCode: string, displayName: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: 'Supabase not configured' };

      const { error } = await (supabase as any).rpc('join_household', {
        invite_code_input: inviteCode,
        user_display_name: displayName,
      });

      if (error) return { error: error.message };

      // Refresh profile after joining
      if (user) {
        await fetchProfile(user.id);
      }

      return {};
    },
    [user, fetchProfile]
  );

  const generateInvite = useCallback(async (): Promise<{
    inviteCode?: string;
    error?: string;
  }> => {
    if (!supabase || !household) return { error: 'No household' };

    const { data, error } = await (supabase as any).rpc('generate_invite', {
      household_id_input: household.id,
    });

    if (error) return { error: error.message };

    const newCode = (data as any)?.invite_code;
    if (newCode) {
      setHousehold((prev) => (prev ? { ...prev, inviteCode: newCode } : prev));
    }

    return { inviteCode: newCode };
  }, [household]);

  // ─── Context Value ─────────────────────────────────────────────────

  const value: AuthContextValue = {
    session,
    user,
    profile,
    household,
    loading,
    isAuthenticated,
    isLocalOnly,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createHousehold,
    joinHousehold,
    generateInvite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
