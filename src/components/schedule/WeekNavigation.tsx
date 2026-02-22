/**
 * WeekNavigation Component (Sprint 7 — i18n)
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center justify-between mb-4">
      <Button variant="ghost" size="sm" onClick={onPrevWeek} aria-label={t('schedule.previousWeek', 'Previous week')}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button onClick={onCurrentWeek}
        className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
        title={t('schedule.thisWeek')}>
        {t('schedule.weekOf', { range: formatWeekRange(currentWeekStart) })}
      </button>
      <Button variant="ghost" size="sm" onClick={onNextWeek} aria-label={t('schedule.nextWeek', 'Next week')}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
