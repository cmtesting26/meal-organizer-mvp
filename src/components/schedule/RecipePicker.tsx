/**
 * RecipePicker Component (Sprint 21 — recency from schedule history)
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { RecencyBadge } from '@/components/common/RecencyBadge';
import { TagFilterChips } from '@/components/common/TagFilterChips';
import { Search, X, UtensilsCrossed, Flame } from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import { useLastCooked } from '@/hooks/useLastCooked';
import { useCookFrequency } from '@/hooks/useCookFrequency';
import type { Recipe } from '@/types/recipe';

interface RecipePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export function RecipePicker({ open, onOpenChange, onSelectRecipe }: RecipePickerProps) {
  const { t } = useTranslation();
  const { recipes, allTags, loading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Recompute last-cooked dates from schedule history each time picker opens
  const refreshKey = open ? 1 : 0;
  const { getLastCookedDate } = useLastCooked(refreshKey);
  const { frequencyMap } = useCookFrequency();

  const currentYear = new Date().getFullYear();

  const sortedAndFiltered = useMemo(() => {
    let filtered = recipes;

    if (selectedTag) {
      filtered = filtered.filter((r) => r.tags?.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // S26-11: Sort by cook count in current year desc, then recency desc, never-cooked at bottom
    return [...filtered].sort((a, b) => {
      const aFreq = frequencyMap.get(a.id);
      const bFreq = frequencyMap.get(b.id);
      const aCount = aFreq?.thisYear || 0;
      const bCount = bFreq?.thisYear || 0;

      // Never-cooked at bottom
      const aDate = getLastCookedDate(a.id);
      const bDate = getLastCookedDate(b.id);
      if (!aDate && bDate) return 1;
      if (aDate && !bDate) return -1;

      // Sort by cook count descending
      if (aCount !== bCount) return bCount - aCount;

      // Tiebreaker: longest since last cooked first (ascending recency)
      if (aDate && bDate) return aDate.localeCompare(bDate);
      return 0;
    });
  }, [recipes, searchQuery, selectedTag, getLastCookedDate, frequencyMap]);

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedTag(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] flex flex-col !p-0 !gap-0 rounded-t-[20px] [&>button.absolute]:hidden"
        style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)' }}
      >
        {/* DragHandleWrap — padding: [12, 0, 4, 0] */}
        <div className="flex justify-center" style={{ padding: '12px 0 4px 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 9999, backgroundColor: 'var(--fs-border-muted, #E8DDD8)' }} />
        </div>

        {/* SheetHeader — padding: [8, 24, 12, 24] */}
        <div className="flex items-center justify-between" style={{ padding: '8px 24px 12px 24px' }}>
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              color: 'var(--fs-text-primary, #2D2522)',
            }}
          >
            {t('schedule.chooseMeal')}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-full hover:bg-[var(--fs-hover-bg)] transition-colors"
            style={{ width: 44, height: 44 }}
            aria-label={t('common.close', 'Close')}
          >
            <X style={{ width: 20, height: 20, color: 'var(--fs-text-secondary, #7A6E66)' }} />
          </button>
        </div>

        {/* SearchWrap — padding: [12, 24] */}
        <div className="relative" style={{ padding: '12px 24px' }}>
          <Search
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: 38, width: 18, height: 18, color: 'var(--fs-text-muted, #7A6E66)' }}
          />
          <Input
            placeholder={t('recipes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{
              height: 40,
              borderRadius: 12,
              borderColor: 'var(--fs-border-default, #C5B5AB)',
              boxShadow: '0 2px 8px rgba(45,37,34,0.03)',
              backgroundColor: 'var(--fs-bg-surface, #FFFFFF)',
              padding: '0 14px 0 40px',
              fontSize: 14,
            }}
            aria-label={t('schedule.searchRecipes', 'Search recipes')}
          />
        </div>

        {/* TagChips — padding: [0, 24, 4, 24], gap: 8 */}
        {allTags.length > 0 && (
          <div style={{ padding: '0 24px 4px 24px' }}>
            <TagFilterChips availableTags={allTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
          </div>
        )}

        {/* RecipeList — padding: [0, 24], gap: 4, fill height */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 24px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
              {t('schedule.loading', 'Loading...')}
            </div>
          ) : sortedAndFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
              <UtensilsCrossed className="h-10 w-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">{t('schedule.noRecipes')}</p>
              <p className="text-xs mt-1">
                {searchQuery ? t('schedule.noRecipesSearch') : t('schedule.noRecipesAdd')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sortedAndFiltered.map((recipe) => (
                <button key={recipe.id} onClick={() => handleSelect(recipe)}
                  className="w-full flex items-center hover:bg-[var(--fs-bg-card-inner)] transition-colors text-left"
                  style={{ gap: 12, padding: 12, borderRadius: 12 }}
                >
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="object-cover shrink-0" style={{ width: 48, height: 48, borderRadius: 10 }} />
                  ) : (
                    <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)' }}>
                      <UtensilsCrossed className="h-5 w-5" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{recipe.title}</p>
                    <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
                      <RecencyBadge date={getLastCookedDate(recipe.id)} compact />
                      {(() => {
                        const freq = frequencyMap.get(recipe.id);
                        const count = freq?.thisYear || 0;
                        if (count <= 0) return null;
                        return (
                          <span
                            className="inline-flex items-center rounded-full text-[11px] font-semibold"
                            style={{
                              gap: 4,
                              padding: '3px 8px',
                              backgroundColor: 'var(--fs-accent-light, #FEF0E8)',
                              color: 'var(--fs-accent-text, #B84835)',
                              border: '1px solid var(--fs-accent-muted, #E8C4B8)',
                            }}
                          >
                            <Flame style={{ width: 12, height: 12 }} />
                            {count}× in {currentYear}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
