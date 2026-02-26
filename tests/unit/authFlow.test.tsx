/**
 * AuthFlow Component Tests — D3 Design
 *
 * Tests for the AuthFlow UI matching D3 Pencil design.
 * Tests login screen (default), navigation between screens, close buttons, and i18n.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { AuthFlow } from '../../src/components/auth/AuthFlow';
import { AuthProvider } from '../../src/hooks/useAuth';

// Mock the supabase module (local-only mode)
vi.mock('../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

function renderAuthFlow(props?: { onSkip?: () => void; onComplete?: () => void }) {
  const onSkip = props?.onSkip ?? vi.fn();
  const onComplete = props?.onComplete ?? vi.fn();

  return {
    onSkip,
    onComplete,
    ...render(
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <AuthFlow onSkip={onSkip} onComplete={onComplete} />
        </AuthProvider>
      </I18nextProvider>
    ),
  };
}

describe('AuthFlow — Login Screen (Default)', () => {
  it('should render login screen by default', () => {
    renderAuthFlow();

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('should call onSkip when X close is clicked', async () => {
    const { onSkip } = renderAuthFlow();

    await userEvent.click(screen.getByLabelText('Close'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('should show forgot password link', () => {
    renderAuthFlow();
    expect(screen.getByText(/Forgot your password/i)).toBeInTheDocument();
  });
});

describe('AuthFlow — Navigation', () => {
  it('should navigate to register screen when Create Account is clicked', async () => {
    renderAuthFlow();

    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Confirm password/i)).toBeInTheDocument();
    });
  });

  it('should navigate to login from register via "Sign In Instead"', async () => {
    renderAuthFlow();

    // Go to register
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    });

    // Switch back to login
    await userEvent.click(screen.getByRole('button', { name: /Sign In Instead/i }));

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('should have X close button on register screen', async () => {
    const { onSkip } = renderAuthFlow();

    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText('Close'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('should navigate from login to forgot password', async () => {
    renderAuthFlow();

    await userEvent.click(screen.getByText(/Forgot your password/i));

    await waitFor(() => {
      expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter your email/i)).toBeInTheDocument();
    });
  });

  it('should show "or" divider on login screen', () => {
    renderAuthFlow();
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('should show app name and tagline on login screen', () => {
    renderAuthFlow();
    expect(screen.getByText('Fork and Spoon')).toBeInTheDocument();
    expect(screen.getByText('Your household recipe planner')).toBeInTheDocument();
  });

  it('should show footer text', () => {
    renderAuthFlow();
    expect(screen.getByText(/Terms & Privacy Policy/i)).toBeInTheDocument();
  });
});

describe('AuthFlow — Registration Validation', () => {
  it('should show password mismatch error', async () => {
    renderAuthFlow();

    // Navigate to register
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/Email address/i), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText(/^Password$/i), 'password123');
    await userEvent.type(screen.getByPlaceholderText(/Confirm password/i), 'different');

    // Submit the form — find the submit button within the form
    const submitButtons = screen.getAllByRole('button', { name: /Create Account/i });
    const formSubmit = submitButtons.find(btn => btn.getAttribute('type') === 'submit') ?? submitButtons[submitButtons.length - 1];
    await userEvent.click(formSubmit);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show password too short error', async () => {
    renderAuthFlow();

    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/Email address/i), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText(/^Password$/i), '12345');
    await userEvent.type(screen.getByPlaceholderText(/Confirm password/i), '12345');

    const submitButtons = screen.getAllByRole('button', { name: /Create Account/i });
    const formSubmit = submitButtons.find(btn => btn.getAttribute('type') === 'submit') ?? submitButtons[submitButtons.length - 1];
    await userEvent.click(formSubmit);

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });
});

describe('AuthFlow — i18n', () => {
  it('should render German text when language is set to DE', async () => {
    await i18n.changeLanguage('de');

    renderAuthFlow();

    expect(screen.getByText('Fork and Spoon')).toBeInTheDocument();
    expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
    expect(screen.getByText(/Euer Rezeptplaner/i)).toBeInTheDocument();
    expect(screen.getByText('Konto erstellen')).toBeInTheDocument();
    expect(screen.getByText('Anmelden')).toBeInTheDocument();

    // Reset to English
    await i18n.changeLanguage('en');
  });
});
