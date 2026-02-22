/**
 * Auth Context Tests (Sprint 9 — S9-15)
 *
 * Tests for the AuthProvider and useAuth hook.
 * Tests auth state management, local-only fallback, and context behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/hooks/useAuth';

// Mock the supabase module
vi.mock('../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

/**
 * Helper component that exposes auth context values for testing
 */
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="isLocalOnly">{String(auth.isLocalOnly)}</span>
      <span data-testid="session">{auth.session ? 'exists' : 'null'}</span>
      <span data-testid="user">{auth.user ? 'exists' : 'null'}</span>
      <span data-testid="profile">{auth.profile ? 'exists' : 'null'}</span>
      <span data-testid="household">{auth.household ? 'exists' : 'null'}</span>
    </div>
  );
}

describe('AuthProvider (local-only mode)', () => {
  it('should provide auth context values', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // In local-only mode, loading should quickly become false
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('should be in local-only mode when Supabase is not configured', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLocalOnly').textContent).toBe('true');
    });
  });

  it('should not be authenticated when Supabase is not configured', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
  });

  it('should have null session, user, profile, and household in local-only mode', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('session').textContent).toBe('null');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('profile').textContent).toBe('null');
      expect(screen.getByTestId('household').textContent).toBe('null');
    });
  });
});

describe('useAuth hook', () => {
  it('should throw when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    function BadComponent() {
      useAuth();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    spy.mockRestore();
  });

  it('should return signUp function that returns error when Supabase not configured', async () => {
    function SignUpTest() {
      const { signUp } = useAuth();
      const [result, setResult] = React.useState('');

      return (
        <div>
          <button onClick={async () => {
            const r = await signUp('test@test.com', 'password');
            setResult(r.error || 'success');
          }}>
            Sign Up
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    }

    render(
      <AuthProvider>
        <SignUpTest />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('Supabase not configured');
    });
  });

  it('should return signIn function that returns error when Supabase not configured', async () => {
    function SignInTest() {
      const { signIn } = useAuth();
      const [result, setResult] = React.useState('');

      return (
        <div>
          <button onClick={async () => {
            const r = await signIn('test@test.com', 'password');
            setResult(r.error || 'success');
          }}>
            Sign In
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    }

    render(
      <AuthProvider>
        <SignInTest />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('Supabase not configured');
    });
  });

  it('should return resetPassword function that returns error when Supabase not configured', async () => {
    function ResetTest() {
      const { resetPassword } = useAuth();
      const [result, setResult] = React.useState('');

      return (
        <div>
          <button onClick={async () => {
            const r = await resetPassword('test@test.com');
            setResult(r.error || 'success');
          }}>
            Reset
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    }

    render(
      <AuthProvider>
        <ResetTest />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('Supabase not configured');
    });
  });
});

import React from 'react';
