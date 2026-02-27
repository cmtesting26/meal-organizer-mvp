/**
 * MostCookedView Component (Sprint 24)
 *
 * S24-05: Ranks recipes by cook count scoped to current calendar year.
 * S24-06: Shows cook count badge "N× in {year}" with warm amber styling.
 *         Year indicator below tab. Empty state for no current-year data.
 *
 * Design Spec V1.6 · Roadmap V1.6 Epic 7
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, UtensilsCrossed } from 'lucide-react';
import { useCookFrequency } from '@/hooks/useCookFrequency';
import type { Recipe } from '@/types/recipe';

interface MostCookedViewProps {
  /** All recipes in the library */
  recipes: Recipe[];
  /** Called when a recipe card is clicked */
  onRecipeClick: (recipe: Recipe) => void;
}

export function MostCookedView({ recipes, onRecipeClick }: MostCookedViewProps) {
  const { t } = useTranslation();
  const { frequencyMap, loading } = useCookFrequency();

  const currentYear = new Date().getFullYear();

  // S24-05: Sort recipes by THIS YEAR cook count descending, filter out 0 cooks in current year
  const rankedRecipes = useMemo(() => {
    const withCounts = recipes.map((recipe) => ({
      recipe,
      thisYear: frequencyMap.get(recipe.id)?.thisYear || 0,
      total: frequencyMap.get(recipe.id)?.total || 0,
    }));

    return withCounts
      .filter((r) => r.thisYear > 0)
      .sort((a, b) => b.thisYear - a.thisYear);
  }, [recipes, frequencyMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: 'var(--fs-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (rankedRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Flame
          className="w-12 h-12 mb-3"
          style={{ color: 'var(--fs-text-muted)' }}
        />
        <p className="text-lg font-medium" style={{ color: 'var(--fs-text-secondary)' }}>
          {t('frequency.emptyYearTitle', { year: currentYear, defaultValue: `No recipes cooked yet in ${currentYear}` })}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--fs-text-muted)' }}>
          {t('frequency.emptyYearSubtitle', { defaultValue: 'Start cooking to see your favorites here!' })}
        </p>
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id="panel-mostCooked"
      style={{ padding: '14px 0 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {rankedRecipes.map(({ recipe, thisYear }, index) => {
        const isTop3 = index < 3;

        const card = (
          <div
            className="flex items-center cursor-pointer select-none transition-all duration-150"
            style={{
              gap: 12,
              padding: 12,
              backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
              borderRadius: 14,
              boxShadow: '0 2px 10px rgba(45, 37, 34, 0.03)',
              height: 72,
            }}
            onClick={() => onRecipeClick(recipe)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRecipeClick(recipe);
              }
            }}
            aria-label={recipe.title}
          >
            {/* 48px Thumbnail */}
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)',
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

            {/* Content — name + cook badge */}
            <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                className="font-semibold text-sm truncate"
                style={{ color: 'var(--fs-text-primary, #2D2522)' }}
                title={recipe.title}
              >
                {recipe.title}
              </span>
              <span
                className="inline-flex items-center self-start rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--fs-accent-light, #FEF0E8)',
                  color: 'var(--fs-accent-text, #B84835)',
                  padding: '3px 8px',
                  gap: 4,
                  border: '1px solid var(--fs-border-accent, #E8C4B8)',
                }}
              >
                <Flame style={{ width: 12, height: 12 }} />
                {t('frequency.countInYear', {
                  count: thisYear,
                  year: currentYear,
                  defaultValue: `${thisYear}× in ${currentYear}`,
                })}
              </span>
            </div>
          </div>
        );

        if (isTop3) {
          return (
            <div key={recipe.id} style={{ position: 'relative' }}>
              {card}
              {/* Rank badge — 24px circle at (-4, -4) */}
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  backgroundColor: 'var(--fs-accent, #D4644E)',
                  color: 'var(--fs-text-inverse, #FFFFFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.13)',
                  zIndex: 5,
                }}
              >
                {index + 1}
              </div>
            </div>
          );
        }

        return (
          <div key={recipe.id}>
            {card}
          </div>
        );
      })}
    </div>
  );
}
