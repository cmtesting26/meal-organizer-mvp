/**
 * MigrationWizard Component Tests (Sprint 11 — S11-10)
 *
 * Tests for the migration wizard UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MigrationWizard } from '@/components/migration/MigrationWizard';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'migration.title': 'Migrate Your Data',
        'migration.detecting': 'Scanning local data...',
        'migration.description': 'You have local recipes and meal plans.',
        'migration.recipesCount': `${opts?.count ?? 0} recipe(s)`,
        'migration.scheduleCount': `${opts?.count ?? 0} scheduled meal(s)`,
        'migration.tagsCount': `${opts?.count ?? 0} tag(s)`,
        'migration.skipForNow': 'Skip for now',
        'migration.migrateNow': 'Migrate to Cloud',
        'migration.inProgress': 'Migrating your data...',
        'migration.doNotClose': 'Please do not close this page',
        'migration.successTitle': 'Migration Complete!',
        'migration.done': 'Done',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock auth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { householdId: 'h1' },
    user: { id: 'u1' },
    isAuthenticated: true,
  }),
}));

// Mocks for migration service
const mockDetectLocalData = vi.fn();
const mockGetMigrationStatus = vi.fn();
const mockMigrateLocalToCloud = vi.fn();

vi.mock('@/lib/migrationService', () => ({
  detectLocalData: (...args: unknown[]) => mockDetectLocalData(...args),
  hasLocalData: vi.fn().mockResolvedValue(true),
  getMigrationStatus: () => mockGetMigrationStatus(),
  migrateLocalToCloud: (...args: unknown[]) => mockMigrateLocalToCloud(...args),
  rollbackMigration: vi.fn().mockResolvedValue({ success: true }),
  clearMigrationSnapshot: vi.fn(),
  getStoredSnapshot: vi.fn().mockReturnValue(null),
}));

describe('MigrationWizard', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMigrationStatus.mockReturnValue('not-started');
    mockDetectLocalData.mockResolvedValue({
      recipes: 5,
      scheduleEntries: 3,
      tags: 2,
    });
  });

  it('should show detection state then ready state with data summary', async () => {
    render(<MigrationWizard onDismiss={mockOnDismiss} />);

    // Initially detecting
    expect(screen.getByText('Scanning local data...')).toBeInTheDocument();

    // Wait for ready state
    await waitFor(() => {
      expect(screen.getByText('5 recipe(s)')).toBeInTheDocument();
    });

    expect(screen.getByText('3 scheduled meal(s)')).toBeInTheDocument();
    expect(screen.getByText('2 tag(s)')).toBeInTheDocument();
    expect(screen.getByText('Migrate to Cloud')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  it('should call onDismiss when skip is clicked', async () => {
    render(<MigrationWizard onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Skip for now'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should call onDismiss when migration already completed', async () => {
    mockGetMigrationStatus.mockReturnValue('completed');

    render(<MigrationWizard onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('should call onDismiss when no local data exists', async () => {
    mockDetectLocalData.mockResolvedValue({
      recipes: 0,
      scheduleEntries: 0,
      tags: 0,
    });

    render(<MigrationWizard onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('should show success state after migration', async () => {
    mockMigrateLocalToCloud.mockResolvedValue({
      success: true,
      summary: { recipes: 5, scheduleEntries: 3, tags: 2 },
      errors: [],
    });

    render(<MigrationWizard onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(screen.getByText('Migrate to Cloud')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Migrate to Cloud'));

    await waitFor(() => {
      expect(screen.getByText('Migration Complete!')).toBeInTheDocument();
    });
  });
});
