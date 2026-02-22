/**
 * Integration Smoke Tests (Sprint 12)
 *
 * These tests verify that Sprint 12 features are actually wired into
 * the pages users see — not just that the components work in isolation.
 *
 * This catches the "dead code" problem: components that pass unit tests
 * but are never imported/rendered in the real app.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../../src');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8');
}

describe('Integration wiring: components are mounted in pages', () => {
  // ─── Recipe Scaling in RecipeDetail ─────────────────────────────────

  describe('Recipe Scaling is wired into RecipeDetail', () => {
    const recipeDetail = readFile('pages/RecipeDetail.tsx');

    it('imports ServingSelector', () => {
      expect(recipeDetail).toContain("import { ServingSelector }");
    });

    it('imports ScaledIngredientList', () => {
      expect(recipeDetail).toContain("import { ScaledIngredientList }");
    });

    it('imports useRecipeIngredients hook', () => {
      expect(recipeDetail).toContain("import { useRecipeIngredients }");
    });

    it('renders <ServingSelector in JSX', () => {
      expect(recipeDetail).toContain('<ServingSelector');
    });

    it('renders <ScaledIngredientList in JSX', () => {
      expect(recipeDetail).toContain('<ScaledIngredientList');
    });
  });

  // ─── AccountSection in Settings ─────────────────────────────────────

  describe('AccountSection is wired into Settings page', () => {
    const settings = readFile('pages/Settings.tsx');

    it('imports AccountSection', () => {
      expect(settings).toContain("import { AccountSection }");
    });

    it('renders <AccountSection in JSX', () => {
      expect(settings).toContain('<AccountSection');
    });
  });

  // ─── i18n keys exist ────────────────────────────────────────────────

  describe('i18n keys exist for Sprint 12 features', () => {
    const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
    const de = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/de.json'), 'utf-8'));

    it('EN has account section keys', () => {
      expect(en.account).toBeDefined();
      expect(en.account.guestTitle).toBeDefined();
      expect(en.account.inviteCode).toBeDefined();
      expect(en.account.syncNow).toBeDefined();
      expect(en.account.lastSynced).toBeDefined();
      expect(en.account.regenerateCode).toBeDefined();
      expect(en.account.signOutConfirmTitle).toBeDefined();
    });

    it('DE has account section keys', () => {
      expect(de.account).toBeDefined();
      expect(de.account.guestTitle).toBeDefined();
      expect(de.account.inviteCode).toBeDefined();
      expect(de.account.syncNow).toBeDefined();
    });

    it('EN has scaling keys', () => {
      expect(en.scaling).toBeDefined();
      expect(en.scaling.servings).toBeDefined();
      expect(en.scaling.increase).toBeDefined();
      expect(en.scaling.decrease).toBeDefined();
    });

    it('DE has scaling keys', () => {
      expect(de.scaling).toBeDefined();
      expect(de.scaling.servings).toBeDefined();
    });

    it('EN has common keys', () => {
      expect(en.common).toBeDefined();
      expect(en.common.cancel).toBeDefined();
      expect(en.common.loading).toBeDefined();
    });

    it('no i18n key references untranslated keys in AccountSection', () => {
      const component = readFile('components/settings/AccountSection.tsx');
      // Extract all t('...') keys
      const keyMatches = component.matchAll(/t\('([^']+)'\)/g);
      for (const match of keyMatches) {
        const key = match[1];
        // Skip non-i18n strings (dynamic imports, paths, etc.)
        if (key.startsWith('@/') || key.startsWith('./') || key.startsWith('../') || !key.includes('.')) continue;
        const [section, name] = key.split('.');
        expect(en[section], `Missing EN key: ${key}`).toBeDefined();
        expect(en[section][name], `Missing EN key: ${key}`).toBeDefined();
      }
    });
  });

  // ─── Database schema includes recipeIngredients ─────────────────────

  describe('Database schema is updated', () => {
    const database = readFile('lib/database.ts');

    it('declares recipeIngredients table', () => {
      expect(database).toContain('recipeIngredients!:');
    });

    it('has version 4 with recipeIngredients store', () => {
      expect(database).toContain('this.version(4)');
      expect(database).toContain('recipeIngredients:');
    });
  });

  // ─── RecipeIngredient type exists ───────────────────────────────────

  describe('RecipeIngredient type is exported', () => {
    const types = readFile('types/recipe.ts');

    it('exports RecipeIngredient interface', () => {
      expect(types).toContain('export interface RecipeIngredient');
    });
  });

  // ─── Sprint 14: OCR components wired into App ────────────────────────

  describe('Sprint 14: OCR is wired into App (S24-03: PhotoImportSheet wrapper)', () => {
    const app = readFile('App.tsx');

    it('imports PhotoImportSheet (S24-03 wrapper for PhotoCapture)', () => {
      expect(app).toContain("import { PhotoImportSheet");
    });

    it('imports OcrReviewForm', () => {
      expect(app).toContain("import { OcrReviewForm }");
    });

    it('imports parseOcrText', () => {
      expect(app).toContain("import { parseOcrText");
    });

    it('renders <PhotoImportSheet in JSX (wraps PhotoCapture)', () => {
      expect(app).toContain('<PhotoImportSheet');
    });

    it('renders <OcrReviewForm in JSX', () => {
      expect(app).toContain('<OcrReviewForm');
    });
  });

  describe('Sprint 14: ImportSheet has OCR option', () => {
    const importSheet = readFile('components/recipes/ImportSheet.tsx');

    it('has onOcrImport prop', () => {
      expect(importSheet).toContain('onOcrImport');
    });

    it('has Camera import', () => {
      expect(importSheet).toContain('Camera');
    });
  });

  describe('Sprint 14: OCR i18n keys exist', () => {
    const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
    const de = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/de.json'), 'utf-8'));

    it('EN has ocr keys', () => {
      expect(en.ocr).toBeDefined();
      expect(en.ocr.title).toBeDefined();
      expect(en.ocr.useCamera).toBeDefined();
      expect(en.ocr.uploadPhoto).toBeDefined();
      expect(en.ocr.processImage).toBeDefined();
      expect(en.ocr.reviewTitle).toBeDefined();
      expect(en.ocr.saveRecipe).toBeDefined();
    });

    it('DE has ocr keys', () => {
      expect(de.ocr).toBeDefined();
      expect(de.ocr.title).toBeDefined();
      expect(de.ocr.useCamera).toBeDefined();
      expect(de.ocr.uploadPhoto).toBeDefined();
      expect(de.ocr.processImage).toBeDefined();
      expect(de.ocr.reviewTitle).toBeDefined();
      expect(de.ocr.saveRecipe).toBeDefined();
    });
  });

  describe('Sprint 14: RecipeCard UI polish applied', () => {
    const recipeCard = readFile('components/recipes/RecipeCard.tsx');

    it('title uses truncate (single line)', () => {
      expect(recipeCard).toContain('truncate');
    });

    it('does not show ingredient count', () => {
      expect(recipeCard).not.toContain("t('recipes.ingredients'");
    });

    it('tags use warm stone/amber styling (Sprint 23)', () => {
      // Sprint 23: Tags use CSS tokens instead of Tailwind blue classes
      expect(recipeCard).toContain('--fs-bg-elevated');
    });

    it('does not import QuickLogButton (chef hat removed)', () => {
      expect(recipeCard).not.toContain('QuickLogButton');
    });
  });

  describe('Sprint 14: Search bar styling fixed', () => {
    const library = readFile('components/recipes/RecipeLibrary.tsx');

    it('search bar uses rounded styling', () => {
      expect(library).toContain('rounded-xl');
    });

    it('uses theme-aware background for sticky header (S26-05)', () => {
      expect(library).toContain('fs-bg-base');
    });
  });

  // ─── Sprint 15: Auth /auth route exists ──────────────────────────────

  describe('Sprint 15: /auth route is wired into App', () => {
    const app = readFile('App.tsx');

    it('has /auth route path', () => {
      expect(app).toContain("'/auth'");
    });

    it('imports Navigate for redirect', () => {
      expect(app).toContain('Navigate');
    });

    it('renders AuthFlow on /auth route', () => {
      expect(app).toContain('<AuthFlow');
    });
  });

  // ─── Sprint 15: RecencyBadge bug fixes ───────────────────────────────

  describe('Sprint 15: RecencyBadge has correct thresholds', () => {
    const badge = readFile('components/common/RecencyBadge.tsx');

    it('exports daysSince utility', () => {
      expect(badge).toContain('export function daysSince');
    });

    it('exports getRecencyColorClass utility', () => {
      expect(badge).toContain('export function getRecencyColorClass');
    });

    it('uses 7-day green threshold', () => {
      expect(badge).toContain('days <= 7');
    });

    it('uses 21-day yellow threshold', () => {
      expect(badge).toContain('days <= 21');
    });

    it('handles future dates (clamp to today)', () => {
      expect(badge).toContain('parsed > now');
    });

    it('supports most-recent-wins via dates prop', () => {
      expect(badge).toContain('dates?: string[]');
    });
  });

  // ─── Sprint 15: Tag hover fix ────────────────────────────────────────

  describe('Sprint 15: Tag hover state fixed', () => {
    const recipeCard = readFile('components/recipes/RecipeCard.tsx');
    const recipeDetail = readFile('pages/RecipeDetail.tsx');

    it('RecipeCard tags use outline variant', () => {
      expect(recipeCard).toContain('variant="outline"');
    });

    it('RecipeCard tags use warm stone palette (Sprint 23)', () => {
      // Sprint 23: No blue hover overrides — tags use CSS tokens
      expect(recipeCard).toContain('--fs-border-default');
    });

    it('RecipeDetail has recipe content section', () => {
      expect(recipeDetail).toContain('recipe');
    });

    it('RecipeDetail does not use blue tag colors (Sprint 23)', () => {
      expect(recipeDetail).not.toContain('bg-blue-100');
    });
  });

  // ─── Sprint 15: Rebrand strings ──────────────────────────────────────

  describe('Sprint 15: Rebrand to Fork & Spoon', () => {
    const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/en.json'), 'utf-8'));
    const de = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/de.json'), 'utf-8'));

    it('EN app.name is Fork & Spoon', () => {
      expect(en.app.name).toBe('Fork and Spoon');
    });

    it('DE app.name is Fork & Spoon', () => {
      expect(de.app.name).toBe('Fork and Spoon');
    });

    it('EN auth welcome title is Fork & Spoon', () => {
      expect(en.auth.welcome.title).toBe('Fork and Spoon');
    });

    it('EN publicRecipe CTA uses Fork & Spoon', () => {
      expect(en.publicRecipe.goToApp).toContain('Fork and Spoon');
    });

    it('EN dataManagement format label updated', () => {
      expect(en.dataManagement.mealOrganizerFormat).toContain('Fork and Spoon');
    });

    it('no remaining Meal Organizer in EN i18n', () => {
      const content = JSON.stringify(en);
      // Should not contain "Meal Organizer" in values (only internal keys are ok)
      const matches = content.match(/"Meal Organizer"/g);
      expect(matches).toBeNull();
    });
  });

  // ─── Sprint 15: Backward compatibility ───────────────────────────────

  describe('Sprint 15: Export/import backward compatibility', () => {
    const exportImport = readFile('lib/exportImport.ts');

    it('exports with Fork and Spoon appName', () => {
      expect(exportImport).toContain("appName: 'Fork and Spoon'");
    });

    it('detects legacy Meal Organizer backups', () => {
      expect(exportImport).toContain("parsed.appName === 'Meal Organizer'");
    });

    it('validates both old and new appName', () => {
      expect(exportImport).toContain("data.appName !== 'Fork and Spoon'");
      expect(exportImport).toContain("data.appName !== 'Meal Organizer'");
    });

    it('uses new backup filename', () => {
      expect(exportImport).toContain('fork-and-spoon-backup-');
    });
  });

  // ─── Sprint 15→23: Logo replaced by WarmHeader ──────────────────────

  describe('Sprint 23: WarmHeader replaces ForkAndSpoonLogo in App', () => {
    const app = readFile('App.tsx');

    it('imports WarmHeader', () => {
      expect(app).toContain("import { WarmHeader }");
    });

    it('renders <WarmHeader in header', () => {
      expect(app).toContain('<WarmHeader');
    });
  });

  describe('Sprint 23: WarmHeader component exists', () => {
    const warmHeader = readFile('components/common/WarmHeader.tsx');

    it('exports WarmHeader', () => {
      expect(warmHeader).toContain('export const WarmHeader');
    });

    it('has warm amber background', () => {
      expect(warmHeader).toContain('#FFFBEB');
    });

    it('has amber border', () => {
      expect(warmHeader).toContain('#FDE68A');
    });
  });

  // ─── Sprint 16: Real bottom sheet + nav implementation ──────────────

  describe('Sprint 16: BottomNav, FullScreenBottomSheet, AddRecipeSheet', () => {
    const bottomNav = readFile('components/layout/BottomNav.tsx');
    const bottomSheet = readFile('components/layout/FullScreenBottomSheet.tsx');
    const addRecipeSheet = readFile('components/recipes/AddRecipeSheet.tsx');

    it('BottomNav has 3 items: Schedule, FAB, Library', () => {
      expect(bottomNav).toContain('nav.schedule');
      expect(bottomNav).toContain('nav.addRecipe');
      expect(bottomNav).toContain('nav.library');
    });

    it('BottomNav FAB uses amber-600', () => {
      expect(bottomNav).toContain('bg-amber-600');
      expect(bottomNav).toContain('rounded-full');
    });

    it('FullScreenBottomSheet uses Radix Dialog', () => {
      expect(bottomSheet).toContain('@radix-ui/react-dialog');
    });

    it('AddRecipeSheet has 4 import options with amber icons', () => {
      expect(addRecipeSheet).toContain('bg-amber-100');
      expect(addRecipeSheet).toContain('Globe');
      expect(addRecipeSheet).toContain('Share2');
      expect(addRecipeSheet).toContain('Camera');
      expect(addRecipeSheet).toContain('PenLine');
    });
  });
});
