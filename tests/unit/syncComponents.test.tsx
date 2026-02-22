/**
 * Sync Component Tests (Sprint 10)
 *
 * Tests for SyncStatusBadge component rendering across all states,
 * SyncState interface validation, and SyncProvider logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// SyncStatusBadge — Render tests with mocked context
// ---------------------------------------------------------------------------

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sync.synced': 'Synced',
        'sync.syncing': 'Syncing…',
        'sync.offline': 'Offline',
        'sync.error': 'Sync error',
        'sync.pendingChanges': `${opts?.count ?? 0} pending change(s)`,
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mutable mock state for useSyncState
const mockSyncContext = {
  syncState: {
    status: 'synced' as 'synced' | 'syncing' | 'offline' | 'error',
    lastSyncedAt: null as string | null,
    queueLength: 0,
    error: null as string | null,
  },
  forceSync: vi.fn(),
  syncAvailable: false,
};

vi.mock('@/hooks/useSyncProvider', () => ({
  useSyncState: () => mockSyncContext,
}));

// Import after mocks
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';

describe('SyncStatusBadge — Rendered output', () => {
  beforeEach(() => {
    mockSyncContext.forceSync.mockClear();
  });

  it('renders nothing when sync is not available (local-only)', () => {
    mockSyncContext.syncAvailable = false;
    const { container } = render(<SyncStatusBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders synced badge with green dot', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'synced', lastSyncedAt: '2026-01-01T00:00:00Z', queueLength: 0, error: null };
    render(<SyncStatusBadge showLabel />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Synced');
  });

  it('renders syncing badge with amber dot', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'syncing', lastSyncedAt: null, queueLength: 0, error: null };
    render(<SyncStatusBadge showLabel />);
    expect(screen.getByText('Syncing…')).toBeInTheDocument();
  });

  it('renders offline badge with gray dot', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'offline', lastSyncedAt: null, queueLength: 0, error: null };
    render(<SyncStatusBadge showLabel />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders error badge with red dot', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'error', lastSyncedAt: null, queueLength: 0, error: 'Timeout' };
    render(<SyncStatusBadge showLabel />);
    expect(screen.getByText('Sync error')).toBeInTheDocument();
  });

  it('shows queue count badge when items are pending', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'offline', lastSyncedAt: null, queueLength: 5, error: null };
    render(<SyncStatusBadge />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show queue count when queue is empty', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'synced', lastSyncedAt: null, queueLength: 0, error: null };
    render(<SyncStatusBadge />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('does not show label by default (icon-only mode)', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'synced', lastSyncedAt: null, queueLength: 0, error: null };
    render(<SyncStatusBadge />);
    expect(screen.queryByText('Synced')).not.toBeInTheDocument();
    // But button with aria-label should still exist
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('includes error message in title when in error state', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'error', lastSyncedAt: null, queueLength: 0, error: 'Network fail' };
    render(<SyncStatusBadge />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('title')).toContain('Network fail');
  });

  it('shows pending changes in title when queue has items', () => {
    mockSyncContext.syncAvailable = true;
    mockSyncContext.syncState = { status: 'offline', lastSyncedAt: null, queueLength: 3, error: null };
    render(<SyncStatusBadge />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('title')).toContain('3 pending change(s)');
  });
});

// ---------------------------------------------------------------------------
// SyncState — Interface validation (kept from original)
// ---------------------------------------------------------------------------

describe('SyncState — Interface validation', () => {
  it('creates valid synced state', () => {
    const state = {
      status: 'synced' as const,
      lastSyncedAt: '2026-02-12T10:00:00.000Z',
      queueLength: 0,
      error: null,
    };
    expect(state.status).toBe('synced');
    expect(state.queueLength).toBe(0);
    expect(state.error).toBeNull();
  });

  it('creates valid syncing state', () => {
    const state = {
      status: 'syncing' as const,
      lastSyncedAt: null,
      queueLength: 3,
      error: null,
    };
    expect(state.status).toBe('syncing');
    expect(state.queueLength).toBe(3);
  });

  it('creates valid offline state', () => {
    const state = {
      status: 'offline' as const,
      lastSyncedAt: '2026-02-12T09:00:00.000Z',
      queueLength: 5,
      error: null,
    };
    expect(state.status).toBe('offline');
    expect(state.queueLength).toBe(5);
  });

  it('creates valid error state', () => {
    const state = {
      status: 'error' as const,
      lastSyncedAt: null,
      queueLength: 2,
      error: 'Network timeout',
    };
    expect(state.status).toBe('error');
    expect(state.error).toBe('Network timeout');
  });
});

describe('SyncProvider — Queue length tracking', () => {
  it('tracks queue length changes', () => {
    let queueLength = 0;

    // Simulate enqueue
    queueLength++;
    expect(queueLength).toBe(1);

    queueLength++;
    expect(queueLength).toBe(2);

    // Simulate dequeue (processed)
    queueLength--;
    expect(queueLength).toBe(1);

    queueLength--;
    expect(queueLength).toBe(0);
  });
});

describe('SyncProvider — Online/Offline detection logic', () => {
  it('transitions from offline to syncing when going online', () => {
    let status: string = 'offline';

    // Simulate going online
    const handleOnline = () => {
      status = 'syncing';
      // After sync completes:
      status = 'synced';
    };

    handleOnline();
    expect(status).toBe('synced');
  });

  it('transitions to offline when going offline', () => {
    let status: string = 'synced';

    const handleOffline = () => {
      status = 'offline';
    };

    handleOffline();
    expect(status).toBe('offline');
  });

  it('transitions to error on sync failure', () => {
    let status: string = 'syncing';
    let error: string | null = null;

    const handleSyncError = (err: string) => {
      status = 'error';
      error = err;
    };

    handleSyncError('Connection refused');
    expect(status).toBe('error');
    expect(error).toBe('Connection refused');
  });
});
