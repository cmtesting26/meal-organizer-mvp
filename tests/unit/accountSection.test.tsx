/**
 * Account Section Tests (Sprint 12 — S12-15)
 *
 * Tests authenticated state, guest state CTA, sync status display,
 * household info, and sign-out flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────

// Mock useAuth
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockGenerateInvite = vi.fn().mockResolvedValue({ inviteCode: 'NEW-CODE-123' });
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useSyncProvider', () => ({
  useSyncState: vi.fn(() => ({
    syncState: { status: 'synced', lastSyncedAt: '2026-02-13T12:00:00Z', queueLength: 0 },
    forceSync: vi.fn(),
    syncAvailable: true,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'account.guestTitle': 'Cloud Sync',
        'account.guestDescription': 'Sign in to sync...',
        'account.signInCta': 'Sign in to enable cloud sync',
        'account.anonymous': 'Anonymous User',
        'account.syncNow': 'Sync now',
        'account.pendingChanges': `${opts?.count || 0} pending changes`,
        'account.lastSynced': `Last synced at ${opts?.time || ''}`,
        'account.inviteCode': 'Invite code',
        'account.copyInviteCode': 'Copy invite code',
        'account.regenerateCode': 'Generate new code',
        'account.invitePartnerLabel': 'Invite your partner to share recipes',
        'account.invitePartner': 'Invite Partner',
        'account.linkCopied': 'Link copied!',
        'account.inviteLinkActive': 'Invite link active',
        'account.inviteError': 'Could not generate invite link',
        'account.clipboardError': 'Could not copy link',
        'account.inviteShareTitle': 'Join my household on Fork & Spoon',
        'account.inviteShareText': 'Tap this link to join my household and share recipes!',
        'account.signOutConfirmTitle': 'Sign out?',
        'account.signOutConfirmMessage': 'Your recipes will remain...',
        'settings.signOut': 'Sign Out',
        'common.cancel': 'Cancel',
        'common.loading': 'Loading…',
        'sync.synced': 'Synced',
        'sync.syncing': 'Syncing…',
        'sync.offline': 'Offline',
        'sync.error': 'Error',
      };
      return translations[key] || key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

import { useAuth } from '@/hooks/useAuth';
import { useSyncState } from '@/hooks/useSyncProvider';
import { AccountSection } from '@/components/settings/AccountSection';

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseSyncState = vi.mocked(useSyncState);

function renderAccountSection() {
  return render(
    <MemoryRouter>
      <AccountSection />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AccountSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest state (S12-08)', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLocalOnly: true,
        profile: null,
        household: null,
        session: null,
        user: null,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: mockSignOut,
        resetPassword: vi.fn(),
        createHousehold: vi.fn(),
        joinHousehold: vi.fn(),
        generateInvite: mockGenerateInvite,
      });
    });

    it('shows guest CTA', () => {
      renderAccountSection();
      expect(screen.getByText('Cloud Sync')).toBeTruthy();
      expect(screen.getByText('Sign in to enable cloud sync')).toBeTruthy();
    });

    it('navigates to /auth when CTA clicked', () => {
      renderAccountSection();
      fireEvent.click(screen.getByText('Sign in to enable cloud sync'));
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });

    it('does not show sign out button', () => {
      renderAccountSection();
      expect(screen.queryByText('Sign Out')).toBeNull();
    });
  });

  describe('Authenticated state (S12-05)', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLocalOnly: false,
        profile: {
          id: 'user-1',
          householdId: 'hh-1',
          displayName: 'Chris',
          email: 'chris@example.com',
        },
        household: {
          id: 'hh-1',
          name: 'Test Household',
          inviteCode: 'INVITE-ABC-123',
        },
        session: {} as any,
        user: {} as any,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: mockSignOut,
        resetPassword: vi.fn(),
        createHousehold: vi.fn(),
        joinHousehold: vi.fn(),
        generateInvite: mockGenerateInvite,
      });
    });

    it('shows user display name and email', () => {
      renderAccountSection();
      expect(screen.getByText('Chris')).toBeTruthy();
      expect(screen.getByText('chris@example.com')).toBeTruthy();
    });

    it('shows household name', () => {
      renderAccountSection();
      expect(screen.getByText('Test Household')).toBeTruthy();
    });

    it('shows invite partner button (S24-04)', () => {
      renderAccountSection();
      expect(screen.getByText('Invite Partner')).toBeTruthy();
    });

    it('shows sign out button', () => {
      renderAccountSection();
      expect(screen.getByText('Sign Out')).toBeTruthy();
    });

    it('shows sign out confirmation dialog on click', () => {
      renderAccountSection();
      fireEvent.click(screen.getByText('Sign Out'));
      expect(screen.getByText('Sign out?')).toBeTruthy();
      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('calls signOut when confirmed', async () => {
      renderAccountSection();
      fireEvent.click(screen.getByText('Sign Out'));
      // Click confirm in dialog
      const confirmButtons = screen.getAllByText('Sign Out');
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('cancels sign out on cancel click', () => {
      renderAccountSection();
      fireEvent.click(screen.getByText('Sign Out'));
      fireEvent.click(screen.getByText('Cancel'));
      // Dialog should close
      expect(screen.queryByText('Sign out?')).toBeNull();
    });
  });

  describe('Sync status display (S12-06)', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLocalOnly: false,
        profile: { id: 'u1', householdId: 'h1', displayName: 'User', email: 'u@e.com' },
        household: { id: 'h1', name: 'Home', inviteCode: null },
        session: {} as any,
        user: {} as any,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        createHousehold: vi.fn(),
        joinHousehold: vi.fn(),
        generateInvite: vi.fn(),
      });
    });

    it('shows "Synced" status', () => {
      renderAccountSection();
      expect(screen.getByText('Synced')).toBeTruthy();
    });

    it('shows pending changes count', () => {
      mockedUseSyncState.mockReturnValue({
        syncState: { status: 'syncing', lastSyncedAt: null, queueLength: 3 },
        forceSync: vi.fn(),
        syncAvailable: true,
      } as any);

      renderAccountSection();
      expect(screen.getByText('3 pending changes')).toBeTruthy();
    });

    it('shows last synced time', () => {
      mockedUseSyncState.mockReturnValue({
        syncState: { status: 'synced', lastSyncedAt: '2026-02-13T12:00:00Z', queueLength: 0 },
        forceSync: vi.fn(),
        syncAvailable: true,
      } as any);

      renderAccountSection();
      const container = document.body;
      expect(container.textContent).toContain('Last synced at');
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator while auth is loading', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLocalOnly: true,
        profile: null,
        household: null,
        session: null,
        user: null,
        loading: true,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        createHousehold: vi.fn(),
        joinHousehold: vi.fn(),
        generateInvite: vi.fn(),
      });

      renderAccountSection();
      expect(screen.getByText('Loading…')).toBeTruthy();
    });
  });
});
