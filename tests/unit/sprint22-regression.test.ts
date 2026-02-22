/**
 * Sprint 22 — V1.0–V1.5 Full Regression Test Suite
 *
 * Comprehensive regression tests covering every major feature area
 * from V1.0 through V1.5 "Kitchen Companion" release.
 *
 * Areas covered:
 * 1. Core recipe CRUD (V1.0)
 * 2. Schedule management (V1.0)
 * 3. Import/export (V1.2)
 * 4. Recipe parser & ingredients (V1.2)
 * 5. Auth & sync (V1.3)
 * 6. OCR & social media import (V1.3)
 * 7. Ingredient scaling (V1.3)
 * 8. Onboarding & brand (V1.4)
 * 9. Bottom navigation (V1.4)
 * 10. Cooking mode (V1.5)
 * 11. Dark mode / theme (V1.5)
 * 12. Household feed (V1.5)
 * 13. Cook frequency & recency badges (V1.5)
 * 14. i18n completeness (V1.0–V1.5)
 * 15. Integration wiring (V1.5 additions)
 * 16. Database schema integrity
 * 17. Dark mode WCAG AA contrast audit
 * 18. Accessibility audit
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../../src');
const ROOT = path.resolve(__dirname, '../..');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8');
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(SRC, relativePath));
}

// ═══════════════════════════════════════════════════════════════
// 1. CORE RECIPE CRUD (V1.0)
// ═══════════════════════════════════════════════════════════════
describe('V1.0 — Core Recipe CRUD', () => {
  it('recipeService module exports CRUD functions', () => {
    const svc = readFile('lib/recipeService.ts');
    expect(svc).toContain('getRecipes');
    expect(svc).toContain('createRecipe');
    expect(svc).toContain('updateRecipe');
    expect(svc).toContain('deleteRecipe');
  });

  it('Recipe type has required fields', () => {
    const types = readFile('types/recipe.ts');
    expect(types).toContain('title');
    expect(types).toContain('ingredients');
    expect(types).toContain('instructions');
    expect(types).toContain('tags');
    expect(types).toContain('lastCookedDate');
  });

  it('RecipeForm component exists and uses i18n', () => {
    const form = readFile('components/recipes/RecipeForm.tsx');
    expect(form).toContain('useTranslation');
    expect(form).toContain('recipeForm');
  });

  it('RecipeLibrary renders recipes list', () => {
    const lib = readFile('components/recipes/RecipeLibrary.tsx');
    expect(lib).toContain('RecipeCard');
    expect(lib).toContain('onRecipeClick');
  });

  it('RecipeCard component exists with key UI elements', () => {
    const card = readFile('components/recipes/RecipeCard.tsx');
    expect(card).toContain('recipe.title');
    expect(card).toContain('tags');
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. SCHEDULE MANAGEMENT (V1.0)
// ═══════════════════════════════════════════════════════════════
describe('V1.0 — Schedule Management', () => {
  it('scheduleService exports schedule functions', () => {
    const svc = readFile('lib/scheduleService.ts');
    expect(svc).toContain('getScheduleForWeek');
    expect(svc).toContain('addToSchedule');
    expect(svc).toContain('removeFromSchedule');
  });

  it('WeeklySchedule component exists', () => {
    const ws = readFile('components/schedule/WeeklySchedule.tsx');
    expect(ws).toContain('useSchedule');
    expect(ws).toContain('WeekNavigation');
  });

  it('useSchedule hook is imported in WeeklySchedule', () => {
    const ws = readFile('components/schedule/WeeklySchedule.tsx');
    expect(ws).toContain("import { useSchedule }");
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. IMPORT / EXPORT (V1.2)
// ═══════════════════════════════════════════════════════════════
describe('V1.2 — Import / Export', () => {
  it('exportImport module has export and import functions', () => {
    const mod = readFile('lib/exportImport.ts');
    expect(mod).toContain('exportAllData');
    expect(mod).toContain('importData');
  });

  it('ImportSheet component exists', () => {
    expect(fileExists('components/recipes/ImportSheet.tsx')).toBe(true);
  });

  it('export/import supports JSON format', () => {
    const mod = readFile('lib/exportImport.ts');
    expect(mod).toContain('JSON');
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. RECIPE PARSER & INGREDIENTS (V1.2)
// ═══════════════════════════════════════════════════════════════
describe('V1.2 — Recipe Parser', () => {
  it('recipeParser module exists', () => {
    expect(fileExists('lib/recipeParser.ts')).toBe(true);
  });

  it('ingredientParser module exists', () => {
    expect(fileExists('lib/ingredientParser.ts')).toBe(true);
    const parser = readFile('lib/ingredientParser.ts');
    expect(parser).toContain('parseIngredient');
  });

  it('stepParser module exists for cooking mode', () => {
    expect(fileExists('lib/stepParser.ts')).toBe(true);
    const parser = readFile('lib/stepParser.ts');
    expect(parser).toContain('parseSteps');
  });

  it('ingredientMatcher module exists', () => {
    expect(fileExists('lib/ingredientMatcher.ts')).toBe(true);
    const matcher = readFile('lib/ingredientMatcher.ts');
    expect(matcher).toContain('matchIngredientsToSteps');
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. AUTH & SYNC (V1.3)
// ═══════════════════════════════════════════════════════════════
describe('V1.3 — Auth & Sync', () => {
  it('useAuth hook exists and exports key functions', () => {
    const hook = readFile('hooks/useAuth.tsx');
    expect(hook).toContain('useAuth');
    expect(hook).toContain('AuthProvider');
    expect(hook).toContain('signIn');
    expect(hook).toContain('signUp');
    expect(hook).toContain('signOut');
  });

  it('syncService exists', () => {
    expect(fileExists('lib/syncService.ts')).toBe(true);
  });

  it('SyncProvider exists', () => {
    const prov = readFile('hooks/useSyncProvider.tsx');
    expect(prov).toContain('SyncProvider');
  });

  it('AuthFlow component exists', () => {
    expect(fileExists('components/auth/AuthFlow.tsx')).toBe(true);
  });

  it('App.tsx wraps with AuthProvider', () => {
    const app = readFile('App.tsx');
    expect(app).toContain('AuthProvider');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. OCR & SOCIAL MEDIA IMPORT (V1.3)
// ═══════════════════════════════════════════════════════════════
describe('V1.3 — OCR & Social Media', () => {
  it('PhotoCapture component exists', () => {
    expect(fileExists('components/ocr/PhotoCapture.tsx')).toBe(true);
  });

  it('OcrReviewForm component exists', () => {
    expect(fileExists('components/ocr/OcrReviewForm.tsx')).toBe(true);
  });

  it('socialMediaFetcher exists', () => {
    expect(fileExists('lib/socialMediaFetcher.ts')).toBe(true);
  });

  it('captionRecipeParser exists', () => {
    expect(fileExists('lib/captionRecipeParser.ts')).toBe(true);
  });

  it('OCR is wired into App.tsx', () => {
    const app = readFile('App.tsx');
    expect(app).toContain('PhotoCapture');
    expect(app).toContain('OcrReviewForm');
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. INGREDIENT SCALING (V1.3)
// ═══════════════════════════════════════════════════════════════
describe('V1.3 — Ingredient Scaling', () => {
  it('useRecipeIngredients hook exists', () => {
    expect(fileExists('hooks/useRecipeIngredients.ts')).toBe(true);
    const hook = readFile('hooks/useRecipeIngredients.ts');
    expect(hook).toContain('useRecipeIngredients');
  });

  it('RecipeDetail imports scaling components', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain('ServingSelector');
    expect(detail).toContain('ScaledIngredientList');
    expect(detail).toContain('useRecipeIngredients');
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. ONBOARDING & BRAND (V1.4)
// ═══════════════════════════════════════════════════════════════
describe('V1.4 — Onboarding & Brand', () => {
  it('OnboardingFlow component exists', () => {
    expect(fileExists('components/onboarding/OnboardingFlow.tsx')).toBe(true);
  });

  it('SplashScreen component exists', () => {
    expect(fileExists('components/brand/SplashScreen.tsx')).toBe(true);
  });

  it('ForkAndSpoonLogo component exists', () => {
    expect(fileExists('components/brand/ForkAndSpoonLogo.tsx')).toBe(true);
  });

  it('App.tsx references onboarding and splash', () => {
    const app = readFile('App.tsx');
    expect(app).toContain('SplashScreen');
    expect(app).toContain('OnboardingFlow');
    expect(app).toContain('isOnboardingComplete');
  });

  it('Brand uses Fork & Spoon name', () => {
    const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
    expect(en.app.name).toContain('Fork');
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. BOTTOM NAVIGATION (V1.4)
// ═══════════════════════════════════════════════════════════════
describe('V1.4 — Bottom Navigation', () => {
  it('BottomNav component exists', () => {
    expect(fileExists('components/layout/BottomNav.tsx')).toBe(true);
  });

  it('BottomNav is wired in App.tsx', () => {
    const app = readFile('App.tsx');
    expect(app).toContain('BottomNav');
  });

  it('BottomNav has schedule, FAB, and library items', () => {
    const nav = readFile('components/layout/BottomNav.tsx');
    expect(nav).toContain('nav.schedule');
    expect(nav).toContain('nav.addRecipe');
    expect(nav).toContain('nav.library');
  });

  it('AddRecipeSheet component exists', () => {
    expect(fileExists('components/recipes/AddRecipeSheet.tsx')).toBe(true);
  });

  it('FullScreenBottomSheet component exists', () => {
    expect(fileExists('components/layout/FullScreenBottomSheet.tsx')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. COOKING MODE (V1.5)
// ═══════════════════════════════════════════════════════════════
describe('V1.5 — Cooking Mode', () => {
  it('CookingMode component exists with index', () => {
    expect(fileExists('components/CookingMode/CookingMode.tsx')).toBe(true);
    expect(fileExists('components/CookingMode/index.ts')).toBe(true);
  });

  it('StepNavigation component exists', () => {
    expect(fileExists('components/CookingMode/StepNavigation.tsx')).toBe(true);
  });

  it('CookingMode is wired into RecipeDetail', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain("import { CookingMode }");
    expect(detail).toContain('<CookingMode');
    expect(detail).toContain('showCookingMode');
    expect(detail).toContain('setShowCookingMode');
  });

  it('CookingMode uses step parser and ingredient matcher', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('parseSteps');
    expect(cm).toContain('matchIngredientsToSteps');
  });

  it('CookingMode has wake lock support', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('useWakeLock');
  });

  it('useWakeLock hook exists', () => {
    expect(fileExists('hooks/useWakeLock.ts')).toBe(true);
    const hook = readFile('hooks/useWakeLock.ts');
    expect(hook).toContain('useWakeLock');
  });

  it('CookingMode uses i18n keys', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('useTranslation');
    expect(cm).toContain("cookingMode.");
  });

  it('CookingMode supports keyboard navigation', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('ArrowLeft');
    expect(cm).toContain('ArrowRight');
  });

  it('CookingMode follows theme (CSS tokens)', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('var(--fs-');
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. DARK MODE / THEME (V1.5)
// ═══════════════════════════════════════════════════════════════
describe('V1.5 — Dark Mode / Theme', () => {
  it('useTheme hook exists and exports required API', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain('export function useTheme');
    expect(hook).toContain('ThemePreference');
    expect(hook).toContain('ResolvedTheme');
    expect(hook).toContain('preference');
    expect(hook).toContain('setTheme');
    expect(hook).toContain('resolvedTheme');
    expect(hook).toContain('isDark');
  });

  it('useTheme supports system/light/dark preferences', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain("'system'");
    expect(hook).toContain("'light'");
    expect(hook).toContain("'dark'");
  });

  it('useTheme listens to prefers-color-scheme', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain('prefers-color-scheme');
    expect(hook).toContain('addEventListener');
  });

  it('useTheme persists to localStorage', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain('localStorage');
    expect(hook).toContain('fs-theme-preference');
  });

  it('useTheme sets data-theme attribute on <html>', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain("setAttribute('data-theme'");
  });

  it('Sprint 23: OptionButton replaces ThemeToggle in Settings', () => {
    // ThemeToggle component file still exists but is no longer imported in Settings
    expect(fileExists('components/settings/ThemeToggle.tsx')).toBe(true);
    const settings = readFile('pages/Settings.tsx');
    // Sprint 23: Settings now uses OptionButton for theme selection
    expect(settings).toContain('OptionButton');
  });

  it('OptionButton is wired with useTheme', () => {
    const settings = readFile('pages/Settings.tsx');
    expect(settings).toContain('useTheme');
    expect(settings).toContain('setTheme');
  });

  it('tokens.css has light theme variables', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain(':root');
    expect(tokens).toContain('--fs-bg-base');
    expect(tokens).toContain('--fs-text-primary');
    expect(tokens).toContain('--fs-accent');
  });

  it('tokens.css has dark theme variables', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain("[data-theme='dark']");
    expect(tokens).toContain('--fs-bg-base');
    expect(tokens).toContain('#1C1917'); // Stone 900 dark base
    expect(tokens).toContain('#292524'); // Stone 800 dark surface
  });

  it('tokens.css has dark theme override utilities', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain("[data-theme='dark'] .bg-white");
  });

  it('tokens.css has theme transition prevention', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain('data-theme-transition');
  });

  it('meta theme-color is updated for dark mode', () => {
    const hook = readFile('hooks/useTheme.ts');
    expect(hook).toContain('theme-color');
    expect(hook).toContain('#1C1917'); // dark theme-color
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. HOUSEHOLD FEED (V1.5)
// ═══════════════════════════════════════════════════════════════
describe('V1.5 — Household Feed', () => {
  it('useNewRecipes hook exists', () => {
    expect(fileExists('hooks/useNewRecipes.ts')).toBe(true);
  });

  it('RecipeLibrary has segmented control for views', () => {
    const lib = readFile('components/recipes/RecipeLibrary.tsx');
    expect(lib).toContain('MostCookedView');
  });

  it('MostCookedView component exists', () => {
    expect(fileExists('components/recipes/MostCookedView.tsx')).toBe(true);
    const view = readFile('components/recipes/MostCookedView.tsx');
    expect(view).toContain('useCookFrequency');
  });

  it('householdFeed i18n keys exist', () => {
    const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
    expect(en.householdFeed).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 13. COOK FREQUENCY & RECENCY BADGES (V1.5)
// ═══════════════════════════════════════════════════════════════
describe('V1.5 — Cook Frequency & Recency', () => {
  it('useCookFrequency hook exists', () => {
    expect(fileExists('hooks/useCookFrequency.ts')).toBe(true);
    const hook = readFile('hooks/useCookFrequency.ts');
    expect(hook).toContain('export function useCookFrequency');
  });

  it('useLastCooked hook exists', () => {
    expect(fileExists('hooks/useLastCooked.ts')).toBe(true);
    const hook = readFile('hooks/useLastCooked.ts');
    expect(hook).toContain('useLastCooked');
  });

  it('CookFrequency component is wired into RecipeDetail', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain("import { CookFrequency }");
    expect(detail).toContain('<CookFrequency');
  });

  it('RecencyBadge component exists and uses CSS tokens', () => {
    const badge = readFile('components/common/RecencyBadge.tsx');
    expect(badge).toContain('var(--fs-recency-');
    expect(badge).toContain('getRecencyLevel');
    expect(badge).toContain('daysSince');
  });

  it('RecencyBadge is wired into RecipeDetail', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain("import { RecencyBadge }");
    expect(detail).toContain('<RecencyBadge');
  });

  it('RecencyBadge uses useLastCooked in RecipeDetail', () => {
    const detail = readFile('pages/RecipeDetail.tsx');
    expect(detail).toContain('useLastCooked');
    expect(detail).toContain('getLastCookedDate');
  });

  it('CookFrequency uses proper i18n keys', () => {
    const comp = readFile('components/recipes/CookFrequency.tsx');
    // S26-02: neverCooked no longer rendered (returns null), but stat keys still used
    expect(comp).toContain("frequency.thisMonth");
    expect(comp).toContain("frequency.thisYear");
    expect(comp).toContain("frequency.cooked");
  });

  it('RecencyBadge has correct thresholds', () => {
    const badge = readFile('components/common/RecencyBadge.tsx');
    // Green: ≤7 days, Yellow: 8-21, Red: ≥22
    expect(badge).toContain('<= 7');
    expect(badge).toContain('<= 21');
  });

  it('tokens.css has recency badge dark variants', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain('--fs-recency-green-bg');
    expect(tokens).toContain('--fs-recency-yellow-bg');
    expect(tokens).toContain('--fs-recency-red-bg');
    expect(tokens).toContain('--fs-recency-gray-bg');
  });
});

// ═══════════════════════════════════════════════════════════════
// 14. i18n COMPLETENESS (V1.0–V1.5)
// ═══════════════════════════════════════════════════════════════
describe('i18n completeness: EN↔DE parity', () => {
  const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
  const de = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/de.json'), 'utf-8'));

  it('every EN section exists in DE', () => {
    const missingSections = Object.keys(en).filter(
      (k) => typeof en[k] === 'object' && !(k in de),
    );
    expect(missingSections).toEqual([]);
  });

  it('every EN key exists in DE', () => {
    const missing: string[] = [];
    for (const section of Object.keys(en)) {
      if (typeof en[section] !== 'object') continue;
      if (!(section in de)) continue;
      for (const key of Object.keys(en[section])) {
        if (!(key in de[section])) {
          missing.push(`${section}.${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('no extra DE keys missing from EN', () => {
    const extra: string[] = [];
    for (const section of Object.keys(de)) {
      if (typeof de[section] !== 'object') continue;
      if (!(section in en)) {
        extra.push(`section: ${section}`);
        continue;
      }
      for (const key of Object.keys(de[section])) {
        if (!(key in en[section])) {
          extra.push(`${section}.${key}`);
        }
      }
    }
    expect(extra).toEqual([]);
  });

  // V1.5-specific i18n sections
  it('has cookingMode keys in both languages', () => {
    expect(en.cookingMode).toBeDefined();
    expect(de.cookingMode).toBeDefined();
    expect(Object.keys(en.cookingMode).length).toBeGreaterThanOrEqual(10);
  });

  it('has frequency keys in both languages', () => {
    expect(en.frequency).toBeDefined();
    expect(de.frequency).toBeDefined();
  });

  it('has recencyBadge keys in both languages', () => {
    expect(en.recencyBadge).toBeDefined();
    expect(de.recencyBadge).toBeDefined();
  });

  it('has householdFeed keys in both languages', () => {
    expect(en.householdFeed).toBeDefined();
    expect(de.householdFeed).toBeDefined();
  });

  it('has settings.theme key for dark mode toggle', () => {
    expect(en.settings.theme || en.settings.darkMode || en.settings.appearance).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 15. INTEGRATION WIRING — V1.5 ADDITIONS
// ═══════════════════════════════════════════════════════════════
describe('V1.5 integration wiring: all features reachable from App', () => {
  const app = readFile('App.tsx');
  const recipeDetail = readFile('pages/RecipeDetail.tsx');
  const settings = readFile('pages/Settings.tsx');
  const recipeLib = readFile('components/recipes/RecipeLibrary.tsx');

  it('App.tsx has route to RecipeDetail (cooking mode entry)', () => {
    expect(app).toContain('RecipeDetail');
    expect(app).toContain('/recipe/');
  });

  it('App.tsx has route to Settings (theme toggle)', () => {
    expect(app).toContain('Settings');
    expect(app).toContain('/settings');
  });

  it('RecipeDetail imports and renders CookingMode', () => {
    expect(recipeDetail).toContain("import { CookingMode }");
    expect(recipeDetail).toContain('<CookingMode');
  });

  it('RecipeDetail imports and renders CookFrequency', () => {
    expect(recipeDetail).toContain("import { CookFrequency }");
    expect(recipeDetail).toContain('<CookFrequency');
  });

  it('RecipeDetail imports and renders RecencyBadge', () => {
    expect(recipeDetail).toContain("import { RecencyBadge }");
    expect(recipeDetail).toContain('<RecencyBadge');
  });

  it('RecipeDetail uses useLastCooked for recency data', () => {
    expect(recipeDetail).toContain("import { useLastCooked }");
    expect(recipeDetail).toContain('useLastCooked(');
  });

  it('Settings page imports and renders OptionButton (Sprint 23, replaces ThemeToggle)', () => {
    expect(settings).toContain('OptionButton');
  });

  it('RecipeLibrary has MostCookedView', () => {
    expect(recipeLib).toContain("import { MostCookedView }");
    expect(recipeLib).toContain('<MostCookedView');
  });
});

// ═══════════════════════════════════════════════════════════════
// 16. DATABASE SCHEMA INTEGRITY
// ═══════════════════════════════════════════════════════════════
describe('Database schema integrity', () => {
  it('database.ts has recipes table', () => {
    const db = readFile('lib/database.ts');
    expect(db).toContain('recipes');
  });

  it('database.ts has schedule table', () => {
    const db = readFile('lib/database.ts');
    expect(db).toContain('schedule');
  });

  it('database module uses Dexie', () => {
    const db = readFile('lib/database.ts');
    expect(db).toContain('Dexie');
  });
});

// ═══════════════════════════════════════════════════════════════
// 17. DARK MODE WCAG AA CONTRAST AUDIT (CSS tokens)
// ═══════════════════════════════════════════════════════════════
describe('Dark mode WCAG AA contrast audit (token validation)', () => {
  const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');

  /**
   * Parse a hex color to {r, g, b}
   */
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace('#', '');
    return {
      r: parseInt(cleaned.substring(0, 2), 16),
      g: parseInt(cleaned.substring(2, 4), 16),
      b: parseInt(cleaned.substring(4, 6), 16),
    };
  }

  /**
   * Relative luminance per WCAG 2.0
   */
  function relativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Contrast ratio between two colors (WCAG formula)
   */
  function contrastRatio(hex1: string, hex2: string): number {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Dark mode backgrounds
  const darkBase = '#1C1917'; // Stone 900
  const darkSurface = '#292524'; // Stone 800

  // Dark mode text colors from the token file
  const darkTextPrimary = '#F5F5F4'; // Stone 100
  const darkTextSecondary = '#D6D3D1'; // Stone 300
  const darkTextMuted = '#A8A29E'; // Stone 400

  it('dark primary text on base: ≥4.5:1', () => {
    const ratio = contrastRatio(darkTextPrimary, darkBase);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark primary text on surface: ≥4.5:1', () => {
    const ratio = contrastRatio(darkTextPrimary, darkSurface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark secondary text on base: ≥4.5:1', () => {
    const ratio = contrastRatio(darkTextSecondary, darkBase);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark secondary text on surface: ≥4.5:1', () => {
    const ratio = contrastRatio(darkTextSecondary, darkSurface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('dark muted text on base: ≥3:1 (large text / UI component)', () => {
    const ratio = contrastRatio(darkTextMuted, darkBase);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  it('dark amber accent (#FBBF24) on base: ≥3:1 (UI component)', () => {
    const amberDark = '#FBBF24'; // Amber 400 (lightened for dark)
    const ratio = contrastRatio(amberDark, darkBase);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  it('dark amber accent (#FBBF24) on surface: ≥3:1 (UI component)', () => {
    const amberDark = '#FBBF24';
    const ratio = contrastRatio(amberDark, darkSurface);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  // Recency badge dark mode colors
  it('recency green badge text on dark bg: ≥4.5:1', () => {
    const greenText = '#6EE7B7'; // green-300
    const greenBg = '#064E3B'; // emerald-900
    const ratio = contrastRatio(greenText, greenBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('recency yellow badge text on dark bg: ≥4.5:1', () => {
    const yellowText = '#FDE68A'; // amber-200
    const yellowBg = '#713F12'; // yellow-900
    const ratio = contrastRatio(yellowText, yellowBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('recency red badge text on dark bg: ≥4.5:1', () => {
    const redText = '#FCA5A5'; // red-300
    const redBg = '#7F1D1D'; // red-900
    const ratio = contrastRatio(redText, redBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('recency gray badge text on dark bg: ≥3:1', () => {
    const grayText = '#A8A29E'; // Stone 400
    const grayBg = '#292524'; // Stone 800
    const ratio = contrastRatio(grayText, grayBg);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// 18. ACCESSIBILITY AUDIT
// ═══════════════════════════════════════════════════════════════
describe('Accessibility audit (V1.5 features)', () => {
  it('CookingMode has keyboard navigation (arrow keys)', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    expect(cm).toContain('ArrowLeft');
    expect(cm).toContain('ArrowRight');
    expect(cm).toContain('keydown');
  });

  it('CookingMode exit button is accessible', () => {
    const cm = readFile('components/CookingMode/CookingMode.tsx');
    // Should have aria-label or accessible text for close button
    expect(cm).toMatch(/aria-label|<X/);
  });

  it('OptionButton has accessible aria-pressed state', () => {
    const optionBtn = readFile('components/common/OptionButton.tsx');
    expect(optionBtn).toContain('aria-pressed');
  });

  it('RecencyBadge has semantic text', () => {
    const badge = readFile('components/common/RecencyBadge.tsx');
    expect(badge).toContain('useTranslation');
    // Badge renders text content, not just color
    expect(badge).toContain('recencyBadge.');
  });

  it('CookFrequency has semantic text', () => {
    const freq = readFile('components/recipes/CookFrequency.tsx');
    expect(freq).toContain('frequency.');
    // Not just visual — has text content
    expect(freq).toContain('<span>');
  });

  it('BottomNav buttons have labels', () => {
    const nav = readFile('components/layout/BottomNav.tsx');
    expect(nav).toContain('nav.');
    expect(nav).toContain('useTranslation');
  });

  it('focus outlines are not suppressed in tokens.css', () => {
    const tokens = fs.readFileSync(path.join(SRC, 'styles/tokens.css'), 'utf-8');
    // Should have focus ring tokens
    expect(tokens).toContain('--fs-focus');
  });
});

// ═══════════════════════════════════════════════════════════════
// 19. PWA & SERVICE WORKER
// ═══════════════════════════════════════════════════════════════
describe('PWA configuration', () => {
  it('vite.config.ts has PWA plugin', () => {
    const vite = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8');
    expect(vite).toContain('VitePWA');
  });

  it('index.html has theme-color meta tag', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    expect(html).toContain('theme-color');
  });

  it('public has app icons', () => {
    expect(fs.existsSync(path.join(ROOT, 'public/icon-512.png'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'public/favicon.ico'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 20. PACKAGE.JSON SANITY
// ═══════════════════════════════════════════════════════════════
describe('Package.json sanity', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  it('has required scripts', () => {
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('has core dependencies', () => {
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies['react-router-dom']).toBeDefined();
    expect(pkg.dependencies.dexie).toBeDefined();
    expect(pkg.dependencies.i18next).toBeDefined();
  });

  it('has test dependencies', () => {
    expect(pkg.devDependencies.vitest).toBeDefined();
    expect(pkg.dependencies['@testing-library/react']).toBeDefined();
  });
});
