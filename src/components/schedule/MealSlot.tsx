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
import { X, UtensilsCrossed, GripVertical } from 'lucide-react';
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
      className={`flex items-center justify-between py-2 min-h-[44px] rounded transition-colors ${
        isOver ? 'bg-primary/10 ring-1 ring-primary/30' : ''
      }`}
    >
      <span className="text-sm text-gray-500 w-16 shrink-0">{mealLabel}</span>
      {recipe ? (
        <div
          ref={setDragRef}
          style={dragStyle}
          className={`flex items-center gap-2 flex-1 min-w-0 ml-2 ${isDragging ? 'shadow-lg bg-white rounded px-2' : ''}`}
          {...attributes}
        >
          {/* Drag handle */}
          <button
            className="touch-none cursor-grab active:cursor-grabbing shrink-0 text-gray-300 hover:text-gray-500 p-0.5"
            aria-label={t('schedule.dragMeal', { title: recipe.title })}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {/* Recipe Thumbnail */}
          <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
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
              <UtensilsCrossed className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <button onClick={() => onRecipeClick?.(recipe)}
            className="text-sm font-medium text-gray-900 truncate hover:text-primary transition-colors text-left">
            {recipe.title}
          </button>
          {entryId && onRemove && (
            <Button variant="ghost" size="sm"
              className="h-6 w-6 p-0 shrink-0 text-gray-400 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onRemove(entryId); }}
              aria-label={t('schedule.removeRecipe', { title: recipe.title, mealType: mealLabel })}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 ml-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onAdd}>
            {t('schedule.emptySlot')}
          </Button>
        </div>
      )}
    </div>
  );
}
