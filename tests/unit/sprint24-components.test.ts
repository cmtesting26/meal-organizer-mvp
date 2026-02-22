/**
 * Sprint 24 Component Tests
 *
 * S24-08: Integration wiring verification + unit tests
 * S24-09: Responsive design verification (file-level checks)
 *
 * Covers:
 * - S24-01: RecipeDetail WarmHeader + overflow menu + TextTabs
 * - S24-02: Import flow compact spacing
 * - S24-03: Photo import bottom sheet
 * - S24-04: Simplified invite/join flow
 * - S24-05: Most Cooked year scoping (backend)
 * - S24-06: Most Cooked year label + badge display
 * - S24-07: Design audit consistency
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SRC = resolve(__dirname, '../../src');

function readFile(path: string): string {
  const full = resolve(SRC, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf-8');
}

// ─── S24-01: RecipeDetail WarmHeader + Overflow Menu + TextTabs ──────

describe('S24-01: RecipeDetail redesign', () => {
  const recipeDetail = readFile('pages/RecipeDetail.tsx');

  it('imports WarmHeader', () => {
    expect(recipeDetail).toContain("from '@/components/common/WarmHeader'");
  });

  it('imports TextTabs', () => {
    expect(recipeDetail).toContain("from '@/components/common/TextTabs'");
  });

  it('uses WarmHeader with backButton prop', () => {
    expect(recipeDetail).toContain('<WarmHeader');
    expect(recipeDetail).toContain('backButton');
  });

  it('uses MoreVertical for overflow menu', () => {
    expect(recipeDetail).toContain('MoreVertical');
  });

  it('has overflow menu with Share, Edit, Delete actions', () => {
    expect(recipeDetail).toContain('handleShare');
    expect(recipeDetail).toContain('handleEdit');
    expect(recipeDetail).toContain('handleDeleteClick');
    expect(recipeDetail).toContain("role=\"menu\"");
    expect(recipeDetail).toContain("role=\"menuitem\"");
  });

  it('has TextTabs for Ingredients/Instructions', () => {
    expect(recipeDetail).toContain('<TextTabs');
    expect(recipeDetail).toContain("key: 'ingredients'");
    expect(recipeDetail).toContain("key: 'instructions'");
  });

  it('has activeTab state for tab switching', () => {
    expect(recipeDetail).toContain("useState<string>('ingredients')");
  });

  it('has V1.6 amber step number circles', () => {
    expect(recipeDetail).toContain('#FEF3C7'); // amber-50 background
    expect(recipeDetail).toContain('#92400E'); // amber-800 text
  });

  it('has V1.6 styled ingredient rows with border', () => {
    expect(recipeDetail).toContain("border: '1px solid var(--fs-border-default");
  });

  it('has pinned Start Cooking button at bottom', () => {
    expect(recipeDetail).toContain('fixed bottom-0');
    expect(recipeDetail).toContain('startCooking');
    expect(recipeDetail).toContain("backgroundColor: '#D97706'");
  });

  it('closes menu on outside click', () => {
    expect(recipeDetail).toContain('handleClickOutside');
  });

  it('closes menu on Escape key', () => {
    expect(recipeDetail).toContain('handleEscape');
    expect(recipeDetail).toContain("'Escape'");
  });

  it('uses navigate(-1) for back (browser history)', () => {
    expect(recipeDetail).toContain('navigate(-1)');
  });

  it('no longer has separate Share/Edit/Delete buttons in header', () => {
    // Previously had three separate buttons in rightAction
    // Now consolidated into overflow menu
    const rightActionSection = recipeDetail.split('rightAction={')[1]?.split('/>')[0] || '';
    expect(rightActionSection).not.toContain('<Share2');
    expect(rightActionSection).not.toContain('<Pencil');
  });
});

// ─── S24-02: Import Flow Compact URL Form ────────────────────────────

describe('S24-02: Import flow compact spacing', () => {
  const importSheet = readFile('components/recipes/ImportSheet.tsx');

  it('uses auto-height bottom sheet (no fixed vh)', () => {
    expect(importSheet).not.toContain('h-[85vh]');
    expect(importSheet).not.toContain('h-[90vh]');
    expect(importSheet).toContain('side="bottom"');
  });

  it('has safe-area bottom padding', () => {
    expect(importSheet).toContain('safe-area-inset-bottom');
  });

  it('uses compact spacing (mt-3 space-y-3)', () => {
    expect(importSheet).toContain('mt-3 space-y-3');
  });

  it('uses compact help text (text-xs)', () => {
    expect(importSheet).toContain('text-xs');
  });

  it('preserves all import functionality', () => {
    expect(importSheet).toContain('handleImport');
    expect(importSheet).toContain('handlePaste');
    expect(importSheet).toContain('isSocialMediaUrl');
    expect(importSheet).toContain('onOcrImport');
  });
});

// ─── S24-03: Photo Import Bottom Sheet ───────────────────────────────

describe('S24-03: Photo import bottom sheet', () => {
  const photoSheet = readFile('components/ocr/PhotoImportSheet.tsx');
  const appTsx = readFile('App.tsx');

  it('PhotoImportSheet file exists', () => {
    expect(photoSheet.length).toBeGreaterThan(0);
  });

  it('uses Sheet component for consistent bottom-sheet behavior', () => {
    expect(photoSheet).toContain("from '@/components/ui/sheet'");
    expect(photoSheet).toContain('<Sheet');
    expect(photoSheet).toContain('<SheetContent');
    expect(photoSheet).toContain('side="bottom"');
  });

  it('has rounded top corners', () => {
    expect(photoSheet).toContain('rounded-t-[16px]');
  });

  it('wraps PhotoCapture component', () => {
    expect(photoSheet).toContain('<PhotoCapture');
  });

  it('is wired in App.tsx replacing raw PhotoCapture', () => {
    expect(appTsx).toContain('<PhotoImportSheet');
    expect(appTsx).toContain("import { PhotoImportSheet }");
  });

  it('handles safe area insets', () => {
    expect(photoSheet).toContain('safe-area-inset-bottom');
  });
});

// ─── S24-04: Simplified Invite/Join Flow ─────────────────────────────

describe('S24-04: Simplified invite/join flow', () => {
  const accountSection = readFile('components/settings/AccountSection.tsx');

  it('has one-tap invite sharing function', () => {
    expect(accountSection).toContain('handleShareInvite');
  });

  it('builds invite URL from code', () => {
    expect(accountSection).toContain('window.location.origin');
    expect(accountSection).toContain('?invite=');
  });

  it('uses native share API when available', () => {
    expect(accountSection).toContain('navigator.share');
  });

  it('falls back to clipboard copy', () => {
    expect(accountSection).toContain('navigator.clipboard.writeText');
  });

  it('shows success confirmation (copiedLink state)', () => {
    expect(accountSection).toContain('setCopiedLink(true)');
    expect(accountSection).toContain('linkCopied');
  });

  it('has amber-styled invite button', () => {
    expect(accountSection).toContain("backgroundColor: 'var(--fs-accent, #D97706)'");
  });

  it('shows invite link active status', () => {
    expect(accountSection).toContain('inviteLinkActive');
  });

  it('handles error states', () => {
    expect(accountSection).toContain('shareError');
    expect(accountSection).toContain('inviteError');
  });
});

// ─── S24-05: Most Cooked — Current Year Scoping (Backend) ───────────

describe('S24-05: Most Cooked current year scoping', () => {
  const mostCooked = readFile('components/recipes/MostCookedView.tsx');
  const cookFrequency = readFile('hooks/useCookFrequency.ts');

  it('MostCookedView filters by thisYear instead of total', () => {
    expect(mostCooked).toContain('r.thisYear > 0');
    expect(mostCooked).toContain('b.thisYear - a.thisYear');
  });

  it('MostCookedView computes currentYear dynamically', () => {
    expect(mostCooked).toContain('new Date().getFullYear()');
  });

  it('useCookFrequency hook computes thisYear count', () => {
    expect(cookFrequency).toContain('thisYear');
    expect(cookFrequency).toContain('currentYear');
  });

  it('useCookFrequency only counts past entries (not future)', () => {
    expect(cookFrequency).toContain('>= today');
  });
});

// ─── S24-06: Most Cooked — Year Label + Badge Display ────────────────

describe('S24-06: Most Cooked year label + badge display', () => {
  const mostCooked = readFile('components/recipes/MostCookedView.tsx');
  const recipeCard = readFile('components/recipes/RecipeCard.tsx');

  it('MostCookedView uses year in each card badge (S26-06: moved from subtitle)', () => {
    expect(mostCooked).toContain('cookedInYear');
    expect(mostCooked).toContain('cookCountLabel=');
  });

  it('MostCookedView passes cookCountLabel to RecipeCard', () => {
    expect(mostCooked).toContain('cookCountLabel=');
    expect(mostCooked).toContain('cookedInYear');
  });

  it('RecipeCard accepts cookCountLabel prop', () => {
    expect(recipeCard).toContain('cookCountLabel?: string');
  });

  it('RecipeCard uses cookCountLabel as title attribute', () => {
    expect(recipeCard).toContain('title={cookCountLabel}');
  });

  it('MostCookedView has year-specific empty state', () => {
    expect(mostCooked).toContain('emptyYearTitle');
    expect(mostCooked).toContain('emptyYearSubtitle');
  });

  it('cook count badge uses warm amber styling', () => {
    expect(recipeCard).toContain('#FEF3C7'); // bg
    expect(recipeCard).toContain('#92400E'); // text
  });
});

// ─── S24-07: Design Audit Consistency ────────────────────────────────

describe('S24-07: Design audit consistency', () => {
  it('AddRecipeSheet uses V1.6 tokens instead of Tailwind grays', () => {
    const addSheet = readFile('components/recipes/AddRecipeSheet.tsx');
    expect(addSheet).toContain("var(--fs-text-primary");
    expect(addSheet).toContain("var(--fs-text-muted");
    expect(addSheet).toContain('#FEF3C7'); // amber-50 icon bg
    expect(addSheet).not.toContain('bg-amber-100 text-amber-700');
  });

  it('OnboardingScreen uses V1.6 text tokens', () => {
    const onboarding = readFile('components/onboarding/OnboardingScreen.tsx');
    expect(onboarding).toContain("var(--fs-text-primary");
    expect(onboarding).toContain("var(--fs-text-secondary");
    expect(onboarding).not.toContain('text-gray-900');
  });

  it('RecipeDetail uses V1.6 base background', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain("var(--fs-bg-base");
    expect(detail).not.toContain('bg-gray-50');
  });

  it('FullScreenBottomSheet uses V1.6 surface tokens', () => {
    const sheet = readFile('components/layout/FullScreenBottomSheet.tsx');
    expect(sheet).toContain('var(--fs-bg-surface)');
    expect(sheet).toContain('var(--fs-text-primary)');
    expect(sheet).toContain('var(--fs-text-muted)');
  });
});

// ─── S24-08: i18n Key Completeness ───────────────────────────────────

describe('S24-08: i18n key completeness', () => {
  const enJson = readFile('i18n/en.json');
  const deJson = readFile('i18n/de.json');

  it('en.json has recipeDetail.moreActions key', () => {
    expect(enJson).toContain('"moreActions"');
  });

  it('en.json has frequency.cookedInYear key', () => {
    expect(enJson).toContain('"cookedInYear"');
  });

  it('en.json has frequency.yearLabel key', () => {
    expect(enJson).toContain('"yearLabel"');
  });

  it('en.json has frequency.emptyYearTitle key', () => {
    expect(enJson).toContain('"emptyYearTitle"');
  });

  it('en.json has account.invitePartner key', () => {
    expect(enJson).toContain('"invitePartner"');
  });

  it('de.json has all Sprint 24 keys', () => {
    expect(deJson).toContain('"moreActions"');
    expect(deJson).toContain('"cookedInYear"');
    expect(deJson).toContain('"yearLabel"');
    expect(deJson).toContain('"emptyYearTitle"');
  });
});

// ─── S24-09: Responsive Design Verification ──────────────────────────

describe('S24-09: Responsive design verification', () => {
  it('RecipeDetail has responsive image heights (h-56 sm:h-72)', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain('h-56 sm:h-72');
  });

  it('RecipeDetail has safe area bottom padding for pinned button', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain('safe-area-inset-bottom');
  });

  it('ImportSheet uses auto height with safe-area bottom padding', () => {
    const importSheet = readFile('components/recipes/ImportSheet.tsx');
    expect(importSheet).toContain('safe-area-inset-bottom');
    expect(importSheet).toContain('side="bottom"');
  });

  it('PhotoImportSheet handles safe area insets', () => {
    const photoSheet = readFile('components/ocr/PhotoImportSheet.tsx');
    expect(photoSheet).toContain('safe-area-inset-bottom');
  });

  it('MostCookedView grid has responsive columns', () => {
    const mostCooked = readFile('components/recipes/MostCookedView.tsx');
    expect(mostCooked).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
  });

  it('RecipeDetail max-w-4xl constrains width on desktop', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain('max-w-4xl');
  });
});
