/**
 * Auth Flow Component (Sprint 9)
 *
 * Orchestrates the authentication screens:
 * - Welcome (with "Continue without account" option)
 * - Register (S9-07)
 * - Login (S9-08)
 * - Create Household (S9-09)
 * - Join Household (S9-10)
 * - Forgot Password (S9-12)
 *
 * All screens have an X close button to dismiss and go to the app (S9-11).
 * All strings are i18n'd (S9-13).
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChefHat, Mail, Lock, User, Home, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthScreen } from '../../types/auth';

interface AuthFlowProps {
  /** Called when user wants to skip auth and continue in local-only mode */
  onSkip: () => void;
  /** Called when auth + household setup is complete */
  onComplete: () => void;
}

export function AuthFlow({ onSkip, onComplete }: AuthFlowProps) {
  const [screen, setScreen] = useState<AuthScreen>('welcome');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {screen === 'welcome' && (
          <WelcomeScreen
            onLogin={() => setScreen('login')}
            onRegister={() => setScreen('register')}
            onSkip={onSkip}
          />
        )}
        {screen === 'register' && (
          <RegisterScreen
            onClose={onSkip}
            onBack={() => setScreen('welcome')}
            onSuccess={() => setScreen('create-household')}
            onLoginInstead={() => setScreen('login')}
          />
        )}
        {screen === 'login' && (
          <LoginScreen
            onClose={onSkip}
            onBack={() => setScreen('welcome')}
            onSuccess={onComplete}
            onRegisterInstead={() => setScreen('register')}
            onForgotPassword={() => setScreen('forgot-password')}
          />
        )}
        {screen === 'forgot-password' && (
          <ForgotPasswordScreen
            onClose={onSkip}
            onBack={() => setScreen('login')}
          />
        )}
        {screen === 'create-household' && (
          <CreateHouseholdScreen
            onClose={onSkip}
            onSuccess={onComplete}
            onJoinInstead={() => setScreen('join-household')}
          />
        )}
        {screen === 'join-household' && (
          <JoinHouseholdScreen
            onClose={onSkip}
            onBack={() => setScreen('create-household')}
            onSuccess={onComplete}
          />
        )}
      </div>
    </div>
  );
}

// ─── Welcome Screen ────────────────────────────────────────────────────────

function WelcomeScreen({
  onLogin,
  onRegister,
  onSkip,
}: {
  onLogin: () => void;
  onRegister: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.welcome.title')}</h1>
        <p className="text-gray-500 text-sm">{t('auth.welcome.subtitle')}</p>
      </div>

      <div className="space-y-3">
        <Button onClick={onRegister} className="w-full" size="lg">
          {t('auth.welcome.createAccount')}
        </Button>
        <Button onClick={onLogin} variant="outline" className="w-full" size="lg">
          {t('auth.welcome.signIn')}
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          {t('auth.welcome.continueWithout')}
        </button>
      </div>
    </div>
  );
}

// ─── Register Screen (S9-07) ───────────────────────────────────────────────

