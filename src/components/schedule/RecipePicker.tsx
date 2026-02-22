/**
 * RecipePicker Component (Sprint 21 — recency from schedule history)
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { RecencyBadge } from '@/components/common/RecencyBadge';
import { TagFilterChips } from '@/components/common/TagFilterChips';
import { Search, UtensilsCrossed, Flame } from 'lucide-react';
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
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{t('schedule.chooseMeal')}</SheetTitle>
        </SheetHeader>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mt-3">
            <TagFilterChips availableTags={allTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
          </div>
        )}

        {/* Search */}
        <div className="relative mt-3 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder={t('schedule.searchPlaceholder')} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              {t('schedule.loading', 'Loading...')}
            </div>
          ) : sortedAndFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <UtensilsCrossed className="h-10 w-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">{t('schedule.noRecipes')}</p>
              <p className="text-xs mt-1">
                {searchQuery ? t('schedule.noRecipesSearch') : t('schedule.noRecipesAdd')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedAndFiltered.map((recipe) => (
                <button key={recipe.id} onClick={() => handleSelect(recipe)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <RecencyBadge date={getLastCookedDate(recipe.id)} compact />
                      {/* S26-12: Cook count flame badge */}
                      {(() => {
                        const freq = frequencyMap.get(recipe.id);
                        const count = freq?.thisYear || 0;
                        if (count <= 0) return null;
                        return (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                            }}
                          >
                            <Flame className="w-2.5 h-2.5" />
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
