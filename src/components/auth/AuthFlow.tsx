/**
 * Auth Flow Component — D3 Design
 *
 * Orchestrates authentication screens matching D3 Pencil design (RLhbL / tYJfj / 99utc):
 *   Login (default) → Register → Household Setup
 *   Forgot Password (from Login)
 *
 * Layout: Full-screen #FAF8F6 bg → TopBar (X) → LogoArea → CardWrap → Spacer → Footer
 * Household setup: Back arrow → Title → Create card + Join card
 *
 * X close button on auth screens dismisses to local-only mode.
 * All strings are i18n'd.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isInviteFlow } from '../onboarding/OnboardingInvitePath';
import type { AuthScreen } from '../../types/auth';

interface AuthFlowProps {
  /** Called when user wants to skip auth and continue in local-only mode */
  onSkip: () => void;
  /** Called when auth + household setup is complete */
  onComplete: () => void;
}

export function AuthFlow({ onSkip, onComplete }: AuthFlowProps) {
  const [screen, setScreen] = useState<AuthScreen>('login');

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ backgroundColor: '#FAF8F6' }}
    >
      {screen === 'login' && (
        <LoginScreen
          onClose={onSkip}
          onSuccess={onComplete}
          onRegisterInstead={() => setScreen('register')}
          onForgotPassword={() => setScreen('forgot-password')}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen
          onClose={onSkip}
          onSuccess={() => setScreen('create-household')}
          onLoginInstead={() => setScreen('login')}
        />
      )}
      {screen === 'forgot-password' && (
        <ForgotPasswordScreen
          onClose={onSkip}
          onBack={() => setScreen('login')}
        />
      )}
      {(screen === 'create-household' || screen === 'join-household') && (
        <HouseholdSetupScreen
          onBack={() => setScreen('register')}
          onSuccess={onComplete}
        />
      )}
    </div>
  );
}

// ─── Shared Layout Components ─────────────────────────────────────────────

/** TopBar: height 44, padding [0,16], X button 44×44 rounded-16, icon 20×20 #7A6E66 */
function TopBar({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center justify-end"
      style={{ height: 44, padding: '0 16px' }}
    >
      <button
        onClick={onClose}
        className="flex items-center justify-center transition-colors"
        style={{ width: 44, height: 44, borderRadius: 16, background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label={t('common.close')}
      >
        <X style={{ width: 20, height: 20, color: '#7A6E66' }} />
      </button>
    </div>
  );
}

/** LogoArea: vertical, center, gap 6, padding [16,24,32,24] — logo 48×48 r11, name #2D2522 Fraunces 28/600, tagline #7A6E66 DM Sans 14 */
function LogoArea() {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: 6, padding: '16px 24px 32px 24px', width: '100%' }}
    >
      <img
        src="/icons/logo-mark.png"
        alt="Fork & Spoon"
        style={{ width: 48, height: 48, borderRadius: 11, objectFit: 'cover' }}
      />
      <h1
        className="text-center"
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 28,
          fontWeight: 600,
          color: '#2D2522',
          letterSpacing: '-0.5px',
        }}
      >
        {t('app.name')}
      </h1>
      <p
        className="text-center"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 400,
          color: '#7A6E66',
        }}
      >
        {t('auth.tagline')}
      </p>
    </div>
  );
}

/** AuthCard: white, rounded-20, shadow 0 2px blur 8 #0000001A, padding 24, gap 16 */
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        gap: 16,
        boxShadow: '0 2px 8px #0000001A',
      }}
    >
      {children}
    </div>
  );
}

/** OrDivider: line + "or" + line, gap 12, text DM Sans 12/500 #7A6E66 */
function OrDivider({ standalone }: { standalone?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center"
      style={{ gap: 12, ...(standalone ? { margin: '16px 0' } : {}) }}
    >
      <div className="flex-1" style={{ height: 1, backgroundColor: '#E8DDD8' }} />
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: '#7A6E66',
        }}
      >
        {t('auth.or')}
      </span>
      <div className="flex-1" style={{ height: 1, backgroundColor: '#E8DDD8' }} />
    </div>
  );
}

/** Footer: DM Sans 11 #7A6E66 center, padding [20,24] */
function AuthFooter() {
  const { t } = useTranslation();
  return (
    <p
      className="text-center"
      style={{
        padding: '20px 24px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        color: '#7A6E66',
      }}
    >
      {t('auth.footer')}
    </p>
  );
}

/** Input: height 48, rounded-12, border 1px #C5B5AB inside, padding [0,14], DM Sans 14 #7A6E66 placeholder */
function InputField({
  type,
  placeholder,
  value,
  onChange,
  required,
  autoFocus,
  maxLength,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      autoFocus={autoFocus}
      maxLength={maxLength}
      aria-label={placeholder}
      style={{
        width: '100%',
        height: 48,
        borderRadius: 12,
        border: '1px solid #C5B5AB',
        padding: '0 14px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: '#2D2522',
        backgroundColor: '#FFFFFF',
        outline: 'none',
      }}
    />
  );
}

