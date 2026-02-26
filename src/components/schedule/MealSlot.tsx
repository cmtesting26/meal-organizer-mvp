/**
 * MealSlot Component (Sprint 23 update)
 *
 * Displays a meal slot with optional recipe thumbnail + title.
 * Supports drag-and-drop via dnd-kit for reordering meals within a week.
 * Sprint 23: Removed recency badge from schedule meal slots per Design Spec V1.6.
 */

import { useTranslation } from 'react-i18next';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { X, Plus, UtensilsCrossed, GripVertical } from 'lucide-react';
import type { Recipe } from '@/types/recipe';

/** Unique identifier for a meal slot (used as dnd-kit id) */
export interface MealSlotId {
  date: string;
  mealType: 'lunch' | 'dinner';
}

export function encodeMealSlotId(date: string, mealType: 'lunch' | 'dinner'): string {
  return `${date}__${mealType}`;
}

export function decodeMealSlotId(id: string): MealSlotId {
  const [date, mealType] = id.split('__');
  return { date, mealType: mealType as 'lunch' | 'dinner' };
}

interface MealSlotProps {
  mealType: 'lunch' | 'dinner';
  date: string;
  recipe?: Recipe;
  entryId?: string;
  onAdd: () => void;
  onRemove?: (entryId: string) => void;
  onRecipeClick?: (recipe: Recipe) => void;
}

export function MealSlot({ mealType, date, recipe, entryId, onAdd, onRemove, onRecipeClick }: MealSlotProps) {
  const { t } = useTranslation();
  const mealLabel = mealType === 'lunch' ? t('schedule.lunch') : t('schedule.dinner');
  const slotId = encodeMealSlotId(date, mealType);

  // Droppable: any slot can be a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slotId });

  // Draggable: only slots with recipes can be dragged
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: slotId,
    disabled: !recipe,
    data: { date, mealType, recipe },
  });

  const dragStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50, opacity: 0.9 }
    : undefined;

  return (
    <div
      ref={setDropRef}
      className={`flex items-center justify-between rounded transition-colors ${
        isOver ? 'bg-primary/10 ring-1 ring-primary/30' : ''
      }`}
      style={{ padding: '10px 0' }}
    >
      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--fs-text-muted, #7A6E66)', width: '44px' }}>{mealLabel}</span>
      {recipe ? (
        <div
          ref={setDragRef}
          style={dragStyle}
          className={`flex items-center flex-1 min-w-0 ${isDragging ? 'shadow-lg bg-white rounded px-2' : ''}`}
          {...attributes}
        >
          {/* Drag handle */}
          <button
            className="touch-none cursor-grab active:cursor-grabbing shrink-0 hover:text-[var(--fs-text-muted)] p-1 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1 rounded"
            style={{ color: '#D4D4D4' }}
            aria-label={t('schedule.dragMeal', { title: recipe.title })}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {/* Recipe Thumbnail */}
          <div className="w-8 h-8 overflow-hidden shrink-0 ml-2" style={{ borderRadius: 6, backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full items-center justify-center ${recipe.imageUrl ? 'hidden' : 'flex'}`}
              aria-hidden="true"
            >
              <UtensilsCrossed className="w-4 h-4" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
            </div>
          </div>
          <button onClick={() => onRecipeClick?.(recipe)}
            className="text-sm font-medium truncate hover:text-primary transition-colors text-left ml-2" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
            {recipe.title}
          </button>
          {entryId && onRemove && (
            <Button variant="ghost" size="sm"
              className="h-8 w-8 p-0 shrink-0 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1 ml-auto" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}
              onClick={(e) => { e.stopPropagation(); onRemove(entryId); }}
              aria-label={t('schedule.removeRecipe', { title: recipe.title, mealType: mealLabel })}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="flex items-center font-semibold ml-auto"
          style={{
            gap: 6,
            padding: '6px 14px',
            borderRadius: 12,
            backgroundColor: 'var(--fs-accent, #D4644E)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('schedule.add', 'Add')}
        </button>
      )}
    </div>
  );
}
