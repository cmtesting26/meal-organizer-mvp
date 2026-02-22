/**
 * MostCookedView Component (Sprint 24)
 *
 * S24-05: Ranks recipes by cook count scoped to current calendar year.
 * S24-06: Shows cook count badge "Cooked N× in {year}" with warm amber styling.
 *         Year indicator below tab. Empty state for no current-year data.
 *
 * Design Spec V1.6 · Roadmap V1.6 Epic 7
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useCookFrequency } from '@/hooks/useCookFrequency';
import { useLastCooked } from '@/hooks/useLastCooked';
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
  const { getLastCookedDate } = useLastCooked();

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
    <div role="tabpanel" id="panel-mostCooked">
      {/* S26-06: Year indicator moved into each card's badge */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankedRecipes.map(({ recipe, thisYear }, index) => (
          <div key={recipe.id} className="relative">
            {/* Rank badge for top 3 */}
            {index < 3 && (
              <div
                className="absolute -top-2 -left-2 z-[5] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                style={{
                  backgroundColor: 'var(--fs-accent)',
                  color: 'var(--fs-text-inverse)',
                }}
              >
                #{index + 1}
              </div>
            )}
            <RecipeCard
              recipe={recipe}
              onClick={() => onRecipeClick(recipe)}
              cookCount={thisYear}
              cookCountLabel={t('frequency.cookedInYear', { count: thisYear, year: currentYear, defaultValue: `Cooked ${thisYear}× in ${currentYear}` })}
              lastCookedDate={getLastCookedDate(recipe.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
