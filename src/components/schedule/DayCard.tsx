/**
 * DayCard Component (Sprint 23 update)
 *
 * Sprint 23: Amber today highlight, past day muting (opacity 50%),
 * remove recency badge from schedule view per Design Spec V1.6.
 */

import { useTranslation } from 'react-i18next';
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
    <div
      className={`overflow-hidden transition-opacity ${isPast && !isToday ? 'opacity-50' : ''}`}
      style={{
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(45, 37, 34, 0.03)',
        backgroundColor: 'var(--fs-bg-surface, #FFFFFF)',
      }}
    >
      <div className="flex">
        {/* Terracotta accent bar for today */}
        {isToday && (
          <div
            className="shrink-0"
            style={{ width: 4, backgroundColor: 'var(--fs-accent, #D4644E)' }}
          />
        )}
        <div className="flex-1 min-w-0 p-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="flex items-center justify-between">
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-0.3px',
                color: 'var(--fs-text-primary, #2D2522)',
              }}
            >
              {scheduleDay}
            </h3>
            {isToday && (
              <span
                className="rounded-full font-semibold"
                style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  padding: '3px 10px',
                  backgroundColor: 'var(--fs-accent-light, #FEF0E8)',
                  color: 'var(--fs-accent-hover, #B84835)',
                  border: '1px solid var(--fs-accent-muted, #E8C4B8)',
                }}
              >
                {t('schedule.today')}
              </span>
            )}
          </div>
          <div>
            <MealSlot mealType="lunch" date={dateStr} recipe={schedule?.lunch?.recipe}
              entryId={schedule?.lunch?.entry.id}
              onAdd={() => onAddMeal(dateStr, 'lunch')} onRemove={onRemoveMeal} onRecipeClick={onRecipeClick} />
            <div style={{ height: 1, backgroundColor: 'var(--fs-border-default, #C5B5AB)' }} />
            <MealSlot mealType="dinner" date={dateStr} recipe={schedule?.dinner?.recipe}
              entryId={schedule?.dinner?.entry.id}
              onAdd={() => onAddMeal(dateStr, 'dinner')} onRemove={onRemoveMeal} onRecipeClick={onRecipeClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
