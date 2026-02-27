/**
 * ImportSheet Component (Sprint 13 — Social Media Import)
 *
 * Updated to detect Instagram/TikTok URLs and route them through
 * the caption-based recipe parsing flow.
 *
 * D3 Design: Node ZAww4
 * - FullScreenBottomSheet with URL input + paste + import button
 * - Icons: link (16px), clipboard (14px), download (18px)
 * - Input: h-44, rounded-12, border #C5B5AB
 * - Import btn: h-48, rounded-14, bg terracotta, bold white text
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Link as LinkIcon,
  Clipboard,
  Download,
  AlertCircle,
  Instagram,
} from 'lucide-react';
import { FullScreenBottomSheet } from '@/components/layout/FullScreenBottomSheet';
import { parseRecipeFromUrl } from '@/lib/recipeParser';
import { isSocialMediaUrl, detectSocialPlatform, fetchSocialMediaPost } from '@/lib/socialMediaFetcher';
import { parseCaptionToRecipe } from '@/lib/captionRecipeParser';
import type { ParsedRecipe } from '@/types/recipe';
import type { SocialMediaFetchError } from '@/lib/socialMediaFetcher';

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeImported: (recipe: ParsedRecipe) => void;
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

export function ImportSheet({ open, onOpenChange, onRecipeImported }: ImportSheetProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect social media platform in real-time
  const detectedPlatform = useMemo(() => {
    if (!url.trim()) return null;
    return detectSocialPlatform(url.trim());
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setUrl(text.trim());
        setError(null);
      } else {
        // Clipboard empty — focus input so user can paste manually
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard API failed (common in mobile PWA) — focus input for manual paste
      inputRef.current?.focus();
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleImport();
  };

  // Loading text changes for social media
  const loadingText = detectedPlatform
    ? t('import.socialImporting', { platform: platformLabel(detectedPlatform) })
    : t('import.importing');

  return (
    <FullScreenBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('import.title', 'Import from Website')}
    >
      <div className="flex flex-col gap-4">
        {/* Description */}
        <p style={{ fontSize: 14, color: 'var(--fs-text-muted, #7A6E66)' }}>
          {t('import.subtitle', 'Paste a recipe URL to import it automatically')}
        </p>

        {/* URL input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            {detectedPlatform ? (
              <Instagram
                className="absolute top-1/2 -translate-y-1/2 text-pink-500"
                style={{ left: 14, width: 16, height: 16 }}
              />
            ) : (
              <LinkIcon
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: 14, width: 16, height: 16, color: 'var(--fs-text-muted, #7A6E66)' }}
              />
            )}
            <input
              ref={inputRef}
              type="url"
              placeholder={t('import.urlPlaceholder', 'https://example.com/recipe')}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full rounded-xl font-sans focus:outline-none"
              style={{
                height: 44,
                paddingLeft: 38,
                paddingRight: 14,
                fontSize: 14,
                backgroundColor: 'var(--fs-input-bg, #FFFFFF)',
                border: '1px solid var(--fs-input-border, #C5B5AB)',
                color: 'var(--fs-text-primary, #2D2522)',
              }}
              aria-label="Recipe URL"
            />
          </div>
          <button
            onClick={handlePaste}
            disabled={loading}
            className="flex-shrink-0 flex items-center justify-center rounded-xl transition-colors"
            style={{
              height: 44,
              paddingLeft: 16,
              paddingRight: 16,
              gap: 6,
              border: '1px solid var(--fs-border-default, #C5B5AB)',
              backgroundColor: 'transparent',
            }}
          >
            <Clipboard style={{ width: 14, height: 14, color: 'var(--fs-text-muted, #7A6E66)' }} />
            <span className="font-medium" style={{ fontSize: 13, color: 'var(--fs-text-primary, #2D2522)' }}>
              {t('import.paste', 'Paste')}
            </span>
          </button>
        </div>

        {/* Platform detection badge */}
        {detectedPlatform && !loading && !error && (
          <div className="flex items-center gap-2 text-sm text-pink-600 bg-pink-50 rounded-lg px-3 py-2">
            <Instagram className="w-4 h-4" />
            <span>{t('import.socialDetected', { platform: platformLabel(detectedPlatform) })}</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--fs-error-bg, #FEF2F2)', color: 'var(--fs-error, #DC2626)' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p style={{ fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="w-full flex items-center justify-center rounded-[14px] transition-colors disabled:opacity-50"
          style={{
            height: 48,
            gap: 8,
            backgroundColor: 'var(--fs-accent, #D4644E)',
            color: 'var(--fs-text-inverse, #FFFFFF)',
          }}
        >
          {loading ? (
            <>
              <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
              <span className="font-bold" style={{ fontSize: 14 }}>{loadingText}</span>
            </>
          ) : (
            <>
              <Download style={{ width: 18, height: 18 }} />
              <span className="font-bold" style={{ fontSize: 14 }}>{t('import.importButton', 'Import Recipe')}</span>
            </>
          )}
        </button>
      </div>
    </FullScreenBottomSheet>
  );
}
