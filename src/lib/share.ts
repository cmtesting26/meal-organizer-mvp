/**
 * Share Utility (Sprint 7)
 *
 * Web Share API integration for sharing recipes via native share sheet.
 * Falls back to clipboard copy on unsupported platforms.
 */

import type { Recipe } from '@/types/recipe';

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function shareRecipe(recipe: Recipe): Promise<'shared' | 'copied' | 'failed'> {
  // Always share the public share URL (not /recipe/:id which requires auth)
  const shareUrl = `${window.location.origin}/recipe/shared/${recipe.id}`;
  // Only pass title + url to navigator.share — adding a text field causes
  // desktop "Copy" to concatenate url + text, producing duplicated output.
  const shareData = {
    title: `${recipe.title} - Fork and Spoon`,
    url: shareUrl,
  };

  if (canNativeShare()) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name === 'AbortError') {
        return 'failed'; // User cancelled — not an error
      }
    }
  }

  // Fallback: copy to clipboard — raw URL only so it can be pasted into a browser
  try {
    await navigator.clipboard.writeText(shareUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
