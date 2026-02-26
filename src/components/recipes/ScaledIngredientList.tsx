/**
 * ScaledIngredientList (Sprint 12 — S12-11)
 *
 * Displays ingredients with scaled quantities. Shows parsed structured
 * data when available, with quantity highlighted and adjusted proportionally.
 * Falls back to raw text display for unparsed ingredients.
 *
 * @module ScaledIngredientList
 */

import type { ScaledIngredient } from '@/hooks/useRecipeIngredients';

interface ScaledIngredientListProps {
  /** Scaled ingredients to display */
  ingredients: ScaledIngredient[];
  /** Whether the quantities are scaled (not original) */
  isScaled: boolean;
}

export function ScaledIngredientList({ ingredients, isScaled }: ScaledIngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ing, index) => (
        <li
          key={index}
          className="flex items-start gap-2 text-sm"
          style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <span>
            {ing.quantity ? (
              <>
                <span
                  className={`font-medium tabular-nums ${
                    isScaled ? 'text-green-700' : ''
                  }`}
                  style={!isScaled ? { color: 'var(--fs-text-primary, #2D2522)' } : undefined}
                >
                  {ing.quantity}
                  {ing.quantityMax ? `–${ing.quantityMax}` : ''}
                </span>
                {ing.unit && (
                  <span style={{ color: 'var(--fs-text-secondary, #7A6E66)' }}> {ing.unit}</span>
                )}
                {ing.name && (
                  <span> {ing.name}</span>
                )}
              </>
            ) : (
              // No quantity — show raw text (e.g., "salt to taste")
              <span>{ing.rawText || ing.name}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
