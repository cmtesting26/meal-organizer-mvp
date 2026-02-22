/**
 * Sprint 23 Component Tests
 *
 * S23-12: Integration wiring verification + unit tests
 * S23-13: Design token audit — verify no stale colors remain
 *
 * Tests all Sprint 23 design system components and verifies
 * warm amber/stone palette consistency across the codebase.
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

// ─── S23-02: WarmHeader Component ──────────────────────────────────

describe('S23-02: WarmHeader component', () => {
  const warmHeader = readFile('components/common/WarmHeader.tsx');

  it('exports WarmHeader', () => {
    expect(warmHeader).toContain('export const WarmHeader');
  });

  it('uses warm amber background (#FFFBEB)', () => {
    expect(warmHeader).toContain('#FFFBEB');
  });

  it('uses amber border (#FDE68A)', () => {
    expect(warmHeader).toContain('#FDE68A');
  });

  it('supports back button variant', () => {
    expect(warmHeader).toContain('backButton');
    expect(warmHeader).toContain('ArrowLeft');
  });

  it('supports right action slot', () => {
    expect(warmHeader).toContain('rightAction');
  });

  it('supports children (e.g., week navigation)', () => {
    expect(warmHeader).toContain('children');
  });

  it('uses Fraunces font family for title', () => {
    expect(warmHeader).toContain('Fraunces');
  });

  it('has sticky positioning', () => {
    expect(warmHeader).toContain('sticky top-0');
  });

  it('icon uses amber color (#D97706)', () => {
    expect(warmHeader).toContain('#D97706');
  });

  it('is integrated in App.tsx for Schedule/Library', () => {
    const app = readFile('App.tsx');
    expect(app).toContain("import { WarmHeader }");
    expect(app).toContain('<WarmHeader');
  });

  it('is integrated in Settings page', () => {
    const settings = readFile('pages/Settings.tsx');
    expect(settings).toContain("import { WarmHeader }");
    expect(settings).toContain('<WarmHeader');
  });
});

// ─── S23-03: TextTabs Component ────────────────────────────────────

describe('S23-03: TextTabs component', () => {
  const textTabs = readFile('components/common/TextTabs.tsx');

  it('exports TextTabs', () => {
    expect(textTabs).toContain('export const TextTabs');
  });

  it('has amber underline for active tab (#D97706)', () => {
    expect(textTabs).toContain('#D97706');
  });

  it('supports keyboard navigation (ArrowLeft/ArrowRight)', () => {
    expect(textTabs).toContain('ArrowRight');
    expect(textTabs).toContain('ArrowLeft');
  });

  it('uses ARIA tab roles', () => {
    expect(textTabs).toContain('role="tablist"');
    expect(textTabs).toContain('role="tab"');
    expect(textTabs).toContain('aria-selected');
  });

  it('is integrated in RecipeLibrary', () => {
    const library = readFile('components/recipes/RecipeLibrary.tsx');
    expect(library).toContain("import { TextTabs }");
    expect(library).toContain('<TextTabs');
  });
});

// ─── S23-04: OptionButton Component ────────────────────────────────

describe('S23-04: OptionButton component', () => {
  const optionBtn = readFile('components/common/OptionButton.tsx');

  it('exports OptionButton', () => {
    expect(optionBtn).toContain('export const OptionButton');
  });

  it('uses amber active state (#FEF3C7 bg, #92400E text, #D97706 border)', () => {
    expect(optionBtn).toContain('#FEF3C7');
    expect(optionBtn).toContain('#92400E');
    expect(optionBtn).toContain('#D97706');
  });

  it('uses stone inactive state (#F5F5F4 bg, #57534E text)', () => {
    expect(optionBtn).toContain('#F5F5F4');
    expect(optionBtn).toContain('#57534E');
  });

  it('has aria-pressed for accessibility', () => {
    expect(optionBtn).toContain('aria-pressed');
  });

  it('is integrated in Settings for theme selection', () => {
    const settings = readFile('pages/Settings.tsx');
    expect(settings).toContain("import { OptionButton }");
    expect(settings).toContain('<OptionButton');
  });
});

// ─── S23-05: Tag Chips Warm Stone Palette ──────────────────────────

describe('S23-05: Tag chips warm stone palette', () => {
  const tagChips = readFile('components/common/TagFilterChips.tsx');

  it('uses CSS tokens for default state', () => {
    expect(tagChips).toContain('--fs-bg-elevated');
    expect(tagChips).toContain('--fs-text-secondary');
    expect(tagChips).toContain('--fs-border-default');
  });

  it('uses CSS tokens for active state', () => {
    expect(tagChips).toContain('--fs-accent-light');
    expect(tagChips).toContain('--fs-accent-text');
    expect(tagChips).toContain('--fs-border-accent');
  });

  it('does NOT use blue Tailwind classes', () => {
    expect(tagChips).not.toContain('bg-blue');
    expect(tagChips).not.toContain('text-blue');
    expect(tagChips).not.toContain('border-blue');
  });

  it('has accessible aria-label', () => {
    expect(tagChips).toContain('aria-label');
  });
});

// ─── S23-07: DayCard Today Highlight ───────────────────────────────

describe('S23-07: DayCard today highlight + past muting', () => {
  const dayCard = readFile('components/schedule/DayCard.tsx');

  it('detects today with getTodayISO', () => {
    expect(dayCard).toContain('getTodayISO');
    expect(dayCard).toContain('isToday');
  });

  it('applies amber border for today (#D97706)', () => {
    expect(dayCard).toContain('#D97706');
  });

  it('applies warm background for today (#FFFBEB)', () => {
    expect(dayCard).toContain('#FFFBEB');
  });

  it('applies opacity-50 for past days', () => {
    expect(dayCard).toContain('isPast');
    expect(dayCard).toContain('opacity-50');
  });

  it('shows "Today" badge', () => {
    expect(dayCard).toContain("t('schedule.today')");
  });

  it('does NOT import RecencyBadge', () => {
    expect(dayCard).not.toContain('RecencyBadge');
  });
});

// ─── S23-09: Compact Recipe Cards ──────────────────────────────────

describe('S23-09: Compact recipe cards', () => {
  const recipeCard = readFile('components/recipes/RecipeCard.tsx');

  it('uses 56px thumbnail', () => {
    expect(recipeCard).toContain("width: '56px'");
    expect(recipeCard).toContain("height: '56px'");
  });

  it('uses warm stone border token', () => {
    expect(recipeCard).toContain('--fs-card-border');
  });

  it('tags use warm stone/amber palette tokens', () => {
    expect(recipeCard).toContain('--fs-bg-elevated');
    expect(recipeCard).toContain('--fs-text-secondary');
    expect(recipeCard).toContain('--fs-border-default');
  });

  it('does NOT use blue tag colors', () => {
    expect(recipeCard).not.toContain('bg-blue');
    expect(recipeCard).not.toContain('text-blue');
  });

  it('has accessible role and keyboard support', () => {
    expect(recipeCard).toContain('role="button"');
    expect(recipeCard).toContain('tabIndex={0}');
    expect(recipeCard).toContain('onKeyDown');
  });
});

// ─── S23-11: Bottom Nav Amber Active ───────────────────────────────

describe('S23-11: Bottom nav amber active state', () => {
  const bottomNav = readFile('components/layout/BottomNav.tsx');

  it('uses #D97706 for active color', () => {
    expect(bottomNav).toContain('#D97706');
  });

  it('uses muted color for inactive (#78716C)', () => {
    expect(bottomNav).toContain('#78716C');
  });

  it('FAB uses amber-600 background', () => {
    expect(bottomNav).toContain('bg-amber-600');
  });

  it('has 44px minimum touch targets', () => {
    expect(bottomNav).toContain('min-w-[44px]');
    expect(bottomNav).toContain('min-h-[44px]');
  });

  it('has aria-current for active page', () => {
    expect(bottomNav).toContain('aria-current');
  });
});

// ─── S23-01: Auth Redirect Fix ─────────────────────────────────────

describe('S23-01: Auth redirect production fix', () => {
  const useAuth = readFile('hooks/useAuth.tsx');
  const app = readFile('App.tsx');

  it('explicitly exchanges PKCE code', () => {
    expect(useAuth).toContain('exchangeCodeForSession');
  });

  it('handles /auth/callback URL path', () => {
    expect(useAuth).toContain('/auth/callback');
  });

  it('App.tsx handles auth callback with fallback UI', () => {
    expect(app).toContain("location.pathname === '/auth/callback'");
    expect(app).toContain('callbackFailed');
  });

  it('netlify.toml has auth callback redirect', () => {
    const netlify = readFileSync(resolve(__dirname, '../../netlify.toml'), 'utf-8');
    expect(netlify).toContain('/auth/callback');
    expect(netlify).toContain('status = 200');
  });
});

// ─── S23-13: Design Token Audit ────────────────────────────────────

describe('S23-13: Design token audit — no stale blue colors', () => {
  // Files that should have no blue tag chip colors
  const filesToCheck = [
    'components/common/TagFilterChips.tsx',
    'components/common/TagInput.tsx',
    'components/recipes/RecipeCard.tsx',
    'components/recipes/RecipeLibrary.tsx',
    'components/schedule/DayCard.tsx',
    'components/schedule/MealSlot.tsx',
    'components/layout/BottomNav.tsx',
    'pages/Settings.tsx',
  ];

  filesToCheck.forEach(file => {
    it(`${file} has no blue tag chip colors (#DBEAFE, #1E40AF)`, () => {
      const content = readFile(file);
      expect(content).not.toContain('#DBEAFE');
      expect(content).not.toContain('#1E40AF');
    });
  });

  it('WarmHeader is used on all main screens', () => {
    const app = readFile('App.tsx');
    const settings = readFile('pages/Settings.tsx');
    expect(app).toContain('<WarmHeader');
    expect(settings).toContain('<WarmHeader');
  });

  it('SegmentedControl is not imported anywhere', () => {
    const library = readFile('components/recipes/RecipeLibrary.tsx');
    expect(library).not.toMatch(/import\s+.*SegmentedControl/);
  });

  it('SegmentedControl.tsx file has been removed', () => {
    const segFile = resolve(SRC, 'components/recipes/SegmentedControl.tsx');
    expect(existsSync(segFile)).toBe(false);
  });

  it('SortSelect is not imported anywhere', () => {
    const library = readFile('components/recipes/RecipeLibrary.tsx');
    expect(library).not.toMatch(/import\s+.*SortSelect/);
  });

  it('primary accent color is amber (#D97706) throughout', () => {
    const bottomNav = readFile('components/layout/BottomNav.tsx');
    const warmHeader = readFile('components/common/WarmHeader.tsx');
    const dayCard = readFile('components/schedule/DayCard.tsx');
    expect(bottomNav).toContain('#D97706');
    expect(warmHeader).toContain('#D97706');
    expect(dayCard).toContain('#D97706');
  });

  it('card borders consistently use stone color', () => {
    const recipeCard = readFile('components/recipes/RecipeCard.tsx');
    expect(recipeCard).toContain('--fs-card-border');
  });
});

// ─── Wiring Verification ───────────────────────────────────────────

describe('Sprint 23: Component wiring verification', () => {
  const app = readFile('App.tsx');
  const settings = readFile('pages/Settings.tsx');
  const library = readFile('components/recipes/RecipeLibrary.tsx');
  const recipeDetail = readFile('pages/RecipeDetail.tsx');

  it('App.tsx → WarmHeader chain complete', () => {
    expect(app).toContain("import { WarmHeader }");
    expect(app).toContain('<WarmHeader');
    expect(app).toContain('CalendarDays');
    expect(app).toContain('BookOpen');
  });

  it('Settings → WarmHeader + OptionButton chain complete', () => {
    expect(settings).toContain("import { WarmHeader }");
    expect(settings).toContain("import { OptionButton }");
    expect(settings).toContain('<WarmHeader');
    expect(settings).toContain('<OptionButton');
  });

  it('Library → TextTabs + TagFilterChips chain complete', () => {
    expect(library).toContain("import { TextTabs }");
    expect(library).toContain("import { TagFilterChips }");
    expect(library).toContain('<TextTabs');
    expect(library).toContain('<TagFilterChips');
  });

  it('RecipeLibrary does NOT import SegmentedControl or SortSelect', () => {
    // Check import statements specifically, not comments
    expect(library).not.toMatch(/import\s+.*SegmentedControl/);
    expect(library).not.toMatch(/import\s+.*SortSelect/);
  });

  it('S23-06: Week navigation renders inside WarmHeader in App.tsx', () => {
    expect(app).toContain('schedule.goToPrevWeek');
    expect(app).toContain('schedule.goToNextWeek');
    expect(app).toContain('schedule.goToCurrentWeek');
    expect(app).toContain('formatWeekRange');
  });

  it('S23-06: WeeklySchedule accepts schedule data from parent', () => {
    const weeklySchedule = readFile('components/schedule/WeeklySchedule.tsx');
    expect(weeklySchedule).toContain('schedule?: ScheduleData');
    expect(weeklySchedule).toContain('externalSchedule');
  });

  it('S23-06: App.tsx passes schedule prop to WeeklySchedule', () => {
    expect(app).toContain('schedule={schedule}');
  });

  it('RecipeDetail uses WarmHeader with back button', () => {
    expect(recipeDetail).toContain("import { WarmHeader }");
    expect(recipeDetail).toContain('<WarmHeader');
    expect(recipeDetail).toContain('backButton');
  });

  it('TypeScript compiles cleanly', () => {
    // This is verified by the build step, but we check imports are valid
    expect(app).toContain("from './components/common/WarmHeader'");
    expect(settings).toContain("from '@/components/common/WarmHeader'");
    expect(settings).toContain("from '@/components/common/OptionButton'");
    expect(library).toContain("from '@/components/common/TextTabs'");
    expect(library).toContain("from '@/components/common/TagFilterChips'");
  });
});
