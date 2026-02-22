/**
 * ImportSheet Component (Sprint 13 — Social Media Import)
 *
 * Updated to detect Instagram/TikTok URLs and route them through
 * the caption-based recipe parsing flow.
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Link as LinkIcon,
  ClipboardPaste,
  AlertCircle,
  PlusCircle,
  Instagram,
  Globe,
  Camera,
} from 'lucide-react';
import { parseRecipeFromUrl } from '@/lib/recipeParser';
import { isSocialMediaUrl, detectSocialPlatform, fetchSocialMediaPost } from '@/lib/socialMediaFetcher';
import { parseCaptionToRecipe } from '@/lib/captionRecipeParser';
import type { ParsedRecipe } from '@/types/recipe';
import type { SocialMediaFetchError } from '@/lib/socialMediaFetcher';

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeImported: (recipe: ParsedRecipe) => void;
  onManualAdd: () => void;
  onOcrImport?: () => void;
}

/** Map SocialMediaFetchError.type → i18n key */
function socialErrorToI18nKey(errorType: string): string {
  switch (errorType) {
    case 'unsupported_url': return 'import.socialUnsupported';
    case 'private_post':    return 'import.socialPrivate';
    case 'empty_caption':   return 'import.socialEmpty';
    case 'network_error':   return 'import.socialNetworkError';
    case 'parse_error':     return 'import.socialParseError';
    default:                return 'import.importFailed';
  }
}

/** Capitalise platform name for display */
function platformLabel(platform: string): string {
  return platform === 'instagram' ? 'Instagram' : 'TikTok';
}

export function ImportSheet({ open, onOpenChange, onRecipeImported, onManualAdd, onOcrImport }: ImportSheetProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect social media platform in real-time
  const detectedPlatform = useMemo(() => {
    if (!url.trim()) return null;
    return detectSocialPlatform(url.trim());
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      setError(null);
    } catch {
      setError(t('import.clipboardError'));
    }
  };

  /** Import from social media: fetch caption → parse → deliver */
  const handleSocialImport = async (importUrl: string) => {
    try {
      const post = await fetchSocialMediaPost(importUrl);
      const recipe = parseCaptionToRecipe(post.caption, {
        postTitle: post.postTitle,
        sourceUrl: post.sourceUrl,
        imageUrl: post.imageUrl,
      });

      // Always send to review form, even if parsing was imperfect
      onRecipeImported(recipe);
      setUrl('');
      setError(null);
    } catch (err) {
      const fetchError = err as SocialMediaFetchError;
      if (fetchError?.type) {
        setError(t(socialErrorToI18nKey(fetchError.type)));
      } else {
        setError(t('import.importFailed'));
      }
    }
  };

  /** Import from regular recipe website */
  const handleWebsiteImport = async (importUrl: string) => {
    try {
      const recipe = await parseRecipeFromUrl(importUrl);
      if (recipe.success) {
        onRecipeImported(recipe);
        setUrl('');
        setError(null);
      } else {
        if (recipe.title || recipe.ingredients.length > 0) {
          onRecipeImported(recipe);
          setUrl('');
          setError(null);
        } else {
          setError(recipe.error || t('import.parseFailed'));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.importFailed'));
    }
  };

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError(t('import.enterUrl')); return; }
    try { new URL(trimmed); } catch { setError(t('import.invalidUrl')); return; }

    setLoading(true);
    setError(null);

    try {
      if (isSocialMediaUrl(trimmed)) {
        await handleSocialImport(trimmed);
      } else {
        await handleWebsiteImport(trimmed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => { onOpenChange(false); onManualAdd(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleImport();
  };

  // Loading text changes for social media
  const loadingText = detectedPlatform
    ? t('import.socialImporting', { platform: platformLabel(detectedPlatform) })
    : t('import.importing');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[16px] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <SheetHeader className="pb-1">
          <SheetTitle>{t('import.title')}</SheetTitle>
          <SheetDescription className="text-xs">{t('import.subtitle')}</SheetDescription>
        </SheetHeader>
        <div className="mt-3 space-y-3 pb-2">
          {/* URL Input with platform detection indicator */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              {detectedPlatform ? (
                <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 w-4 h-4" />
              ) : (
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              )}
              <Input
                type="url"
                placeholder={t('import.urlPlaceholder')}
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="pl-10"
                aria-label="Recipe URL"
              />
            </div>
            <Button variant="outline" onClick={handlePaste} disabled={loading} className="flex-shrink-0">
              <ClipboardPaste className="w-4 h-4" />
            </Button>
          </div>

          {/* Platform detection badge */}
          {detectedPlatform && !loading && !error && (
            <div className="flex items-center gap-2 text-sm text-pink-600 bg-pink-50 rounded-md px-3 py-2">
              <Instagram className="w-4 h-4" />
              <span>{t('import.socialDetected', { platform: platformLabel(detectedPlatform) })}</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import button */}
          <Button onClick={handleImport} disabled={loading || !url.trim()} className="w-full" size="lg">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingText}</>
            ) : detectedPlatform ? (
              <><Instagram className="w-4 h-4 mr-2" />{t('import.importButton')}</>
            ) : (
              <><LinkIcon className="w-4 h-4 mr-2" />{t('import.importButton')}</>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('import.or')}</span>
            </div>
          </div>

          {/* Manual entry */}
          <Button variant="outline" onClick={handleManualEntry} disabled={loading} className="w-full" size="lg">
            <PlusCircle className="w-4 h-4 mr-2" />{t('import.manualAdd')}
          </Button>

          {/* OCR import from photo */}
          {onOcrImport && (
            <Button variant="outline" onClick={() => { onOpenChange(false); onOcrImport(); }} disabled={loading} className="w-full" size="lg">
              <Camera className="w-4 h-4 mr-2" />{t('ocr.title')}
            </Button>
          )}

          {/* Help text */}
          <div className="text-xs text-gray-500 text-center mt-2 space-y-0.5">
            <p>{t('import.helpText')}</p>
            <p className="flex items-center justify-center gap-1">
              <Instagram className="w-3 h-3" />
              <Globe className="w-3 h-3" />
              {t('import.socialHelpText')}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
