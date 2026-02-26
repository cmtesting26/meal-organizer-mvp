/**
 * WeekNavigation Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '@/lib/dateHelpers';

interface WeekNavigationProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export function WeekNavigation({ currentWeekStart, onPrevWeek, onNextWeek, onCurrentWeek }: WeekNavigationProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between mb-4 rounded-xl px-1"
      style={{
        backgroundColor: 'var(--fs-bg-surface)',
        height: 44,
        boxShadow: '0 2px 8px rgba(45,37,34,0.03)',
      }}
    >
      <button
        onClick={onPrevWeek}
        aria-label={t('schedule.previousWeek', 'Previous week')}
        className="flex items-center justify-center rounded-lg hover:bg-[var(--fs-hover-bg)] transition-colors"
        style={{ width: 36, height: 36 }}
      >
        <ChevronLeft className="h-[18px] w-[18px]" style={{ color: 'var(--fs-text-secondary)' }} />
      </button>
      <button
        onClick={onCurrentWeek}
        className="text-sm font-semibold hover:text-primary transition-colors"
        style={{ color: 'var(--fs-text-primary)' }}
        title={t('schedule.thisWeek')}
      >
        {t('schedule.weekOf', { range: formatWeekRange(currentWeekStart) })}
      </button>
      <button
        onClick={onNextWeek}
        aria-label={t('schedule.nextWeek', 'Next week')}
        className="flex items-center justify-center rounded-lg hover:bg-[var(--fs-hover-bg)] transition-colors"
        style={{ width: 36, height: 36 }}
      >
        <ChevronRight className="h-[18px] w-[18px]" style={{ color: 'var(--fs-text-secondary)' }} />
      </button>
    </div>
  );
}