/** Primary CTA: height 48, rounded-14, bg #D4644E, DM Sans 16/600 white */
function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full transition-colors disabled:opacity-50"
      style={{
        height: 48,
        borderRadius: 14,
        backgroundColor: '#D4644E',
        color: '#FFFFFF',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 16,
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** Outline button: height 48, rounded-14, border 1px #C5B5AB, DM Sans 16/600 #2D2522 */
function OutlineButton({
  children,
  type = 'button',
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full transition-colors disabled:opacity-50"
      style={{
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        color: '#2D2522',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 16,
        fontWeight: 600,
        border: '1px solid #C5B5AB',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────

function LoginScreen({
  onClose,
  onSuccess,
  onRegisterInstead,
  onForgotPassword,
}: {
  onClose: () => void;
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
    <div className="flex flex-col min-h-full">
      <TopBar onClose={onClose} />
      <LogoArea />
      {/* CardWrap: padding [0,24] */}
      <div style={{ padding: '0 24px' }}>
        <AuthCard>
          {/* Title: Fraunces 22/600 #2D2522 letterSpacing -0.5 */}
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#2D2522',
              letterSpacing: '-0.5px',
            }}
          >
            {t('auth.login.welcomeBack')}
          </h2>
          {/* Subtitle: DM Sans 14 #7A6E66 */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#7A6E66',
            }}
          >
            {t('auth.login.subtitle')}
          </p>
          {/* Form fields — each is a direct card child via gap 16 */}
          <form onSubmit={handleSubmit} className="contents">
            <InputField
              type="email"
              placeholder={t('auth.login.email')}
              value={email}
              onChange={setEmail}
              required
              autoFocus
            />
            <InputField
              type="password"
              placeholder={t('auth.login.password')}
              value={password}
              onChange={setPassword}
              required
            />
            {error && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                {error}
              </p>
            )}
            {/* SignInGroup: vertical gap 10 — signInBtn + forgotLink */}
            <div className="flex flex-col" style={{ gap: 10 }}>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
              </PrimaryButton>
              <button
                type="button"
                onClick={onForgotPassword}
                className="transition-colors"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#D4644E',
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>
            <OrDivider />
            <OutlineButton onClick={onRegisterInstead}>
              {t('auth.welcome.createAccount')}
            </OutlineButton>
          </form>
        </AuthCard>
      </div>
      {/* Spacer pushes footer to bottom */}
      <div className="flex-1" />
      <AuthFooter />
    </div>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────

function RegisterScreen({
  onClose,
  onSuccess,
  onLoginInstead,
}: {
  onClose: () => void;
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
    <div className="flex flex-col min-h-full">
      <TopBar onClose={onClose} />
      <LogoArea />
      <div style={{ padding: '0 24px' }}>
        <AuthCard>
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 22,
              fontWeight: 600,
              color: '#2D2522',
              letterSpacing: '-0.5px',
            }}
          >
            {t('auth.register.title')}
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#7A6E66',
            }}
          >
            {t('auth.register.subtitle')}
          </p>
          <form onSubmit={handleSubmit} className="contents">
            <InputField
              type="email"
              placeholder={t('auth.register.email')}
              value={email}
              onChange={setEmail}
              required
              autoFocus
            />
            <InputField
              type="password"
              placeholder={t('auth.register.password')}
              value={password}
              onChange={setPassword}
              required
            />
            <InputField
              type="password"
              placeholder={t('auth.register.confirmPassword')}
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
            {error && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                {error}
              </p>
            )}
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('auth.register.creating') : t('auth.register.createAccount')}
            </PrimaryButton>
            <OrDivider />
            <OutlineButton onClick={onLoginInstead}>
              {t('auth.register.signInInstead')}
            </OutlineButton>
          </form>
        </AuthCard>
      </div>
      <div className="flex-1" />
      <AuthFooter />
    </div>
  );
}

// ─── Forgot Password Screen ──────────────────────────────────────────────

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

  return (
    <div className="flex flex-col min-h-full">
      <TopBar onClose={onClose} />
      <LogoArea />
      <div style={{ padding: '0 24px' }}>
        <AuthCard>
          {sent ? (
            <>
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#2D2522',
                  letterSpacing: '-0.5px',
                }}
              >
                {t('auth.forgot.sentTitle')}
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#7A6E66',
                }}
              >
                {t('auth.forgot.sentMessage')}
              </p>
              <OutlineButton onClick={onBack}>
                {t('auth.forgot.backToLogin')}
              </OutlineButton>
            </>
          ) : (
            <>
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#2D2522',
                  letterSpacing: '-0.5px',
                }}
              >
                {t('auth.forgot.title')}
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#7A6E66',
                }}
              >
                {t('auth.forgot.description')}
              </p>
              <form onSubmit={handleSubmit} className="contents">
                <InputField
                  type="email"
                  placeholder={t('auth.forgot.email')}
                  value={email}
                  onChange={setEmail}
                  required
                  autoFocus
                />
                {error && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                    {error}
                  </p>
                )}
                <PrimaryButton type="submit" disabled={loading}>
                  {loading ? t('auth.forgot.sending') : t('auth.forgot.sendReset')}
                </PrimaryButton>
                <OutlineButton onClick={onBack}>
                  {t('auth.forgot.backToLogin')}
                </OutlineButton>
              </form>
            </>
          )}
        </AuthCard>
      </div>
      <div className="flex-1" />
      <AuthFooter />
    </div>
  );
}

