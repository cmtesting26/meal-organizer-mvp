/**
 * RecipeForm Component (Sprint 7)
 *
 * Sprint 7 additions: TagInput for freeform tags, i18n.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[16px] pb-0 flex flex-col max-h-[90vh]"
      >
        <SheetHeader className="pb-1">
          <SheetTitle>{t('recipeForm.reviewTitle')}</SheetTitle>
          <SheetDescription>{t('recipeForm.reviewDescription')}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Photo upload */}
            <div className="flex justify-center">
              {photoPreview ? (
                <div className="relative" style={{ width: '160px', height: '120px' }}>
                  <img
                    src={photoPreview}
                    alt="Recipe preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoPreview && !photoPreview.startsWith('http')) {
                        URL.revokeObjectURL(photoPreview);
                      }
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={photoMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPhotoMenuOpen(!photoMenuOpen)}
                    className="flex flex-col items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: '160px',
                      height: '120px',
                      border: '1px dashed #D6D3D1',
                      borderRadius: '12px',
                      backgroundColor: 'var(--fs-bg-base, #FAFAF9)',
                      cursor: 'pointer',
                    }}
                  >
                    <Camera className="w-5 h-5 mb-1" style={{ color: '#A8A29E' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#A8A29E' }}>
                      {t('photoUpload.addPhoto')}
                    </span>
                  </button>

                  {/* Hidden inputs for camera and file */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    id="photo-camera-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(createPreviewUrl(file));
                      }
                      e.target.value = '';
                      setPhotoMenuOpen(false);
                    }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(createPreviewUrl(file));
                      }
                      e.target.value = '';
                      setPhotoMenuOpen(false);
                    }}
                  />

                  {/* Dropdown menu */}
                  {photoMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: '4px',
                        backgroundColor: 'var(--fs-bg-surface, white)',
                        borderRadius: '12px',
                        border: '1px solid var(--fs-border-default, #E7E5E4)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        width: '180px',
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
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--fs-text-primary, #1C1917)',
                          borderBottom: '1px solid var(--fs-border-default, #E7E5E4)',
                        }}
                      >
                        <Camera className="w-4 h-4" style={{ stroke: '#D97706' }} />
                        {t('photoUpload.takePhoto')}
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('photo-file-input')?.click()}
                        className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                        style={{
                          padding: '12px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--fs-text-primary, #1C1917)',
                        }}
                      >
                        <Upload className="w-4 h-4" style={{ stroke: '#D97706' }} />
                        {t('photoUpload.uploadFile')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {imageUrl && !photoPreview && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img src={imageUrl} alt={title || 'Recipe'} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t('recipeForm.titleLabel')}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={t('recipeForm.titlePlaceholder')} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">{t('recipeForm.ingredientsLabel')}</Label>
              <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)}
                placeholder={t('recipeForm.ingredientsPlaceholder')} rows={6} required />
              <p className="text-sm text-gray-500">{t('recipeForm.ingredientsHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">{t('recipeForm.instructionsLabel')}</Label>
              <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)}
                placeholder={t('recipeForm.instructionsPlaceholder')} rows={8} required />
              <p className="text-sm text-gray-500">{t('recipeForm.instructionsHelp')}</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>{t('recipeForm.tagsLabel')}</Label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('recipeForm.imageUrlLabel')}</Label>
              <Input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t('recipeForm.imageUrlPlaceholder')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">{t('recipeForm.sourceUrlLabel')}</Label>
              <Input id="sourceUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={t('recipeForm.sourceUrlPlaceholder')} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{t('recipeForm.savedSuccess')}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sticky footer with top border */}
          <div className="flex gap-2 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <Button type="button" variant="outline" className="flex-1" onClick={handleCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {t('recipeForm.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('recipeForm.saving')}</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />{t('recipeForm.save')}</>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
