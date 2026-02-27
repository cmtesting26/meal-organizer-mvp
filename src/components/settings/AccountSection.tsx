/**
 * AccountSection (Sprint 12 — S12-05, S12-06, S12-07, S12-08, S12-09)
 *
 * Account & Profile Management section for Settings page.
 * Shows different content based on authentication state:
 *
 * - Authenticated: email, household info, member count, sync status,
 *   invite code, sign out button
 * - Guest: CTA to sign in and enable cloud sync
 *
 * @module AccountSection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Copy,
  Check,
  Users,
  Loader2,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSyncState } from '@/hooks/useSyncProvider';

// ─── Sign-Out Confirmation Dialog ─────────────────────────────────────────

function SignOutConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-xl p-6 max-w-sm mx-4 shadow-xl" style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
          {t('account.signOutConfirmTitle')}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
          {t('account.signOutConfirmMessage')}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('settings.signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sync Status Display ──────────────────────────────────────────────────

function SyncStatusDisplay() {
  const { t } = useTranslation();
  const { syncState, forceSync, syncAvailable } = useSyncState();

  if (!syncAvailable) return null;

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    synced: {
      icon: <Cloud className="w-4 h-4" />,
      label: t('sync.synced'),
      color: 'text-green-600',
    },
    syncing: {
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      label: t('sync.syncing'),
      color: 'text-[var(--fs-accent)]',
    },
    offline: {
      icon: <CloudOff className="w-4 h-4" />,
      label: t('sync.offline'),
      color: 'text-[var(--fs-text-muted)]',
    },
    error: {
      icon: <CloudOff className="w-4 h-4" />,
      label: t('sync.error'),
      color: 'text-red-600',
    },
  };

  const config = statusConfig[syncState.status] || statusConfig.offline;

  const lastSynced = syncState.lastSyncedAt
    ? new Date(syncState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--fs-border-muted, #E8DDD8)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
        {syncState.status !== 'syncing' && (
          <button
            onClick={() => forceSync()}
            className="text-xs underline"
            style={{ color: 'var(--fs-accent-text, #B84835)' }}
          >
            {t('account.syncNow')}
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center gap-4 text-xs" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
        {syncState.queueLength > 0 && (
          <span>{t('account.pendingChanges', { count: syncState.queueLength })}</span>
        )}
        {lastSynced && (
          <span>{t('account.lastSynced', { time: lastSynced })}</span>
        )}
      </div>
    </div>
  );
}

// ─── Household Section ────────────────────────────────────────────────────

function HouseholdSection() {
  const { t } = useTranslation();
  const { household, profile, generateInvite } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  // S27-07: Household members
  const [memberNames, setMemberNames] = useState<string[]>([]);

  // S27-07: Fetch other household members' first names
  useEffect(() => {
    if (!household || !profile) return;
    let cancelled = false;

    (async () => {
      try {
        const { isSupabaseConfigured } = await import('@/lib/supabase');
        if (!isSupabaseConfigured) return;
        const { getSupabase } = await import('@/lib/supabase');
        const client = getSupabase();
        const { data } = await (client as any)
          .from('users')
          .select('display_name')
          .eq('household_id', household.id)
          .neq('id', profile.id);
        if (!cancelled && data) {
          setMemberNames(
            data
              .map((u: { display_name: string | null }) => u.display_name?.split(' ')[0] || '')
              .filter(Boolean)
          );
        }
      } catch {
        // Non-critical — just don't show members
      }
    })();

    return () => { cancelled = true; };
  }, [household, profile]);

  if (!household) return null;

  // S24-04: Build invite URL from invite code
  const inviteUrl = household.inviteCode
    ? `${window.location.origin}/?invite=${household.inviteCode}`
    : null;

  // S24-04: One-tap invite sharing — generates link if needed, then shares
  const handleShareInvite = async () => {
    setShareError(null);
    let url = inviteUrl;

    // Generate invite code if not available
    if (!url) {
      setGeneratingLink(true);
      try {
        await generateInvite();
        // After generating, the household object updates — but we need the code now
        // Re-read from auth state on next render; for now use a fallback
        setGeneratingLink(false);
        return; // The UI will update with the new code and user can tap again
      } catch {
        setShareError(t('account.inviteError', 'Could not generate invite link'));
        setGeneratingLink(false);
        return;
      }
    }

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        // S27-02: Include raw invite code as fallback in share text
        const code = household.inviteCode || '';
        const shareText = code
          ? t('account.inviteShareText', 'Tap this link to join my household and share recipes!') + '\n' + t('account.inviteCodeFallback', '— Your invite code: {{code}}', { code })
          : t('account.inviteShareText', 'Tap this link to join my household and share recipes!');
        await navigator.share({
          title: t('account.inviteShareTitle', 'Join my household on Fork & Spoon'),
          text: shareText,
          url,
        });
        return; // Shared successfully
      } catch {
        // Cancelled or failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setShareError(t('account.clipboardError', 'Could not copy link'));
    }
  };

  return (
    <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--fs-border-muted, #E8DDD8)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
          {household.name}
          {memberNames.length > 0 && (
            <span className="font-normal" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
              {' '}({t('account.togetherWith', { members: memberNames.join(', ') })})
            </span>
          )}
        </span>
      </div>

      {/* S24-04: Simplified one-tap invite */}
      <div
        className="rounded-xl p-3"
        style={{
          backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)',
        }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
          {t('account.invitePartnerLabel', 'Invite your partner to share recipes')}
        </p>
        <button
          onClick={handleShareInvite}
          disabled={generatingLink}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          style={{
            height: '40px',
            backgroundColor: 'var(--fs-accent, #D4644E)',
            color: 'var(--fs-text-inverse, #FFFFFF)',
          }}
        >
          {generatingLink ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              {t('account.linkCopied', 'Link copied!')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t('account.invitePartner', 'Invite Partner')}
            </>
          )}
        </button>

        {/* Invite link status */}
        {inviteUrl && (
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
            {t('account.inviteLinkActive', 'Invite link active')} ✓
          </p>
        )}

        {shareError && (
          <p className="text-xs mt-2 text-center text-red-600">{shareError}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main AccountSection ──────────────────────────────────────────────────

export function AccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut, loading } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setShowSignOutConfirm(false);
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)', boxShadow: 'var(--fs-shadow-sm)' }}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
          <span className="text-sm" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // ─── Guest State (S12-08) ───────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)', boxShadow: 'var(--fs-shadow-sm)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-5 h-5 text-green-600" />
          <p className="font-medium text-sm" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{t('account.guestTitle')}</p>
        </div>
        <p className="text-xs mb-3 ml-8" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
          {t('account.guestDescription')}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => navigate('/auth')}
        >
          <LogIn className="w-4 h-4 mr-2" />
          {t('account.signInCta')}
        </Button>
      </div>
    );
  }

  // ─── Authenticated State (S12-05) ───────────────────────────────────

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)', boxShadow: 'var(--fs-shadow-sm)' }}>
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
          <User className="w-[18px] h-[18px]" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
            {profile?.displayName || profile?.email || t('account.anonymous')}
          </p>
          {profile?.email && profile?.displayName && (
            <p className="text-xs truncate" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{profile.email}</p>
          )}
        </div>
      </div>

      {/* Household Info (S12-09) */}
      <HouseholdSection />

      {/* Sync Status (S12-06) */}
      <SyncStatusDisplay />

      {/* Sign Out (S12-07) */}
      <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--fs-border-muted, #E8DDD8)' }}>
        <button
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            height: '40px',
            color: 'var(--fs-accent, #D4644E)',
            border: '1px solid var(--fs-accent, #D4644E)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => setShowSignOutConfirm(true)}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {t('settings.signOut')}
        </button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <SignOutConfirmDialog
        open={showSignOutConfirm}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