function RegisterScreen({
  onClose,
  onBack,
  onSuccess,
  onLoginInstead,
}: {
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  onLoginInstead: () => void;
}) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <AuthCard onClose={onClose} onBack={onBack} title={t('auth.register.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder={t('auth.register.email')}
          value={email}
          onChange={setEmail}
          required
          autoFocus
        />
        <InputField
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder={t('auth.register.password')}
          value={password}
          onChange={setPassword}
          required
        />
        <InputField
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder={t('auth.register.confirmPassword')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.register.creating') : t('auth.register.createAccount')}
        </Button>

        <p className="text-center text-sm text-gray-500">
          {t('auth.register.haveAccount')}{' '}
          <button type="button" onClick={onLoginInstead} className="text-green-600 font-medium hover:underline">
            {t('auth.register.signInInstead')}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

// ─── Login Screen (S9-08) ──────────────────────────────────────────────────

function LoginScreen({
  onClose,
  onBack,
  onSuccess,
  onRegisterInstead,
  onForgotPassword,
}: {
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  onRegisterInstead: () => void;
  onForgotPassword: () => void;
}) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <AuthCard onClose={onClose} onBack={onBack} title={t('auth.login.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder={t('auth.login.email')}
          value={email}
          onChange={setEmail}
          required
          autoFocus
        />
        <InputField
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder={t('auth.login.password')}
          value={password}
          onChange={setPassword}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
        </Button>

        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {t('auth.login.forgotPassword')}
        </button>

        <p className="text-center text-sm text-gray-500">
          {t('auth.login.noAccount')}{' '}
          <button type="button" onClick={onRegisterInstead} className="text-green-600 font-medium hover:underline">
            {t('auth.login.createAccount')}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

// ─── Forgot Password Screen (S9-12) ───────────────────────────────────────

function ForgotPasswordScreen({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthCard onClose={onClose} onBack={onBack} title={t('auth.forgot.sentTitle')}>
        <p className="text-gray-600 text-sm mb-4">{t('auth.forgot.sentMessage')}</p>
        <Button onClick={onBack} variant="outline" className="w-full">
          {t('auth.forgot.backToLogin')}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard onClose={onClose} onBack={onBack} title={t('auth.forgot.title')}>
      <p className="text-gray-500 text-sm mb-4">{t('auth.forgot.description')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder={t('auth.forgot.email')}
          value={email}
          onChange={setEmail}
          required
          autoFocus
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.forgot.sending') : t('auth.forgot.sendReset')}
        </Button>
      </form>
    </AuthCard>
  );
}

// ─── Create Household Screen (S9-09) ──────────────────────────────────────

function CreateHouseholdScreen({
  onClose,
  onSuccess,
  onJoinInstead,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onJoinInstead: () => void;
}) {
  const { t } = useTranslation();
  const { createHousehold, joinHousehold } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // S27-01: If invite code stored, try auto-join first
    const { getStoredInviteCode, clearStoredInviteCode } = await import('../onboarding/OnboardingInvitePath');
    const storedCode = getStoredInviteCode();
    if (storedCode && displayName) {
      const joinResult = await joinHousehold(storedCode, displayName);
      if (!joinResult.error) {
        clearStoredInviteCode();
        setLoading(false);
        onSuccess();
        return;
      }
      // Auto-join failed — redirect to join screen with pre-filled code
      setLoading(false);
      onJoinInstead();
      return;
    }

    const result = await createHousehold(
      householdName || t('auth.household.defaultName'),
      displayName
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <AuthCard onClose={onClose} title={t('auth.household.createTitle')}>
      <p className="text-gray-500 text-sm mb-4">{t('auth.household.createDescription')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={<User className="w-4 h-4" />}
          type="text"
          placeholder={t('auth.household.yourName')}
          value={displayName}
          onChange={setDisplayName}
          required
          autoFocus
        />
        <InputField
          icon={<Home className="w-4 h-4" />}
          type="text"
          placeholder={t('auth.household.householdName')}
          value={householdName}
          onChange={setHouseholdName}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.household.creating') : t('auth.household.create')}
        </Button>

        <p className="text-center text-sm text-gray-500">
          {t('auth.household.haveInvite')}{' '}
          <button type="button" onClick={onJoinInstead} className="text-green-600 font-medium hover:underline">
            {t('auth.household.joinInstead')}
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

// ─── Join Household Screen (S9-10) ────────────────────────────────────────

function JoinHouseholdScreen({
  onClose,
  onBack,
  onSuccess,
}: {
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { joinHousehold } = useAuth();
  // S27-01: Pre-fill invite code from sessionStorage if available
  const [inviteCode, setInviteCode] = useState(() => {
    return sessionStorage.getItem('fork-spoon-invite-code') || '';
  });
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await joinHousehold(inviteCode, displayName);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // S27-01: Clear stored invite code on success
      sessionStorage.removeItem('fork-spoon-invite-code');
      onSuccess();
    }
  };

  return (
    <AuthCard onClose={onClose} onBack={onBack} title={t('auth.household.joinTitle')}>
      <p className="text-gray-500 text-sm mb-4">{t('auth.household.joinDescription')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={<User className="w-4 h-4" />}
          type="text"
          placeholder={t('auth.household.yourName')}
          value={displayName}
          onChange={setDisplayName}
          required
          autoFocus
        />
        <InputField
          icon={<KeyRound className="w-4 h-4" />}
          type="text"
          placeholder={t('auth.household.inviteCode')}
          value={inviteCode}
          onChange={setInviteCode}
          required
          maxLength={6}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.household.joining') : t('auth.household.join')}
        </Button>
      </form>
    </AuthCard>
  );
}

// ─── Shared Components ─────────────────────────────────────────────────────

function AuthCard({
  children,
  title,
  onClose,
  onBack,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 relative">
      {/* X close button (S9-11) */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>

      {/* Back arrow */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-3 left-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
      )}

      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center pt-2">{title}</h2>
      {children}
    </div>
  );
}

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  autoFocus,
  maxLength,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
      />
    </div>
  );
}


