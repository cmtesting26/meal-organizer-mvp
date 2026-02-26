/**
 * RecipeDetail Page (Sprint 24)
 *
 * S24-01: WarmHeader with back-button variant + vertical dots overflow menu.
 *         Share/Edit/Delete consolidated into overflow menu.
 *         TextTabs for Ingredients/Instructions (amber underline).
 *         Ingredient rows with V1.6 stone-border styling.
 *         Instruction step numbers with amber circle badges.
 *         Pinned amber "Start Cooking" button at bottom.
 *
 * Design Specification V1.6 — Recipe Detail header
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { RecencyBadge } from '@/components/common/RecencyBadge';
import { DeleteRecipeDialog } from '@/components/recipes/DeleteRecipeDialog';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { AddPhotoButton } from '@/components/recipes/AddPhotoButton';
import { ServingSelector } from '@/components/recipes/ServingSelector';
import { ScaledIngredientList } from '@/components/recipes/ScaledIngredientList';
import { WarmHeader } from '@/components/common/WarmHeader';
import { TextTabs } from '@/components/common/TextTabs';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeIngredients } from '@/hooks/useRecipeIngredients';
import { useLastCooked } from '@/hooks/useLastCooked';
import { useToast } from '@/hooks/useToast';
import { shareRecipe } from '@/lib/share';
import { generateShareableLink } from '@/lib/publicShareService';
import { useAuth } from '@/hooks/useAuth';
import { CookingMode } from '@/components/CookingMode';
import { CookFrequency } from '@/components/recipes/CookFrequency';
import {
  ExternalLink,
  ChefHat,
  UtensilsCrossed,
  Share2,
  Pencil,
  Trash2,
  Play,
  MoreVertical,
} from 'lucide-react';
import type { ParsedRecipe, Recipe } from '@/types/recipe';

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getRecipeById, updateRecipe, deleteRecipe } = useRecipes();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { getLastCookedDate } = useLastCooked();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ingredients');
  const menuRef = useRef<HTMLDivElement>(null);

  const recipe = id ? getRecipeById(id) : undefined;

  // Recipe scaling (Sprint 12)
  const DEFAULT_SERVINGS = 4;
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const {
    loading: ingredientsLoading,
    getScaledIngredients,
    parseAndStore,
    hasStructuredIngredients,
  } = useRecipeIngredients(recipe?.id);

  // Auto-parse ingredients on first view if not yet parsed
  useEffect(() => {
    if (recipe && !ingredientsLoading && !hasStructuredIngredients && recipe.ingredients.length > 0) {
      parseAndStore(recipe);
    }
  }, [recipe, ingredientsLoading, hasStructuredIngredients, parseAndStore]);

  // Close overflow menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [menuOpen]);

  const scaledIngredients = hasStructuredIngredients
    ? getScaledIngredients(servings, DEFAULT_SERVINGS)
    : [];
  const isScaled = servings !== DEFAULT_SERVINGS;

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--fs-bg-base, #FAF8F6)' }}>
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--fs-text-placeholder, #A8A29E)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>
            {t('recipes.notFound')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--fs-text-muted, #7A6E66)' }}>
            {t('recipes.notFoundDescription')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--fs-accent, #D4644E)', color: 'white' }}
          >
            {t('recipeDetail.back')}
          </button>
        </div>
      </div>
    );
  }

  const tags = recipe.tags || [];

  const handleDelete = async () => {
    try {
      await deleteRecipe(recipe.id);
      toast.success(t('toast.recipeDeleted', { title: recipe.title }));
      navigate('/');
    } catch {
      toast.error(t('toast.recipeDeleteFailed'));
    }
  };

  const handleEditSave = async (updatedRecipe: Recipe) => {
    try {
      await updateRecipe({
        ...recipe,
        title: updatedRecipe.title,
        ingredients: updatedRecipe.ingredients,
        instructions: updatedRecipe.instructions,
        imageUrl: updatedRecipe.imageUrl,
        sourceUrl: updatedRecipe.sourceUrl,
        tags: updatedRecipe.tags,
      });
      toast.success(t('toast.recipeUpdated'));
    } catch {
      toast.error(t('toast.recipeUpdateFailed'));
      throw new Error('Failed to update recipe');
    }
  };

  const handleShare = async () => {
    setMenuOpen(false);
    if (isAuthenticated) {
      try {
        const url = await generateShareableLink(recipe.id);
        if (navigator.share) {
          try {
            // Only pass title + url — adding a text field causes desktop "Copy"
            // to concatenate url + text, producing duplicated/messy output.
            await navigator.share({ title: recipe.title, url });
            return;
          } catch { /* cancelled */ }
        }
        await navigator.clipboard.writeText(url);
        toast.success(t('share.linkCopied'));
      } catch {
        const result = await shareRecipe(recipe);
        if (result === 'copied') toast.success(t('share.copied'));
        else if (result === 'failed') toast.error(t('share.shareFailed'));
      }
    } else {
      const result = await shareRecipe(recipe);
      if (result === 'copied') toast.success(t('share.copied'));
      else if (result === 'failed') toast.error(t('share.shareFailed'));
    }
  };

  const handleEdit = () => { setMenuOpen(false); setShowEditForm(true); };
  const handleDeleteClick = () => { setMenuOpen(false); setShowDeleteDialog(true); };

  const recipeForForm: ParsedRecipe = {
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl,
    sourceUrl: recipe.sourceUrl || '',
    tags: recipe.tags,
    success: true,
  };

  const detailTabs = [
    { key: 'ingredients', label: t('recipeDetail.ingredientsTitle', 'Ingredients') },
    { key: 'instructions', label: t('recipeDetail.instructionsTitle', 'Instructions') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--fs-bg-base, #FAF8F6)' }}>
      {/* S24-01: WarmHeader — back button + recipe name + dots menu */}
      <WarmHeader
        title={recipe.title}
        backButton
        onBack={() => navigate(-1)}
        rightAction={
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)] focus-visible:ring-offset-1"
              style={{ color: 'var(--fs-text-primary, #2D2522)' }}
              aria-label={t('recipeDetail.moreActions', 'More actions')}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50"
                style={{
                  backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
                  borderRadius: '12px',
                  border: '1px solid var(--fs-border-default, #C5B5AB)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '160px',
                }}
                role="menu"
              >
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3 w-full text-left transition-colors hover:opacity-80"
                  style={{
                    padding: '12px 16px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--fs-text-primary, #2D2522)',
                    borderBottom: '1px solid var(--fs-border-default, #C5B5AB)',
                  }}
                  role="menuitem"
                >
                  <Share2 className="w-4 h-4" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
                  {t('recipeDetail.shareRecipe', 'Share')}
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-3 w-full text-left transition-colors hover:opacity-80"
                  style={{
                    padding: '12px 16px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--fs-text-primary, #2D2522)',
                    borderBottom: '1px solid var(--fs-border-default, #C5B5AB)',
                  }}
                  role="menuitem"
                >
                  <Pencil className="w-4 h-4" style={{ color: 'var(--fs-text-muted, #7A6E66)' }} />
                  {t('recipeDetail.editRecipe', 'Edit')}
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-3 w-full text-left transition-colors hover:opacity-80"
                  style={{
                    padding: '12px 16px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#DC2626',
                  }}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('recipeDetail.deleteRecipe', 'Delete')}
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Content — with bottom padding for pinned button */}
      <main className="max-w-4xl mx-auto px-6" style={{ paddingBottom: '80px' }}>
        {/* Hero Image / Placeholder */}
        {recipe.imageUrl ? (
          <div className="w-full h-56 sm:h-72 overflow-hidden mb-4" style={{ backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)', borderRadius: '14px' }}>
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover"
              onError={(e) => {
                // Hide the entire container, not just the img — avoids empty gray box
                const container = (e.currentTarget as HTMLImageElement).parentElement;
                if (container) container.style.display = 'none';
              }} />
          </div>
        ) : (
          <div className="w-full h-40 sm:h-48 overflow-hidden mb-4 flex items-center justify-center relative"
            style={{ backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)', borderRadius: '14px' }}>
            <UtensilsCrossed className="w-16 h-16" style={{ color: 'var(--fs-text-placeholder, #A8A29E)' }} />
            {/* S25-05: Add Photo button for recipes without custom photos */}
            <AddPhotoButton
              recipeId={recipe.id}
              onPhotoUploaded={(result) => {
                updateRecipe({ ...recipe, imageUrl: result.photoUrl });
                toast.success(t('photoUpload.success'));
              }}
            />
          </div>
        )}

        {/* Tags — warm stone palette chips (S20-05) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map(tag => (
              <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: 'var(--fs-bg-elevated, #F5F5F4)',
                  color: 'var(--fs-text-secondary, #7A6E66)',
                  borderColor: 'var(--fs-border-default, #C5B5AB)',
                }}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick stats row — S26-01: removed ingredients/steps count, S26-02: conditional CookFrequency */}
        <div className="flex flex-wrap items-center gap-3" style={{ paddingBottom: '14px' }}>
          <RecencyBadge lastCookedDate={getLastCookedDate(recipe.id)} />
          <CookFrequency recipeId={recipe.id} />
          {recipe.sourceUrl && (
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--fs-accent-text, #B84835)' }}>
              <ExternalLink className="w-3 h-3" />
              {t('recipes.source')}
            </a>
          )}
        </div>

        {/* S24-01: TextTabs — Ingredients / Instructions */}
        <TextTabs tabs={detailTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab panels */}
        <div className="mt-4">
          {activeTab === 'ingredients' && (
            <div role="tabpanel" id="panel-ingredients">
              {hasStructuredIngredients && (
                <div className="mb-4">
                  <ServingSelector servings={servings} defaultServings={DEFAULT_SERVINGS} onChange={setServings} />
                </div>
              )}
              {hasStructuredIngredients ? (
                <ScaledIngredientList ingredients={scaledIngredients} isScaled={isScaled} />
              ) : (
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3"
                      style={{
                        backgroundColor: 'var(--fs-card-bg, #FFFFFF)',
                        borderRadius: '8px',
                        border: '1px solid var(--fs-border-default, #C5B5AB)',
                        padding: '10px 12px',
                      }}>
                      <div className="shrink-0" style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid #D6D3D1' }} />
                      <span className="text-sm" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{ingredient}</span>
                    </div>
                  ))}
                </div>
              )}
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
                        backgroundColor: '#FEF0E8', color: '#B84835',
                        fontSize: '12px', fontWeight: 700,
                      }}>
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--fs-text-primary, #2D2522)' }}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* S26-03: Pinned "Start Cooking" button — constrained to content width */}
      {recipe.instructions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30"
          style={{
            backgroundColor: 'var(--fs-bg-base, #FAF8F6)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}>
          <div className="max-w-4xl mx-auto px-6" style={{ paddingTop: '12px' }}>
            <button onClick={() => setShowCookingMode(true)}
              className="w-full flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fs-accent)]"
              style={{
                backgroundColor: '#D4644E', color: 'white', borderRadius: '14px',
                height: '48px', fontSize: '14px', fontWeight: 700,
                boxShadow: '0 4px 12px rgba(212,100,78,0.3)',
              }}>
              <Play className="w-5 h-5" />
              {t('cookingMode.startCooking')}
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <DeleteRecipeDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} recipeName={recipe.title} onConfirm={handleDelete} />
      <RecipeForm open={showEditForm} onOpenChange={setShowEditForm} recipe={recipeForForm} onSave={handleEditSave} />
      {showCookingMode && <CookingMode recipe={recipe} onExit={() => setShowCookingMode(false)} />}
    </div>
  );
}
