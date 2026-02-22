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
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('account.signOutConfirmTitle')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
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
      color: 'text-amber-600',
    },
    offline: {
      icon: <CloudOff className="w-4 h-4" />,
      label: t('sync.offline'),
      color: 'text-gray-500',
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
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
        {syncState.status !== 'syncing' && (
          <button
            onClick={() => forceSync()}
            className="text-xs underline"
            style={{ color: 'var(--fs-accent, #D97706)' }}
          >
            {t('account.syncNow')}
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
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
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {household.name}
          {memberNames.length > 0 && (
            <span className="font-normal text-gray-500">
              {' '}({t('account.togetherWith', { members: memberNames.join(', ') })})
            </span>
          )}
        </span>
      </div>

      {/* S24-04: Simplified one-tap invite */}
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
          border: '1px solid var(--fs-border-default, #E7E5E4)',
        }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
          {t('account.invitePartnerLabel', 'Invite your partner to share recipes')}
        </p>
        <button
          onClick={handleShareInvite}
          disabled={generatingLink}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--fs-accent, #D97706)',
            color: 'white',
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
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
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
      <div className="bg-white rounded-lg border p-4 mb-2">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-500">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // ─── Guest State (S12-08) ───────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4 mb-2">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-5 h-5 text-green-600" />
          <p className="font-medium text-gray-900 text-sm">{t('account.guestTitle')}</p>
        </div>
        <p className="text-xs text-gray-600 mb-3 ml-8">
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
    <div className="bg-white rounded-lg border p-4 mb-2">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {profile?.displayName || profile?.email || t('account.anonymous')}
          </p>
          {profile?.email && profile?.displayName && (
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
          )}
        </div>
      </div>

      {/* Household Info (S12-09) */}
      <HouseholdSection />

      {/* Sync Status (S12-06) */}
      <SyncStatusDisplay />

      {/* Sign Out (S12-07) */}
      <div className="border-t pt-3 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          style={{
            color: '#DC2626',
            borderColor: '#FCA5A5',
            backgroundColor: 'transparent',
          }}
          onClick={() => setShowSignOutConfirm(true)}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          {t('settings.signOut')}
        </Button>
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
