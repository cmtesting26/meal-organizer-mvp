/**
 * RecencyBadge Component (Sprint 21 — dark mode polish)
 *
 * Uses CSS custom properties from tokens.css so badge colors
 * switch automatically between light and dark themes.
 *
 * Color thresholds (unchanged):
 * - Green: ≤7 days (fresh)
 * - Yellow: 8–21 days (getting stale)
 * - Red: ≥22 days (overdue)
 * - Gray: never cooked
 *
 * Dark variants (Design Spec V1.5):
 *   Green  → bg:#064E3B text:#6EE7B7
 *   Yellow → bg:#713F12 text:#FDE68A
 *   Red    → bg:#7F1D1D text:#FCA5A5
 *   Gray   → bg:#292524 text:#A8A29E
 */

import { useTranslation } from 'react-i18next';

interface RecencyBadgeProps {
  /** Primary date prop (from RecipeCard) */
  lastCookedDate?: string;
  /** Alias for lastCookedDate (from MealSlot/RecipePicker) */
  date?: string;
  /** Array of cooked dates — most-recent-wins logic selects the latest */
  dates?: string[];
  compact?: boolean;
  className?: string;
}

/**
 * Resolves the effective cooked date from props.
 * If `dates` array is provided, picks the most recent.
 * Clamps future dates to today (past-only).
 */
function resolveDate(props: RecencyBadgeProps): string | undefined {
  const { lastCookedDate, date, dates } = props;

  let candidates: string[] = [];

  if (dates && dates.length > 0) {
    candidates = [...dates];
  } else if (lastCookedDate) {
    candidates = [lastCookedDate];
  } else if (date) {
    candidates = [date];
  }

  if (candidates.length === 0) return undefined;

  // Most-recent-wins: sort descending, pick first
  candidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const mostRecent = candidates[0];

  // Clamp future dates to today (past-only)
  const now = new Date();
  const parsed = new Date(mostRecent);
  if (parsed > now) {
    return now.toISOString().split('T')[0];
  }

  return mostRecent;
}

/**
 * Calculates days since a date (floored to whole days).
 * Returns 0 for today or future dates.
 */
export function daysSince(dateStr: string): number {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const today = new Date(todayStr + 'T00:00:00');
  const then = new Date(dateStr.split('T')[0] + 'T00:00:00');
  const diff = Math.round((today.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

type RecencyLevel = 'green' | 'yellow' | 'red';

/**
 * Returns the recency level based on day thresholds.
 */
export function getRecencyLevel(days: number): RecencyLevel {
  if (days <= 7) return 'green';
  if (days <= 21) return 'yellow';
  return 'red';
}

/**
 * Returns Tailwind color classes based on recency thresholds.
 * Kept for backward compatibility with any external consumers.
 */
export function getRecencyColorClass(days: number): string {
  const level = getRecencyLevel(days);
  switch (level) {
    case 'green':
      return 'bg-green-100 text-green-600 border-green-200';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    case 'red':
      return 'bg-red-100 text-red-600 border-red-200';
  }
}

/**
 * Returns inline style using CSS custom properties for theme-aware colors.
 */
function getRecencyStyle(level: RecencyLevel | 'gray'): React.CSSProperties {
  return {
    backgroundColor: `var(--fs-recency-${level}-bg)`,
    color: `var(--fs-recency-${level}-text)`,
    borderColor: `var(--fs-recency-${level}-border)`,
  };
}

export function RecencyBadge(props: RecencyBadgeProps) {
  const { compact, className } = props;
  const { t } = useTranslation();

  const cookedDate = resolveDate(props);

  // Never cooked — gray badge
  if (!cookedDate) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${className || ''}`}
        style={getRecencyStyle('gray')}
      >
        {compact ? t('recencyBadge.never') : t('recencyBadge.neverCooked')}
      </span>
    );
  }

  const days = daysSince(cookedDate);
  const level = getRecencyLevel(days);

  // Build human-readable distance
  let distance: string;
  if (days === 0) {
    distance = t('recencyBadge.today', 'today');
  } else if (days === 1) {
    distance = t('recencyBadge.yesterday', 'yesterday');
  } else {
    distance = t('recencyBadge.daysAgo', '{{count}} days ago', { count: days });
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${className || ''}`}
      style={getRecencyStyle(level)}
    >
      {compact ? distance : t('recencyBadge.lastCooked', { distance })}
    </span>
  );
}
