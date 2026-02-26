/**
 * RecipeForm Component (Sprint 7)
 *
 * Sprint 7 additions: TagInput for freeform tags, i18n.
 * D3 design: matches Pencil node GlJvU exactly.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagInput } from '@/components/common/TagInput';
import { Loader2, Save, X, AlertCircle, CheckCircle2, Camera, Upload } from 'lucide-react';
import { createPreviewUrl, createPersistentPreviewUrl, uploadRecipePhoto } from '@/lib/photoUploadService';
import type { ParsedRecipe, Recipe } from '@/types/recipe';

interface RecipeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe | null;
  onSave: (recipe: Recipe) => Promise<void>;
}

export function RecipeForm({ open, onOpenChange, recipe, onSave }: RecipeFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  // Close photo dropdown on outside click
  useEffect(() => {
    if (!photoMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setPhotoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [photoMenuOpen]);

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '');
      setIngredients(recipe.ingredients.join('\n'));
      setInstructions(recipe.instructions.join('\n\n'));
      setImageUrl(recipe.imageUrl || '');
      setSourceUrl(recipe.sourceUrl || '');
      setTags(recipe.tags || []);
      setError(null);
      setShowSuccess(false);
    }
  }, [recipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { setError(t('recipeForm.errorTitle')); return; }
    if (!ingredients.trim()) { setError(t('recipeForm.errorIngredients')); return; }
    if (!instructions.trim()) { setError(t('recipeForm.errorInstructions')); return; }

    setLoading(true);
    setError(null);

    try {
      const ingredientList = ingredients.split('\n').map(i => i.trim()).filter(Boolean);
      const instructionList = instructions.split('\n\n').map(i => i.trim()).filter(Boolean);

      // Upload photo to Supabase Storage if a file was selected
      let resolvedImageUrl = imageUrl.trim() || undefined;
      const recipeId = generateId();
      if (photoFile) {
        try {
          const uploadResult = await uploadRecipePhoto(photoFile, recipeId, 'default');
          resolvedImageUrl = uploadResult.photoUrl;
        } catch {
          // Fallback to persistent base64 data URL (survives page refresh / IndexedDB)
          try {
            resolvedImageUrl = await createPersistentPreviewUrl(photoFile);
          } catch {
            resolvedImageUrl = resolvedImageUrl; // keep original imageUrl if conversion fails
          }
        }
      }

      const newRecipe: Recipe = {
        id: recipeId,
        title: title.trim(),
        ingredients: ingredientList,
        instructions: instructionList,
        imageUrl: resolvedImageUrl,
        sourceUrl: sourceUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(newRecipe);
      setShowSuccess(true);

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.recipeSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setIngredients(''); setInstructions('');
    setImageUrl(''); setSourceUrl(''); setTags([]);
    setError(null); setShowSuccess(false);
    if (photoPreview && !photoPreview.startsWith('http')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null); setPhotoPreview(null);
  };

  const handleCancel = () => { onOpenChange(false); resetForm(); };

  function generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const handlePhotoSelected = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(createPreviewUrl(file));
    setPhotoMenuOpen(false);
  };

  /* Shared inline styles matching design tokens */
  const inputStyle: React.CSSProperties = {
    height: 44,
    borderRadius: 12,
    border: '1px solid var(--fs-input-border, #C5B5AB)',
    backgroundColor: 'var(--fs-input-bg, #FFFFFF)',
    padding: '0 14px',
    fontSize: 14,
    color: 'var(--fs-text-primary, #2D2522)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--fs-text-primary, #2D2522)',
  };

  const helpStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--fs-text-muted, #7A6E66)',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="!p-0 !gap-0 !border-t-0 rounded-t-[20px] flex flex-col max-h-[90vh] [&>button]:hidden !bg-white"
      >
        {/* Header — padding [24,24,0,24], gap 4 */}
        <SheetHeader className="!space-y-0 flex flex-col gap-1 px-6 pt-6 text-left">
          <div className="flex items-center justify-between w-full">
            <SheetTitle
              className="!text-[18px] font-semibold !leading-tight"
              style={{ color: 'var(--fs-text-primary, #2D2522)' }}
            >
              {t('recipeForm.reviewTitle')}
            </SheetTitle>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }} />
            </button>
          </div>
          <SheetDescription
            className="!text-[14px] !mt-0"
            style={{ color: 'var(--fs-text-muted, #7A6E66)' }}
          >
            {t('recipeForm.reviewDescription')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable form body — padding [16,24], gap 16 */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 py-4 px-6">

            {/* Photo upload — 160×120, radius 14, solid border */}
            {photoPreview || imageUrl ? (
              <div className="relative shrink-0" style={{ width: 160, height: 120 }}>
                <img
                  src={photoPreview || imageUrl}
                  alt="Recipe preview"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 14 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (photoPreview && !photoPreview.startsWith('http')) {
                      URL.revokeObjectURL(photoPreview);
                    }
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (!photoFile) setImageUrl('');
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--fs-accent, #D4644E)', color: '#FFFFFF' }}
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative shrink-0" ref={photoMenuRef}>
                <button
                  type="button"
                  onClick={() => setPhotoMenuOpen(!photoMenuOpen)}
                  className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                  style={{
                    width: 160,
                    height: 120,
                    borderRadius: 14,
                    border: '1px solid var(--fs-border-default, #C5B5AB)',
                    backgroundColor: 'var(--fs-bg-card-inner, #FAF6F3)',
                    cursor: 'pointer',
                    gap: 4,
                  }}
                >
                  <Camera className="w-5 h-5" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fs-text-secondary, #7A6E66)' }}>
                    {t('photoUpload.addPhoto')}
                  </span>
                </button>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id="photo-camera-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelected(file);
                    e.target.value = '';
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="photo-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelected(file);
                    e.target.value = '';
                  }}
                />

                {/* Photo source dropdown */}
                {photoMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: 4,
                      backgroundColor: 'var(--fs-bg-surface, white)',
                      borderRadius: 12,
                      border: '1px solid var(--fs-border-default, #C5B5AB)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      width: 180,
                      zIndex: 20,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-camera-input')?.click()}
                      className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--fs-text-primary, #2D2522)',
                        borderBottom: '1px solid var(--fs-border-muted, #E8DDD8)',
                      }}
                    >
                      <Camera className="w-4 h-4" style={{ stroke: 'var(--fs-accent, #D4644E)' }} />
                      {t('photoUpload.takePhoto')}
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-file-input')?.click()}
                      className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--fs-text-primary, #2D2522)',
                      }}
                    >
                      <Upload className="w-4 h-4" style={{ stroke: 'var(--fs-accent, #D4644E)' }} />
                      {t('photoUpload.uploadFile')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Title — h44, radius 12, border #C5B5AB, px 14 */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="title" style={labelStyle}>
                {t('recipeForm.titleLabel')}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('recipeForm.titlePlaceholder')}
                required
                className="w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)]"
                style={inputStyle}
              />
            </div>

            {/* Ingredients — h100, radius 12, padding 10 14 */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="ingredients" style={labelStyle}>
                {t('recipeForm.ingredientsLabel')}
              </label>
              <textarea
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={t('recipeForm.ingredientsPlaceholder')}
                required
                className="w-full outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)]"
                style={{
                  height: 100,
                  borderRadius: 12,
                  border: '1px solid var(--fs-input-border, #C5B5AB)',
                  backgroundColor: 'var(--fs-input-bg, #FFFFFF)',
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--fs-text-primary, #2D2522)',
                }}
              />
              <span style={helpStyle}>{t('recipeForm.ingredientsHelp')}</span>
            </div>

            {/* Instructions — h130, radius 12, padding 10 14 */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="instructions" style={labelStyle}>
                {t('recipeForm.instructionsLabel')}
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={t('recipeForm.instructionsPlaceholder')}
                required
                className="w-full outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)]"
                style={{
                  height: 130,
                  borderRadius: 12,
                  border: '1px solid var(--fs-input-border, #C5B5AB)',
                  backgroundColor: 'var(--fs-input-bg, #FFFFFF)',
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--fs-text-primary, #2D2522)',
                }}
              />
              <span style={helpStyle}>{t('recipeForm.instructionsHelp')}</span>
            </div>

            {/* Tags — same input styling, h44, radius 12 */}
            <div className="flex flex-col gap-2 w-full">
              <label style={labelStyle}>
                {t('recipeForm.tagsLabel')}
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {/* Image URL */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="imageUrl" style={labelStyle}>
                {t('recipeForm.imageUrlLabel')}
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t('recipeForm.imageUrlPlaceholder')}
                className="w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)]"
                style={inputStyle}
              />
            </div>

            {/* Source URL */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="sourceUrl" style={labelStyle}>
                {t('recipeForm.sourceUrlLabel')}
              </label>
              <input
                id="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={t('recipeForm.sourceUrlPlaceholder')}
                className="w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent)]"
                style={inputStyle}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="border-green-200 bg-green-50 w-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{t('recipeForm.savedSuccess')}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sticky footer — padding [12,20,24,20], gap 8, border-top #E8DDD8 */}
          <div
            className="flex gap-2 shrink-0"
            style={{
              padding: '12px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
              backgroundColor: 'var(--fs-bg-surface, #FFFFFF)',
              borderTop: '1px solid var(--fs-border-muted, #E8DDD8)',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                height: 44,
                borderRadius: 12,
                border: '1px solid var(--fs-border-default, #C5B5AB)',
                backgroundColor: 'transparent',
              }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--fs-text-secondary, #7A6E66)' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fs-text-primary, #2D2522)' }}>
                {t('recipeForm.cancel')}
              </span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                height: 44,
                borderRadius: 12,
                backgroundColor: 'var(--fs-accent, #D4644E)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                    {t('recipeForm.saving')}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                    {t('recipeForm.save')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
