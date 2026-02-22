/**
 * RecipeLibrary Component (Sprint 21 update)
 *
 * Sprint 21 additions: household feed (NewRecipesSection), segmented control, Most Cooked view.
 * Sprint 8 additions: multi-select mode (long-press/checkbox), bulk delete, bulk assign tags.
 * Sprint 7 additions: tag filter chips, quick-log integration, i18n.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { EmptyState } from '@/components/recipes/EmptyState';
import { TagFilterChips } from '@/components/common/TagFilterChips';
import { TextTabs } from '@/components/common/TextTabs';
import { NewRecipesSection } from '@/components/recipes/NewRecipesSection';
import { MostCookedView } from '@/components/recipes/MostCookedView';
import { useRecipes } from '@/hooks/useRecipes';
import { useLastCooked } from '@/hooks/useLastCooked';
import type { Recipe } from '@/types/recipe';

interface NewRecipeWithAuthor extends Recipe {
  addedByName: string;
}

interface RecipeLibraryProps {
  onRecipeClick: (recipe: Recipe) => void;
  onImportClick: () => void;
  onAddManualClick: () => void;
  /** Increment to force recipe list refresh (e.g. after adding a recipe) */
  refreshKey?: number;
  /** New recipes from household members (Sprint 21) */
  newRecipes?: NewRecipeWithAuthor[];
  /** Dismiss callback for new recipes (Sprint 21) */
  onDismissNewRecipes?: () => void;
}

export function RecipeLibrary({
  onRecipeClick,
  onImportClick,
  onAddManualClick,
  refreshKey,
  newRecipes = [],
  onDismissNewRecipes,
}: RecipeLibraryProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState('all');
  const { recipes, loading, allTags, refreshRecipes } = useRecipes();
  const { getLastCookedDate } = useLastCooked();

  // Re-fetch when refreshKey changes (recipe added from App)
  useEffect(() => {
    if (refreshKey) refreshRecipes();
  }, [refreshKey, refreshRecipes]);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(r => (r.tags || []).includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.ingredients.some((ing) => ing.toLowerCase().includes(query)) ||
          (recipe.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort alphabetically by default (Sprint 23: removed sort dropdown)
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }, [recipes, searchQuery, selectedTag]);

  const handleCardClick = useCallback((recipe: Recipe) => {
    onRecipeClick(recipe);
  }, [onRecipeClick]);

  if (!loading && recipes.length === 0) {
    return (
      <EmptyState
        onImportClick={onImportClick}
        onManualAddClick={onAddManualClick}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 pt-0 pb-6 max-w-6xl">
      {/* S26-05: Sticky header — search + tags + tabs stick below WarmHeader on scroll */}
      <div
        className="mb-4 sticky z-20 pb-3 -mx-4 px-4"
        style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)', top: 'var(--fs-warm-header-h, 53px)', paddingTop: '16px' }}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="text"
              placeholder={t('recipes.searchPlaceholder')}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm w-full rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20"
              style={{ backgroundColor: 'var(--fs-card-bg, #FFFFFF)', borderColor: 'var(--fs-border-default, #E7E5E4)' }}
              aria-label={t('recipes.searchPlaceholder')}
            />
          </div>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="mt-3">
            <TagFilterChips
              availableTags={allTags}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
          </div>
        )}

        {/* TextTabs — Sprint 23: replaces SegmentedControl + sort dropdown */}
        <div className="mt-3">
          <TextTabs
            tabs={[
              { key: 'all', label: t('frequency.allRecipes', 'All Recipes') },
              { key: 'mostCooked', label: t('frequency.mostCooked', 'Most Cooked') },
            ]}
            activeTab={activeSegment}
            onTabChange={setActiveSegment}
          />
        </div>

        {(searchQuery || selectedTag) && (
          <p className="text-sm mt-2" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
            {t('recipes.found', { count: filteredRecipes.length })}
          </p>
        )}
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">{t('recipes.loading')}</p>
        </div>
      ) : filteredRecipes.length === 0 && activeSegment === 'all' ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            {t('recipes.noMatch', { query: searchQuery || selectedTag })}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t('recipes.tryDifferent')}
          </p>
        </div>
      ) : activeSegment === 'mostCooked' ? (
        /* Most Cooked view (Sprint 21) */
        <MostCookedView recipes={recipes} onRecipeClick={onRecipeClick} />
      ) : (
        <>
          {/* Household feed: new recipes from other members (Sprint 21) */}
          {newRecipes.length > 0 && (
            <NewRecipesSection
              recipes={newRecipes}
              onRecipeClick={onRecipeClick}
              onDismiss={onDismissNewRecipes || (() => {})}
            />
          )}

          <div
          className="space-y-2"
          role="list"
          aria-label="Recipe cards"
        >
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} role="listitem">
              <RecipeCard
                recipe={recipe}
                onClick={() => handleCardClick(recipe)}
                lastCookedDate={getLastCookedDate(recipe.id)}
              />
            </div>
          ))}
        </div>
        </>
      )}

    </div>
  );
}