// ─── Household Setup Screen (Combined Create + Join) ─────────────────────

function HouseholdSetupScreen({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { createHousehold, joinHousehold } = useAuth();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createHouseholdName, setCreateHouseholdName] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Join form state
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState(() =>
    sessionStorage.getItem('fork-spoon-invite-code') || ''
  );
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Hide "Create Household" when user arrived via invite link
  const inviteOnly = isInviteFlow();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    // S27-01: If invite code stored, try auto-join first
    const { getStoredInviteCode, clearStoredInviteCode } = await import('../onboarding/OnboardingInvitePath');
    const storedCode = getStoredInviteCode();
    if (storedCode && createName) {
      const joinResult = await joinHousehold(storedCode, createName);
      if (!joinResult.error) {
        clearStoredInviteCode();
        setCreateLoading(false);
        onSuccess();
        return;
      }
    }

    const result = await createHousehold(
      createHouseholdName || t('auth.household.defaultName'),
      createName
    );
    setCreateLoading(false);
    if (result.error) {
      setCreateError(result.error);
    } else {
      onSuccess();
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinLoading(true);
    const result = await joinHousehold(joinCode, joinName);
    setJoinLoading(false);
    if (result.error) {
      setJoinError(result.error);
    } else {
      sessionStorage.removeItem('fork-spoon-invite-code');
      onSuccess();
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar with back arrow */}
      <div
        className="flex items-center"
        style={{ height: 44, padding: '0 16px' }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center transition-colors"
          style={{ width: 44, height: 44, borderRadius: 16, background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Back"
        >
          <ArrowLeft style={{ width: 20, height: 20, color: '#2D2522' }} />
        </button>
      </div>

      <div style={{ padding: '0 24px 48px' }}>
        {/* Page title */}
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 26,
            fontWeight: 700,
            color: '#2D2522',
            marginBottom: 8,
          }}
        >
          {inviteOnly ? t('auth.household.joinTitle') : t('auth.household.createTitle')}
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#7A6E66',
            marginBottom: 24,
            maxWidth: 280,
          }}
        >
          {inviteOnly ? t('auth.household.joinDescription') : t('auth.household.setupSubtitle')}
        </p>

        {/* Create Household card — hidden when user arrived via invite link */}
        {!inviteOnly && (
          <>
            <AuthCard>
              <h3
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#2D2522',
                }}
              >
                {t('auth.household.createCardTitle')}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#7A6E66',
                }}
              >
                {t('auth.household.createCardSubtitle')}
              </p>
              <form onSubmit={handleCreate} className="contents">
                <InputField
                  type="text"
                  placeholder={t('auth.household.yourName')}
                  value={createName}
                  onChange={setCreateName}
                  required
                  autoFocus
                />
                <InputField
                  type="text"
                  placeholder={t('auth.household.householdName')}
                  value={createHouseholdName}
                  onChange={setCreateHouseholdName}
                />
                {createError && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                    {createError}
                  </p>
                )}
                <PrimaryButton type="submit" disabled={createLoading}>
                  {createLoading ? t('auth.household.creating') : t('auth.household.create')}
                </PrimaryButton>
              </form>
            </AuthCard>

            {/* "or" divider between cards */}
            <OrDivider standalone />
          </>
        )}

        {/* Join Household card */}
        <AuthCard>
          <h3
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 18,
              fontWeight: 600,
              color: '#2D2522',
            }}
          >
            {t('auth.household.joinCardTitle')}
          </h3>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#7A6E66',
            }}
          >
            {t('auth.household.joinCardSubtitle')}
          </p>
          <form onSubmit={handleJoin} className="contents">
            <InputField
              type="text"
              placeholder={t('auth.household.yourName')}
              value={joinName}
              onChange={setJoinName}
              required
              autoFocus={inviteOnly}
            />
            <InputField
              type="text"
              placeholder={t('auth.household.inviteCode')}
              value={joinCode}
              onChange={setJoinCode}
              required
              maxLength={6}
            />
            {joinError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC2626' }}>
                {joinError}
              </p>
            )}
            {inviteOnly ? (
              <PrimaryButton type="submit" disabled={joinLoading}>
                {joinLoading ? t('auth.household.joining') : t('auth.household.join')}
              </PrimaryButton>
            ) : (
              <OutlineButton type="submit" disabled={joinLoading}>
                {joinLoading ? t('auth.household.joining') : t('auth.household.join')}
              </OutlineButton>
            )}
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
