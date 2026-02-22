/**
 * NewRecipesSection Component (Sprint 21)
 *
 * Highlights recipes added by other household members since last login.
 * Shows at the top of the Library list with a "New from [name]" label.
 * Dismissible: after viewing, recipes return to normal sort order.
 *
 * Design Spec V1.5 · Implementation Plan Phase 27–28
 */

import { useTranslation } from 'react-i18next';
import { Sparkles, X } from 'lucide-react';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { Recipe } from '@/types/recipe';

interface NewRecipeWithAuthor extends Recipe {
  addedByName: string;
}

interface NewRecipesSectionProps {
  /** New recipes from household members */
  recipes: NewRecipeWithAuthor[];
  /** Called when user clicks a recipe */
  onRecipeClick: (recipe: Recipe) => void;
  /** Called when user dismisses the section */
  onDismiss: () => void;
}

export function NewRecipesSection({ recipes, onRecipeClick, onDismiss }: NewRecipesSectionProps) {
  const { t } = useTranslation();

  if (recipes.length === 0) return null;

  return (
    <section
      className="mb-6 rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--fs-accent-light)',
        border: '1px solid var(--fs-border-accent)',
      }}
      aria-label={t('householdFeed.sectionLabel', 'New recipes from your household')}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--fs-accent)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--fs-accent-text)' }}
          >
            {t('householdFeed.title', '{{count}} new recipe(s)', { count: recipes.length })}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--fs-accent-text)' }}
          aria-label={t('householdFeed.dismiss', 'Dismiss new recipes')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Recipe cards with "New from [name]" labels */}
      <div className="grid gap-3">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="relative">
            {/* "New from [name]" label */}
            <div
              className="text-xs font-medium mb-1 px-1"
              style={{ color: 'var(--fs-accent-text)' }}
            >
              {t('householdFeed.newFrom', 'New from {{name}}', { name: recipe.addedByName })}
            </div>
            <RecipeCard
              recipe={recipe}
              onClick={() => onRecipeClick(recipe)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
