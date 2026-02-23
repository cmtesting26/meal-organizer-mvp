/**
 * SocialImportSheet Component
 *
 * Dedicated import sheet for Instagram/TikTok recipe posts.
 * Detects social platform from pasted URL, shows detection badge,
 * and routes through caption-based recipe parsing.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  ClipboardPaste,
  AlertCircle,
  Instagram,
} from 'lucide-react';
import { detectSocialPlatform, fetchSocialMediaPost } from '@/lib/socialMediaFetcher';
import { parseCaptionToRecipe } from '@/lib/captionRecipeParser';
import type { ParsedRecipe } from '@/types/recipe';
import type { SocialMediaFetchError } from '@/lib/socialMediaFetcher';

interface SocialImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeImported: (recipe: ParsedRecipe) => void;
}

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

function platformLabel(platform: string): string {
  return platform === 'instagram' ? 'Instagram' : 'TikTok';
}

export function SocialImportSheet({ open, onOpenChange, onRecipeImported }: SocialImportSheetProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError(t('import.enterUrl')); return; }
    try { new URL(trimmed); } catch { setError(t('import.invalidUrl')); return; }

    setLoading(true);
    setError(null);

    try {
      const post = await fetchSocialMediaPost(trimmed);
      const recipe = parseCaptionToRecipe(post.caption, {
        postTitle: post.postTitle,
        sourceUrl: post.sourceUrl,
        imageUrl: post.imageUrl,
      });
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
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleImport();
  };

  const loadingText = detectedPlatform
    ? t('import.socialImporting', { platform: platformLabel(detectedPlatform) })
    : t('import.importing');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[16px] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <SheetHeader className="pb-1">
          <SheetTitle>{t('import.socialTitle')}</SheetTitle>
          <SheetDescription className="text-xs">{t('import.subtitle')}</SheetDescription>
        </SheetHeader>
        <div className="mt-3 space-y-3 pb-2">
          {/* URL Input — always shows Instagram icon */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 w-4 h-4" />
              <Input
                type="url"
                placeholder={t('import.urlPlaceholder')}
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="pl-10"
                aria-label="Social media URL"
              />
            </div>
            <Button variant="outline" onClick={handlePaste} disabled={loading} className="flex-shrink-0">
              <ClipboardPaste className="w-4 h-4" />
              {t('import.paste')}
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

          {/* Import button — always shows Instagram icon */}
          <Button onClick={handleImport} disabled={loading || !url.trim()} className="w-full" size="lg">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingText}</>
            ) : (
              <><Instagram className="w-4 h-4 mr-2" />{t('import.importButton')}</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
