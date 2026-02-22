/**
 * DayCard Component (Sprint 23 update)
 *
 * Sprint 23: Amber today highlight, past day muting (opacity 50%),
 * remove recency badge from schedule view per Design Spec V1.6.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { MealSlot } from './MealSlot';
import { formatScheduleDay, getTodayISO } from '@/lib/dateHelpers';
import type { DaySchedule } from '@/lib/syncService';
import type { Recipe } from '@/types/recipe';

interface DayCardProps {
  dateStr: string;
  schedule?: DaySchedule;
  onAddMeal: (date: string, mealType: 'lunch' | 'dinner') => void;
  onRemoveMeal: (entryId: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
}

export function DayCard({ dateStr, schedule, onAddMeal, onRemoveMeal, onRecipeClick }: DayCardProps) {
  const { t, i18n } = useTranslation();
  const todayISO = getTodayISO();
  const isToday = dateStr === todayISO;
  const isPast = dateStr < todayISO;
  const scheduleDay = formatScheduleDay(dateStr, i18n.language);

  return (
    <Card
      className={`transition-opacity ${isPast && !isToday ? 'opacity-50' : ''}`}
      style={isToday ? {
        border: '2px solid #D97706',
        backgroundColor: '#FFFBEB',
      } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3
            className="font-semibold text-sm"
            style={{ color: isToday ? '#D97706' : 'var(--fs-text-primary, #1C1917)' }}
          >
            {scheduleDay}
          </h3>
          {isToday && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}
            >
              {t('schedule.today')}
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          <MealSlot mealType="lunch" date={dateStr} recipe={schedule?.lunch?.recipe}
            entryId={schedule?.lunch?.entry.id}
            onAdd={() => onAddMeal(dateStr, 'lunch')} onRemove={onRemoveMeal} onRecipeClick={onRecipeClick} />
          <MealSlot mealType="dinner" date={dateStr} recipe={schedule?.dinner?.recipe}
            entryId={schedule?.dinner?.entry.id}
            onAdd={() => onAddMeal(dateStr, 'dinner')} onRemove={onRemoveMeal} onRecipeClick={onRecipeClick} />
        </div>
      </CardContent>
    </Card>
  );
}
