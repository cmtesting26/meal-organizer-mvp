/**
 * OcrReviewForm Component (Sprint 14 — S14-04)
 *
 * Review and correct OCR-parsed recipe before saving.
 * Split view: image on top, editable fields below.
 * Confidence indicators guide user attention to low-confidence sections.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, AlertTriangle, CheckCircle, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OcrParsedRecipe } from '@/lib/ocrRecipeParser';

interface OcrReviewFormProps {
  /** Parsed recipe from OCR */
  parsedRecipe: OcrParsedRecipe;
  /** Original captured image (data URL) */
  imageUrl: string | null;
  /** Called when user saves the corrected recipe */
  onSave: (recipe: { title: string; ingredients: string[]; instructions: string[] }) => void;
  /** Called to go back and re-capture */
  onRetry: () => void;
  /** Called to close */
  onClose: () => void;
}

export function OcrReviewForm({
  parsedRecipe,
  imageUrl,
  onSave,
  onRetry,
  onClose,
}: OcrReviewFormProps) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(parsedRecipe.title);
  const [ingredients, setIngredients] = useState<string[]>(
    parsedRecipe.ingredients.length > 0 ? parsedRecipe.ingredients : ['']
  );
  const [instructions, setInstructions] = useState<string[]>(
    parsedRecipe.instructions.length > 0 ? parsedRecipe.instructions : ['']
  );
  const [showRawText, setShowRawText] = useState(false);

  const confidence = parsedRecipe.confidence;

  const updateIngredient = useCallback((index: number, value: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, '']);
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateInstruction = useCallback((index: number, value: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addInstruction = useCallback(() => {
    setInstructions((prev) => [...prev, '']);
  }, []);

  const removeInstruction = useCallback((index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    const cleanIngredients = ingredients.filter((i) => i.trim().length > 0);
    const cleanInstructions = instructions.filter((i) => i.trim().length > 0);

    if (!title.trim()) return;
    if (cleanIngredients.length === 0 && cleanInstructions.length === 0) return;

    onSave({
      title: title.trim(),
      ingredients: cleanIngredients.map((i) => i.trim()),
      instructions: cleanInstructions.map((i) => i.trim()),
    });
  }, [title, ingredients, instructions, onSave]);

  const canSave = title.trim().length > 0 &&
    (ingredients.some((i) => i.trim().length > 0) || instructions.some((i) => i.trim().length > 0));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('ocr.reviewTitle')}</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onRetry}>
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('ocr.retake')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
          {/* Overall confidence indicator */}
          <ConfidenceBadge level={confidence.overall} label={t('ocr.overallConfidence')} />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Image preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100 max-h-48">
              <img
                src={imageUrl}
                alt={t('ocr.capturedPhoto')}
                className="w-full max-h-48 object-contain"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              {t('ocr.recipeTitle')}
              <ConfidenceIndicator level={confidence.title} />
            </label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder={t('ocr.titlePlaceholder')}
              className="text-lg font-semibold"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              {t('recipeDetail.ingredientsTitle')}
              <ConfidenceIndicator level={confidence.ingredients} />
              <span className="text-xs text-gray-400">({ingredients.filter(i => i.trim()).length})</span>
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={ing}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateIngredient(idx, e.target.value)}
                    placeholder={t('ocr.ingredientPlaceholder')}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(idx)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                    disabled={ingredients.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addIngredient} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                {t('ocr.addIngredient')}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              {t('recipeDetail.instructionsTitle')}
              <ConfidenceIndicator level={confidence.instructions} />
              <span className="text-xs text-gray-400">({instructions.filter(i => i.trim()).length} {t('recipes.steps', { count: instructions.filter(i => i.trim()).length })})</span>
            </label>
            <div className="space-y-2">
              {instructions.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateInstruction(idx, e.target.value)}
                    placeholder={t('ocr.instructionPlaceholder')}
                    className="flex-1 text-sm border rounded-md px-3 py-2 min-h-[60px] resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={2}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstruction(idx)}
                    className="text-red-500 hover:text-red-700 shrink-0 mt-1"
                    disabled={instructions.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addInstruction} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                {t('ocr.addStep')}
              </Button>
            </div>
          </div>

          {/* Raw OCR text toggle */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs text-gray-500"
            >
              {showRawText ? t('ocr.hideRawText') : t('ocr.showRawText')}
            </Button>
            {showRawText && (
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto border">
                {parsedRecipe.rawText}
              </pre>
            )}
          </div>

          {/* Save button */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
              <Save className="w-4 h-4 mr-2" />
              {t('ocr.saveRecipe')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Small confidence indicator (colored dot) */
function ConfidenceIndicator({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[level]}`}
      title={`Confidence: ${level}`}
    />
  );
}

/** Confidence badge with icon */
function ConfidenceBadge({ level, label }: { level: 'high' | 'medium' | 'low'; label: string }) {
  if (level === 'high') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs gap-1">
        <CheckCircle className="w-3 h-3" />
        {label}: {level}
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs gap-1">
      <AlertTriangle className="w-3 h-3" />
      {label}: {level}
    </Badge>
  );
}
