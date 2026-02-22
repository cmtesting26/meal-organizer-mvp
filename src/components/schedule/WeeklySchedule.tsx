/**
 * WeeklySchedule Component (Sprint 23 update)
 *
 * Main weekly meal schedule view. Shows Mon-Sun with lunch/dinner slots.
 * Sprint 23: Schedule state lifted to AppContent so WeekNavigation renders
 * inside WarmHeader. Accepts schedule data + controls via props.
 * DndContext wraps the schedule for drag-and-drop reordering.
 */

import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useSchedule } from '@/hooks/useSchedule';
import { DayCard } from './DayCard';
import { RecipePicker } from './RecipePicker';
import { decodeMealSlotId } from './MealSlot';
import { getWeekDays, toISODateString } from '@/lib/dateHelpers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UtensilsCrossed } from 'lucide-react';
import type { Recipe } from '@/types/recipe';
import type { WeekSchedule } from '@/lib/syncService';

/** Shape of schedule controls passed from AppContent */
export interface ScheduleData {
  weekSchedule: WeekSchedule;
  loading: boolean;
  currentWeekStart: Date;
  addMeal: (recipeId: string, date: string, mealType: 'lunch' | 'dinner') => Promise<void>;
  removeMeal: (entryId: string) => Promise<void>;
  swapMeals: (sourceDate: string, sourceMealType: 'lunch' | 'dinner', targetDate: string, targetMealType: 'lunch' | 'dinner') => Promise<void>;
}

interface WeeklyScheduleProps {
  onRecipeClick?: (recipe: Recipe) => void;
  /** Schedule data/controls from parent (AppContent). If omitted, uses own useSchedule hook. */
  schedule?: ScheduleData;
}

export function WeeklySchedule({ onRecipeClick, schedule: externalSchedule }: WeeklyScheduleProps) {
  // Use external schedule data if provided, otherwise fall back to own hook
  const internalSchedule = useSchedule();
  const {
    weekSchedule,
    loading,
    currentWeekStart,
    addMeal,
    removeMeal,
    swapMeals,
  } = externalSchedule ?? internalSchedule;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{
    date: string;
    mealType: 'lunch' | 'dinner';
  } | null>(null);

  // Drag state for overlay
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  // Sensors: pointer (desktop) + touch (mobile) with activation distance
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  const weekDays = getWeekDays(currentWeekStart);

  const handleAddMeal = (date: string, mealType: 'lunch' | 'dinner') => {
    setPendingSlot({ date, mealType });
    setPickerOpen(true);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!pendingSlot) return;
    await addMeal(recipe.id, pendingSlot.date, pendingSlot.mealType);
    setPendingSlot(null);
  };

  const handleRemoveMeal = async (entryId: string) => {
    await removeMeal(entryId);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    onRecipeClick?.(recipe);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const recipe = event.active.data.current?.recipe as Recipe | undefined;
    setActiveRecipe(recipe || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRecipe(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const source = decodeMealSlotId(active.id as string);
    const target = decodeMealSlotId(over.id as string);

    await swapMeals(source.date, source.mealType, target.date, target.mealType);
  };

  const handleDragCancel = () => {
    setActiveRecipe(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="pt-4">
        {/* WeekNavigation now rendered in WarmHeader (App.tsx) — S23-06 */}

        <div className="space-y-3">
          {weekDays.map((day) => {
            const dateStr = toISODateString(day);
            return (
              <DayCard
                key={dateStr}
                dateStr={dateStr}
                schedule={weekSchedule[dateStr]}
                onAddMeal={handleAddMeal}
                onRemoveMeal={handleRemoveMeal}
                onRecipeClick={handleRecipeClick}
              />
            );
          })}
        </div>

        <RecipePicker
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) setPendingSlot(null);
          }}
          onSelectRecipe={handleSelectRecipe}
        />
      </div>

      {/* Drag overlay — shows recipe being dragged */}
      <DragOverlay>
        {activeRecipe ? (
          <div className="flex items-center gap-2 bg-white shadow-lg rounded-lg px-3 py-2 border border-primary/30">
            <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
              {activeRecipe.imageUrl ? (
                <img src={activeRecipe.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {activeRecipe.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
