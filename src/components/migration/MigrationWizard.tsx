/**
 * Migration Wizard (Sprint 11 — S11-01, S11-03)
 *
 * Multi-step wizard for migrating local IndexedDB data to Supabase cloud.
 * Steps:
 *   1. Detection — scans local data and shows a summary
 *   2. Migration — uploads data to cloud with progress
 *   3. Result — shows success/failure with rollback option
 *
 * Shown automatically on first login if local data exists.
 * Also accessible from Settings page.
 *
 * @module MigrationWizard
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
  detectLocalData,
  migrateLocalToCloud,
  rollbackMigration,
  getMigrationStatus,
  clearMigrationSnapshot,
  type MigrationSummary,
  type MigrationResult,
} from '@/lib/migrationService';
import { Button } from '@/components/ui/button';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  CalendarDays,
  Tag,
  Loader2,
  X,
} from 'lucide-react';

type WizardStep = 'detecting' | 'ready' | 'migrating' | 'success' | 'partial' | 'failed';

interface MigrationWizardProps {
  /** Called when wizard is dismissed (skip or complete) */
  onDismiss: () => void;
  /** Whether the wizard is shown inline (settings) vs full screen (first login) */
  inline?: boolean;
}

export function MigrationWizard({ onDismiss, inline = false }: MigrationWizardProps) {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [step, setStep] = useState<WizardStep>('detecting');
  const [localSummary, setLocalSummary] = useState<MigrationSummary | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // ─── Step 1: Detect local data ───────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function detect() {
      const status = getMigrationStatus();
      if (status === 'completed') {
        // Already migrated — nothing to do
        onDismiss();
        return;
      }

      const summary = await detectLocalData();
      if (!mounted) return;

      if (summary.recipes === 0 && summary.scheduleEntries === 0) {
        // No data to migrate
        onDismiss();
        return;
      }

      setLocalSummary(summary);
      setStep('ready');
    }

    detect();
    return () => { mounted = false; };
  }, [onDismiss]);

  // ─── Step 2: Run migration ───────────────────────────────────────
  const handleMigrate = useCallback(async () => {
    if (!profile?.householdId || !user?.id) return;

    setStep('migrating');

    const migrationResult = await migrateLocalToCloud(profile.householdId, user.id);
    setResult(migrationResult);

    if (migrationResult.success) {
      setStep('success');
    } else if (migrationResult.summary.recipes > 0 || migrationResult.summary.scheduleEntries > 0) {
      setStep('partial');
    } else {
      setStep('failed');
    }
  }, [profile, user]);

  // ─── Step 3: Rollback ────────────────────────────────────────────
  const handleRollback = useCallback(async () => {
    setRollingBack(true);
    const { success, error } = await rollbackMigration();
    setRollingBack(false);

    if (success) {
      setStep('ready');
      setResult(null);
    } else {
      console.error('Rollback failed:', error);
    }
  }, []);

  // ─── Step 4: Confirm migration ───────────────────────────────────
  const handleConfirm = useCallback(() => {
    clearMigrationSnapshot();
    onDismiss();
  }, [onDismiss]);

  // ─── Rendering ───────────────────────────────────────────────────

  const containerClass = inline
    ? 'bg-white rounded-lg border p-6'
    : 'min-h-screen flex items-center justify-center p-4';

  const cardClass = inline
    ? ''
    : 'bg-white rounded-xl shadow-lg max-w-md w-full p-6';

  return (
    <div className={containerClass} style={!inline ? { backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' } : undefined}>
      <div className={cardClass}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
              {t('migration.title')}
            </h2>
          </div>
          {step === 'ready' && (
            <button onClick={onDismiss} className="hover:text-[var(--fs-text-secondary)]" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} aria-label={t('common.dismiss', 'Dismiss')}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Detecting */}
        {step === 'detecting' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <p className="text-sm" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('migration.detecting')}</p>
          </div>
        )}

        {/* Ready — show summary + migrate button */}
        {step === 'ready' && localSummary && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
              {t('migration.description')}
            </p>

            {/* Data summary */}
            <div className="rounded-lg p-4 mb-4 space-y-3" style={{ backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--fs-accent, #D4644E)' }} />
                <span className="text-sm" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                  {t('migration.recipesCount', { count: localSummary.recipes })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--fs-accent, #D4644E)' }} />
                <span className="text-sm" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                  {t('migration.scheduleCount', { count: localSummary.scheduleEntries })}
                </span>
              </div>
              {localSummary.tags > 0 && (
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-purple-500" />
                  <span className="text-sm" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>
                    {t('migration.tagsCount', { count: localSummary.tags })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDismiss}
              >
                {t('migration.skipForNow')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleMigrate}
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('migration.migrateNow')}
              </Button>
            </div>
          </div>
        )}

        {/* Migrating — progress */}
        {step === 'migrating' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <p className="text-sm" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}>{t('migration.inProgress')}</p>
            <p className="text-xs" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>{t('migration.doNotClose')}</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && result && (
          <div>
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm font-medium" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
                {t('migration.successTitle')}
              </p>
            </div>

            {/* Migration counts */}
            <div className="bg-green-50 rounded-lg p-4 mb-4 space-y-2">
              <p className="text-sm text-green-800">
                {t('migration.migratedRecipes', { count: result.summary.recipes })}
              </p>
              <p className="text-sm text-green-800">
                {t('migration.migratedSchedule', { count: result.summary.scheduleEntries })}
              </p>
              {result.summary.tags > 0 && (
                <p className="text-sm text-green-800">
                  {t('migration.migratedTags', { count: result.summary.tags })}
                </p>
              )}
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
              {t('migration.done')}
            </Button>
          </div>
        )}

        {/* Partial success */}
        {step === 'partial' && result && (
          <div>
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertTriangle className="w-10 h-10" style={{ color: 'var(--fs-accent, #D4644E)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
                {t('migration.partialTitle')}
              </p>
            </div>

            <div className="rounded-lg p-4 mb-4 space-y-2" style={{ backgroundColor: 'var(--fs-accent-light, #FEF0E8)' }}>
              <p className="text-sm" style={{ color: 'var(--fs-accent-text, #B84835)' }}>
                {t('migration.migratedRecipes', { count: result.summary.recipes })}
              </p>
              <p className="text-sm" style={{ color: 'var(--fs-accent-text, #B84835)' }}>
                {t('migration.migratedSchedule', { count: result.summary.scheduleEntries })}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 text-xs" style={{ color: 'var(--fs-accent-text, #B84835)' }}>
                  <p className="font-medium">{t('migration.errorsTitle')}:</p>
                  {result.errors.slice(0, 3).map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleRollback} disabled={rollingBack}>
                {rollingBack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                {t('migration.rollback')}
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                {t('migration.keepPartial')}
              </Button>
            </div>
          </div>
        )}

        {/* Failed */}
        {step === 'failed' && result && (
          <div>
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <p className="text-sm font-medium" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
                {t('migration.failedTitle')}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 mb-4">
              {result.errors.slice(0, 3).map((err, i) => (
                <p key={i} className="text-sm text-red-700">• {err}</p>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleRollback} disabled={rollingBack}>
                {rollingBack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                {t('migration.rollback')}
              </Button>
              <Button className="flex-1" onClick={handleMigrate}>
                {t('migration.retry')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
