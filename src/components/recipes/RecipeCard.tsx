/**
 * RecipeCard Component (Sprint 23 update)
 * 
 * Sprint 23: Compact card with 56px thumbnail, no large hero image.
 * Shows thumbnail, title, tags in a horizontal layout.
 * Sprint 8 additions: long-press to enter multi-select mode.
 */

import { useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { RecencyBadge } from '@/components/common/RecencyBadge';
import { Flame, UtensilsCrossed } from 'lucide-react';
import type { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onLongPress?: (recipeId: string) => void;
  /** When provided, shows a "Cooked N×" badge inside the card */
  cookCount?: number;
  /** Custom label for the cook count badge (e.g., "Cooked 5× in 2026") */
  cookCountLabel?: string;
  /** Override for last cooked date (computed from schedule history) */
  lastCookedDate?: string;
}

export function RecipeCard({ recipe, onClick, onLongPress, cookCount, cookCountLabel, lastCookedDate }: RecipeCardProps) {
  const tags = recipe.tags || [];
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const startLongPress = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress?.(recipe.id);
    }, 500);
  }, [onLongPress, recipe.id]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return; // Don't fire click after long-press
    }
    onClick();
  }, [onClick]);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-all duration-150"
      style={{
        backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
        border: '1px solid var(--fs-card-border, #E7E5E4)',
      }}
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={recipe.title}
    >
      {/* 56px Thumbnail */}
      <div
        className="shrink-0 rounded-lg overflow-hidden"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
        }}
      >
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
          <UtensilsCrossed className="w-5 h-5" style={{ color: 'var(--fs-text-placeholder, #A8A29E)' }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold text-sm truncate"
          style={{ color: 'var(--fs-text-primary, #1C1917)' }}
          title={recipe.title}
        >
          {recipe.title}
        </h3>

        {/* Tags + Cook count row */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {cookCount != null && cookCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: 'var(--fs-accent-light, #FEF3C7)',
                color: 'var(--fs-accent-text, #92400E)',
              }}
              title={cookCountLabel}
            >
              <Flame className="w-2.5 h-2.5" />
              {cookCountLabel || `${cookCount}×`}
            </span>
          )}
          {tags.slice(0, 2).map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[11px] px-2 py-0.5"
              style={{
                backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
                color: 'var(--fs-text-secondary, #57534E)',
                borderColor: 'var(--fs-border-default, #E7E5E4)',
              }}
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <span className="text-[11px]" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
              +{tags.length - 2}
            </span>
          )}
        </div>

        {/* S26-07: Restored RecencyBadge */}
        {!cookCount && (
          <div className="mt-1">
            <RecencyBadge lastCookedDate={lastCookedDate} compact />
          </div>
        )}
      </div>
    </div>
  );
}
