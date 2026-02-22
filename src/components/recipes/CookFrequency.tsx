/**
 * CookFrequency Component (Sprint 21)
 *
 * Displays cook frequency stats on the Recipe Detail page:
 * "Cooked 3× this month · 12× this year"
 *
 * Shows "Never cooked" for recipes with no cook history.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27–28
 */

import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import { useCookFrequency } from '@/hooks/useCookFrequency';

interface CookFrequencyProps {
  recipeId: string;
  className?: string;
}

export function CookFrequency({ recipeId, className }: CookFrequencyProps) {
  const { t } = useTranslation();
  const { frequency, loading } = useCookFrequency(recipeId);

  if (loading) {
    return (
      <div
        className={`flex items-center gap-1.5 text-sm animate-pulse ${className || ''}`}
        style={{ color: 'var(--fs-text-muted)' }}
      >
        <Flame className="w-4 h-4" />
        <span className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--fs-skeleton-base)' }} />
      </div>
    );
  }

  // S26-02: Hide entirely when never cooked (RecencyBadge already shows "Never cooked")
  if (frequency.total === 0) {
    return null;
  }

  // Build stat text: "Cooked 3× this month · 12× this year"
  const parts: string[] = [];

  if (frequency.thisMonth > 0) {
    parts.push(
      t('frequency.thisMonth', '{{count}}× this month', { count: frequency.thisMonth })
    );
  }

  if (frequency.thisYear > 0) {
    parts.push(
      t('frequency.thisYear', '{{count}}× this year', { count: frequency.thisYear })
    );
  }

  // Fallback: if no month/year data but has total (older than this year)
  if (parts.length === 0 && frequency.total > 0) {
    parts.push(
      t('frequency.total', '{{count}}× total', { count: frequency.total })
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-sm ${className || ''}`}
      style={{ color: 'var(--fs-accent-text)' }}
    >
      <Flame className="w-4 h-4" style={{ color: 'var(--fs-accent)' }} />
      <span>
        {t('frequency.cooked', 'Cooked')} {parts.join(' · ')}
      </span>
    </div>
  );
}
