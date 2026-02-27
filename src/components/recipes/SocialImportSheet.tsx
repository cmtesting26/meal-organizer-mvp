/**
 * SocialImportSheet Component
 *
 * Dedicated import sheet for Instagram/TikTok recipe posts.
 * Detects social platform from pasted URL, shows detection badge,
 * and routes through caption-based recipe parsing.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  Instagram,
  Download,
  X,
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
      <SheetContent
        side="bottom"
        className="!p-0 !gap-0 rounded-t-[20px] [&>button.absolute]:hidden"
        style={{ backgroundColor: 'var(--fs-bg-surface, #FFFFFF)' }}
      >
        {/* DragHandle — padding: [12, 0, 4, 0] */}
        <div className="flex justify-center" style={{ padding: '12px 0 4px 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 9999, backgroundColor: 'var(--fs-border-muted, #E8DDD8)' }} />
        </div>

        {/* SheetHeader — padding: [8, 24, 12, 24] */}
        <div className="flex items-center justify-between" style={{ padding: '8px 24px 12px 24px' }}>
          <h2
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              color: 'var(--fs-text-primary, #2D2522)',
            }}
          >
            {t('import.socialTitle')}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-full hover:bg-[var(--fs-hover-bg)] transition-colors"
            style={{ width: 44, height: 44 }}
            aria-label={t('common.close', 'Close')}
          >
            <X style={{ width: 20, height: 20, color: 'var(--fs-text-secondary, #7A6E66)' }} />
          </button>
        </div>

        {/* SheetBody — padding: [4, 24, 32, 24], gap: 16 */}
        <div style={{ padding: '4px 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--fs-text-secondary, #7A6E66)',
            }}
          >
            {t('import.subtitle')}
          </p>

          {/* InputRow — gap: 8 */}
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* UrlInput — h44, rounded-12, border, icon 16px */}
            <div className="relative flex-1 min-w-0">
              <Instagram
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: 14, width: 16, height: 16, color: 'var(--fs-text-secondary, #7A6E66)' }}
              />
              <input
                type="url"
                placeholder={t('import.urlPlaceholder')}
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full focus:outline-none focus:ring-2 focus:ring-[var(--fs-accent)]"
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--fs-border-default, #C5B5AB)',
                  backgroundColor: 'var(--fs-bg-surface, #FFFFFF)',
                  padding: '0 14px 0 38px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'var(--fs-text-primary, #2D2522)',
                }}
                aria-label="Social media URL"
              />
            </div>

            {/* PasteBtn — h44, rounded-12, border, gap: 6 */}
            <button
              onClick={handlePaste}
              disabled={loading}
              className="shrink-0 flex items-center justify-center transition-colors hover:bg-[var(--fs-hover-bg)] disabled:opacity-50"
              style={{
                height: 44,
                borderRadius: 12,
                border: '1px solid var(--fs-border-default, #C5B5AB)',
                gap: 6,
                padding: '0 16px',
                backgroundColor: 'transparent',
              }}
            >
              <Clipboard style={{ width: 14, height: 14, color: 'var(--fs-text-secondary, #7A6E66)' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--fs-text-primary, #2D2522)',
                }}
              >
                {t('import.paste')}
              </span>
            </button>
          </div>

          {/* DetectedBadge — rounded-full, fill #FEF0E8, gap: 4, padding: [4, 10] */}
          {detectedPlatform && !loading && !error && (
            <div
              className="flex items-center self-start"
              style={{
                gap: 4,
                padding: '4px 10px',
                borderRadius: 99,
                backgroundColor: 'var(--fs-accent-light, #FEF0E8)',
              }}
            >
              <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--fs-accent, #D4644E)' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--fs-accent-text, #B84835)',
                }}
              >
                {t('import.socialDetected', { platform: platformLabel(detectedPlatform) })}
              </span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ImportBtn — h48, rounded-14, fill #D4644E, gap: 8 */}
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="flex items-center justify-center w-full transition-colors disabled:opacity-50"
            style={{
              height: 48,
              borderRadius: 14,
              backgroundColor: 'var(--fs-accent, #D4644E)',
              gap: 8,
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 18, height: 18, color: 'var(--fs-text-inverse, #FFFFFF)' }} className="animate-spin" />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--fs-text-inverse, #FFFFFF)' }}>
                  {loadingText}
                </span>
              </>
            ) : (
              <>
                <Download style={{ width: 18, height: 18, color: 'var(--fs-text-inverse, #FFFFFF)' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--fs-text-inverse, #FFFFFF)' }}>
                  {t('import.importButton')}
                </span>
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
