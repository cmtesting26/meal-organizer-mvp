/**
 * Sprint 26 Component Tests
 *
 * Verifies all Sprint 26 changes:
 * - S26-01: Removed ingredient/step counts from Detail stats row
 * - S26-02: CookFrequency hidden when never cooked
 * - S26-03: Start Cooking button constrained to content width
 * - S26-04: Reduced Library top padding
 * - S26-05: Sticky header uses theme-aware background
 * - S26-06: Year moved into each card's cook count badge
 * - S26-07: RecencyBadge restored on RecipeCard
 * - S26-08: Improved ingredient-to-step matching
 * - S26-09: Swipe hint text removed
 * - S26-10: Full-screen swipe gestures in CookingMode
 * - S26-11: RecipePicker sort by cook count desc
 * - S26-12: Cook count flame badge in RecipePicker
 * - S26-14: Splash screen extended to 3s, circular logo, amber spinner
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve('src', relativePath), 'utf8');
}

// ─── Detail Page (S26-01, S26-02, S26-03) ──────────────────────────────

describe('S26-01: Remove ingredient/step counts from Detail stats row', () => {
  const detail = readFile('pages/RecipeDetail.tsx');

  it('does not contain Clock icon for ingredients count', () => {
    // Should not import Clock icon anymore
    expect(detail).not.toContain("'Clock'");
    expect(detail).not.toContain('Clock className');
  });

  it('does not contain Users icon for steps count', () => {
    expect(detail).not.toContain("'Users'");
    expect(detail).not.toContain('Users className');
  });

  it('still shows RecencyBadge', () => {
    expect(detail).toContain('RecencyBadge');
    expect(detail).toContain('getLastCookedDate');
  });

  it('still shows CookFrequency', () => {
    expect(detail).toContain('CookFrequency');
  });

  it('still shows source link', () => {
    expect(detail).toContain('recipes.source');
    expect(detail).toContain('ExternalLink');
  });
});

describe('S26-02: CookFrequency hidden when never cooked', () => {
  const comp = readFile('components/recipes/CookFrequency.tsx');

  it('returns null when total === 0', () => {
    expect(comp).toContain('return null');
    expect(comp).toContain('frequency.total === 0');
  });

  it('does not render "Never cooked" text', () => {
    // The "Never cooked" rendering block should be gone
    expect(comp).not.toContain("frequency.neverCooked");
  });
});

describe('S26-03: Start Cooking button constrained to content width', () => {
  const detail = readFile('pages/RecipeDetail.tsx');

  it('wraps button in a max-w-4xl container', () => {
    expect(detail).toContain('max-w-4xl mx-auto px-4 sm:px-6 py-3');
  });

  it('button is still fixed at bottom', () => {
    expect(detail).toContain('fixed bottom-0');
  });
});

// ─── Library Page (S26-04, S26-05, S26-06, S26-07) ─────────────────────

describe('S26-04: Reduce Library top padding', () => {
  const lib = readFile('components/recipes/RecipeLibrary.tsx');

  it('uses pt-0 instead of pt-2', () => {
    expect(lib).toContain('pt-0');
    expect(lib).not.toMatch(/container.*pt-2.*pb-6/);
  });
});

describe('S26-05: Sticky header with theme-aware background', () => {
  const lib = readFile('components/recipes/RecipeLibrary.tsx');

  it('uses CSS custom property for background', () => {
    expect(lib).toContain('fs-bg-base');
  });

  it('header is sticky', () => {
    expect(lib).toContain('sticky z-20');
  });
});

describe('S26-06: Year in each card badge instead of subtitle', () => {
  const most = readFile('components/recipes/MostCookedView.tsx');
  const card = readFile('components/recipes/RecipeCard.tsx');

  it('MostCookedView does not have yearLabel subtitle', () => {
    expect(most).not.toContain('yearLabel');
  });

  it('RecipeCard shows full cookCountLabel text in badge', () => {
    expect(card).toContain('cookCountLabel || `${cookCount}×`');
  });
});

describe('S26-07: RecencyBadge restored on RecipeCard', () => {
  const card = readFile('components/recipes/RecipeCard.tsx');

  it('imports RecencyBadge', () => {
    expect(card).toContain("import { RecencyBadge }");
  });

  it('renders RecencyBadge in card', () => {
    expect(card).toContain('<RecencyBadge');
    expect(card).toContain('lastCookedDate={lastCookedDate}');
  });

  it('uses compact variant', () => {
    expect(card).toContain('compact');
  });

  it('does not show RecencyBadge when cookCount is set (MostCooked view)', () => {
    expect(card).toContain('!cookCount');
  });
});

// ─── Cooking Mode (S26-08, S26-09, S26-10) ─────────────────────────────

describe('S26-08: Improved ingredient-to-step matching', () => {
  const matcher = readFile('lib/ingredientMatcher.ts');

  it('extracts individual keywords from multi-word ingredients', () => {
    expect(matcher).toContain('Extract individual keywords');
    expect(matcher).toContain('stopWords');
  });

  it('has a stopWords set to prevent false positives', () => {
    expect(matcher).toContain("'and'");
    expect(matcher).toContain("'the'");
    expect(matcher).toContain("'temperature'");
  });

  it('uses word boundary matching for all terms', () => {
    expect(matcher).toContain('\\\\b${escapeRegex(term)}\\\\b');
  });
});

describe('S26-09: Swipe hint text removed', () => {
  const nav = readFile('components/CookingMode/StepNavigation.tsx');

  it('does not contain swipe hint text', () => {
    expect(nav).not.toContain('Swipe to navigate');
  });
});

describe('S26-10: Full-screen swipe gestures in CookingMode', () => {
  const cm = readFile('components/CookingMode/CookingMode.tsx');

  it('has touch handlers on main content area', () => {
    expect(cm).toContain('onTouchStart={handleTouchStart}');
    expect(cm).toContain('onTouchEnd={handleTouchEnd}');
  });

  it('defines swipe threshold', () => {
    expect(cm).toContain('SWIPE_THRESHOLD');
  });

  it('uses useRef for touch tracking', () => {
    expect(cm).toContain('touchStartX');
    expect(cm).toContain('touchStartY');
  });
});

// ─── Schedule Modal (S26-11, S26-12) ────────────────────────────────────

describe('S26-11: RecipePicker sorted by cook count desc', () => {
  const picker = readFile('components/schedule/RecipePicker.tsx');

  it('imports useCookFrequency', () => {
    expect(picker).toContain("import { useCookFrequency }");
  });

  it('uses frequencyMap for sorting', () => {
    expect(picker).toContain('frequencyMap');
  });

  it('sorts by thisYear count descending', () => {
    expect(picker).toContain('bCount - aCount');
  });

  it('puts never-cooked at bottom', () => {
    expect(picker).toContain('!aDate && bDate');
  });
});

describe('S26-12: Cook count badge in RecipePicker', () => {
  const picker = readFile('components/schedule/RecipePicker.tsx');

  it('imports Flame icon', () => {
    expect(picker).toContain('Flame');
  });

  it('shows cook count badge with year', () => {
    expect(picker).toContain('currentYear');
    expect(picker).toContain('× in');
  });

  it('hides badge when count is 0', () => {
    expect(picker).toContain('count <= 0');
  });
});

// ─── Splash / Loading (S26-14) ──────────────────────────────────────────

describe('S26-14: Splash screen polish', () => {
  const splash = readFile('components/brand/SplashScreen.tsx');
  const spinner = readFile('components/common/LoadingSpinner.tsx');

  it('splash has 3s hold before fade', () => {
    expect(splash).toContain('3000');
    expect(splash).toContain('3400');
  });

  it('splash uses circular border radius', () => {
    expect(splash).toContain("borderRadius: '50%'");
    expect(splash).not.toContain("borderRadius: '22.5%'");
  });

  it('splash has holding phase', () => {
    expect(splash).toContain("'holding'");
  });

  it('LoadingSpinner uses amber brand color', () => {
    expect(spinner).toContain('fs-accent');
    expect(spinner).toContain('#D97706');
  });

  it('LoadingSpinner does not use gray color', () => {
    expect(spinner).not.toContain('text-gray-600');
  });
});
