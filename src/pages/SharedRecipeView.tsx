/**
 * Shared Recipe View (Sprint 11, updated Sprint 24)
 *
 * Public, read-only page for viewing a shared recipe.
 * No authentication required. Accessible at /recipe/shared/:recipeId
 *
 * Sprint 24 hotfix: Redesigned to match RecipeDetail V1.6 layout:
 * - Branded warm header bar with logo + "Open App" CTA
 * - Hero image with rounded corners
 * - TextTabs for Ingredients / Instructions
 * - V1.6 styled ingredient rows + amber step badges
 * - Warm amber CTA at bottom
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchSharedRecipe } from '@/lib/publicShareService';
import { Badge } from '@/components/ui/badge';
import { TextTabs } from '@/components/common/TextTabs';
import { CookingMode } from '@/components/CookingMode';
import {
  BookOpen,
  ExternalLink,
  ChefHat,
  ArrowLeft,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForkAndSpoonLogo } from '@/components/brand/ForkAndSpoonLogo';
import type { Recipe } from '@/types/recipe';

export function SharedRecipeView() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const { t } = useTranslation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ingredients');
  const [showCookingMode, setShowCookingMode] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setError('No recipe ID provided');
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        const data = await fetchSharedRecipe(recipeId!);
        if (!mounted) return;
        if (data) {
          setRecipe(data);
        } else {
          setError(t('publicRecipe.notFound'));
        }
      } catch (err) {
        if (mounted) setError(t('publicRecipe.loadError'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [recipeId, t]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#D97706' }} />
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)' }}>
        <div className="rounded-xl shadow-sm max-w-md w-full p-8 text-center" style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--fs-text-placeholder, #A8A29E)' }} />
          <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--fs-text-primary, #1C1917)' }}>
            {t('publicRecipe.notFoundTitle')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
            {error || t('publicRecipe.notFound')}
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('publicRecipe.goToApp')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tags = recipe.tags || [];

  const detailTabs = [
    { key: 'ingredients', label: t('recipeDetail.ingredientsTitle', 'Ingredients') },
    { key: 'instructions', label: t('recipeDetail.instructionsTitle', 'Instructions') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--fs-bg-base, #FAF9F6)' }}>
      {/* Branded header bar — warm amber style */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'linear-gradient(180deg, #FFFBEB 0%, #FFFBEB 100%)',
          borderBottom: '1px solid #FDE68A',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ForkAndSpoonLogo size={28} />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--fs-text-primary, #1C1917)', fontFamily: "'Fraunces', serif" }}>
                Fork &amp; Spoon
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                <BookOpen className="w-3 h-3" />
                {t('publicRecipe.sharedRecipe')}
              </span>
            </div>
          </div>
          <Link to="/">
            <Button size="sm" variant="outline" className="text-xs"
              style={{ borderColor: '#D97706', color: '#D97706' }}>
              {t('publicRecipe.openApp')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content — matches RecipeDetail V1.6 layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero Image */}
        {recipe.imageUrl && (
          <div className="w-full h-56 sm:h-72 rounded-xl overflow-hidden mb-6"
            style={{ backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)' }}>
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--fs-text-primary, #1C1917)' }}>
          {recipe.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
            {recipe.ingredients.length} {t('recipeDetail.ingredientsTitle', 'Ingredients')}
          </span>
          <span className="text-sm" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
            {recipe.instructions.length} {t('recipeDetail.instructionsTitle', 'Steps')}
          </span>
          {recipe.sourceUrl && (
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--fs-accent, #D97706)' }}>
              <ExternalLink className="w-3 h-3" />
              {t('recipes.source')}
            </a>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tags.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
                  color: 'var(--fs-text-secondary, #57534E)',
                  borderColor: 'var(--fs-border-default, #E7E5E4)',
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* TextTabs — Ingredients / Instructions */}
        <TextTabs tabs={detailTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab panels */}
        <div className="mt-4">
          {activeTab === 'ingredients' && (
            <div role="tabpanel" id="panel-ingredients">
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'var(--fs-text-secondary, #57534E)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#D97706' }} />
                    <span style={{ color: 'var(--fs-text-primary, #1C1917)' }}>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div role="tabpanel" id="panel-instructions">
              <ol className="space-y-4">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="shrink-0 flex items-center justify-center"
                      style={{
                        width: '24px', height: '24px', borderRadius: '9999px',
                        backgroundColor: '#FEF3C7', color: '#92400E',
                        fontSize: '12px', fontWeight: 700,
                      }}>
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--fs-text-primary, #1C1917)' }}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* CTA — warm amber style */}
        <div className="rounded-xl p-6 text-center mt-8 mb-8"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <ChefHat className="w-8 h-8 mx-auto mb-2" style={{ color: '#D97706' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--fs-text-primary, #1C1917)' }}>
            {t('publicRecipe.ctaTitle')}
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--fs-text-muted, #78716C)' }}>
            {t('publicRecipe.ctaDescription')}
          </p>
          <Link to="/">
            <Button size="sm" style={{ backgroundColor: '#D97706', color: 'white' }}>
              {t('publicRecipe.ctaButton')}
            </Button>
          </Link>
        </div>
      </main>

      {/* Pinned "Start Cooking" button — matches RecipeDetail */}
      {recipe.instructions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30"
          style={{
            backgroundColor: 'var(--fs-bg-base, #FAF9F6)',
            borderTop: '1px solid var(--fs-border-default, #E7E5E4)',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <button onClick={() => setShowCookingMode(true)}
              className="w-full flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: '#D97706', color: 'white', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: 700,
                boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
              }}>
              <Play className="w-5 h-5" />
              {t('cookingMode.startCooking')}
            </button>
          </div>
        </div>
      )}

      {/* Cooking Mode */}
      {showCookingMode && (
        <CookingMode
          recipe={recipe}
          onExit={() => setShowCookingMode(false)}
        />
      )}
    </div>
  );
}
