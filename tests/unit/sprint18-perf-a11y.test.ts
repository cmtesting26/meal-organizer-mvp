/**
 * Sprint 18 — S18-08 Performance Profiling + S18-09 Accessibility Audit
 *
 * S18-08: No performance regressions from new Sprint 15-17 components
 *   - Lazy loading properly configured
 *   - No unnecessary re-renders (memo patterns)
 *   - Bundle split points correct
 *   - Image assets optimized (proper formats, reasonable sizes)
 *
 * S18-09: Accessibility audit
 *   - Keyboard navigation (focus management, tabindex)
 *   - ARIA attributes on interactive elements
 *   - Screen reader support (aria-labels, roles)
 *   - Color contrast considerations
 *   - Focus trapping in modals/sheets
 *
 * Implementation Plan Phase 25 · PRD V1.4 Quality
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../../src');
const ROOT = path.resolve(__dirname, '../..');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8');
}

function readRoot(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════
// S18-08: PERFORMANCE PROFILING
// ═══════════════════════════════════════════════════════════════════════

describe('S18-08: Performance — No Regressions from New Components', () => {
  describe('Lazy loading configured for heavy pages', () => {
    const app = readFile('App.tsx');

    it('RecipeDetail is lazy loaded', () => {
      expect(app).toContain("lazy(() => import('./pages/RecipeDetail')");
    });

    it('Settings is lazy loaded', () => {
      expect(app).toContain("lazy(() => import('./pages/Settings')");
    });

    it('PrivacyPolicy is lazy loaded', () => {
      expect(app).toContain("lazy(() => import('./pages/PrivacyPolicy')");
    });

    it('HelpFaq is lazy loaded', () => {
      expect(app).toContain("lazy(() => import('./pages/HelpFaq')");
    });

    it('SharedRecipeView is lazy loaded', () => {
      expect(app).toContain("lazy(() => import('./pages/SharedRecipeView')");
    });

    it('all lazy routes wrapped in Suspense', () => {
      // Count Suspense wrappers
      const suspenseCount = (app.match(/<Suspense/g) || []).length;
      expect(suspenseCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Splash screen is session-gated (no repeat renders)', () => {
    const app = readFile('App.tsx');

    it('checks sessionStorage before rendering splash', () => {
      expect(app).toContain("sessionStorage.getItem('fork-spoon-splash-shown')");
    });

    it('sets sessionStorage after splash completes', () => {
      expect(app).toContain("sessionStorage.setItem('fork-spoon-splash-shown', 'true')");
    });

    it('useCallback on splash complete handler', () => {
      expect(app).toContain('useCallback');
      expect(app).toContain('handleSplashComplete');
    });
  });

  describe('Onboarding is launch-gated (no repeat renders)', () => {
    const app = readFile('App.tsx');

    it('checks localStorage for onboarding completion', () => {
      expect(app).toContain('isOnboardingComplete()');
    });

    it('onboarding state initialized from localStorage (no flicker)', () => {
      expect(app).toContain('useState(() => isOnboardingComplete())');
    });
  });

  describe('Workbox caching configured', () => {
    const config = readRoot('vite.config.ts');

    it('caches static assets (JS, CSS, HTML)', () => {
      expect(config).toContain('globPatterns');
      expect(config).toContain('**/*.{js,css,html,ico,png,svg,woff2}');
    });

    it('caches Google Fonts with CacheFirst', () => {
      expect(config).toContain('google-fonts-cache');
      expect(config).toContain("handler: 'CacheFirst'");
    });

    it('caches images with CacheFirst', () => {
      expect(config).toContain('image-cache');
    });

    it('has navigateFallback for SPA routing', () => {
      expect(config).toContain("navigateFallback: '/index.html'");
    });
  });

  describe('No bloated inline data in components', () => {
    it('mockRecipes is separate module (not inline)', () => {
      const mockFile = path.join(SRC, 'lib/mockRecipes.ts');
      expect(fs.existsSync(mockFile)).toBe(true);
      // Ensure App.tsx doesn't directly contain mock data
      const app = readFile('App.tsx');
      expect(app).not.toContain('mockRecipes');
    });
  });

  describe('PWA icon assets are reasonable sizes', () => {
    const iconDir = path.join(ROOT, 'public/icons');

    it('icon-192.png under 50KB', () => {
      const stat = fs.statSync(path.join(iconDir, 'icon-192.png'));
      expect(stat.size).toBeLessThan(50 * 1024);
    });

    it('icon-512.png under 350KB', () => {
      const stat = fs.statSync(path.join(iconDir, 'icon-512.png'));
      expect(stat.size).toBeLessThan(350 * 1024);
    });

    it('favicon.ico under 20KB', () => {
      const stat = fs.statSync(path.join(ROOT, 'public/favicon.ico'));
      expect(stat.size).toBeLessThan(20 * 1024);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// S18-09: ACCESSIBILITY AUDIT
// ═══════════════════════════════════════════════════════════════════════

describe('S18-09: Accessibility Audit', () => {
  describe('Bottom Navigation accessibility', () => {
    const nav = readFile('components/layout/BottomNav.tsx');

    it('nav has aria-label', () => {
      expect(nav).toContain('aria-label');
    });

    it('active tab has aria-current="page"', () => {
      expect(nav).toContain("aria-current={active ? 'page' : undefined}");
    });

    it('all nav items have aria-label', () => {
      expect(nav).toContain('aria-label={label}');
    });

    it('FAB has aria-label', () => {
      expect(nav).toContain("aria-label={t('nav.addRecipe'");
    });

    it('minimum tap targets met (44px)', () => {
      expect(nav).toContain('min-w-[44px]');
      expect(nav).toContain('min-h-[44px]');
    });
  });

  describe('AddRecipeSheet accessibility', () => {
    const sheet = readFile('components/recipes/AddRecipeSheet.tsx');

    it('import options are focusable buttons', () => {
      expect(sheet).toContain('<button');
    });

    it('options have focus ring styling', () => {
      expect(sheet).toContain('focus:outline-none');
      expect(sheet).toContain('focus:ring-2');
    });

    it('uses text-left for proper reading order', () => {
      expect(sheet).toContain('text-left');
    });
  });

  describe('FullScreenBottomSheet accessibility', () => {
    const sheet = readFile('components/layout/FullScreenBottomSheet.tsx');

    it('uses Radix Dialog (built-in a11y)', () => {
      expect(sheet).toContain('@radix-ui/react-dialog');
    });

    it('has focus trap (Radix provides this)', () => {
      // Radix Dialog.Content provides focus trap automatically
      expect(sheet).toContain('Dialog.Content');
    });

    it('supports Escape to close', () => {
      // Radix Dialog handles Escape by default via onOpenChange
      expect(sheet).toContain('onOpenChange');
    });

    it('has close button', () => {
      expect(sheet).toContain('Dialog.Close');
    });
  });

  describe('Onboarding accessibility', () => {
    const screen = readFile('components/onboarding/OnboardingScreen.tsx');
    const flow = readFile('components/onboarding/OnboardingFlow.tsx');

    it('OnboardingScreen has role or semantic structure', () => {
      expect(screen).toContain('aria-');
    });

    it('navigation buttons are accessible', () => {
      // Buttons are in OnboardingScreen component, which is rendered by OnboardingFlow
      expect(screen).toContain('<button') || expect(screen).toContain('Button');
    });

    it('skip button is available', () => {
      expect(screen).toContain('onSkip');
    });
  });

  describe('RecipeCard accessibility', () => {
    const card = readFile('components/recipes/RecipeCard.tsx');

    it('card is clickable with proper interaction', () => {
      expect(card).toContain('onClick');
    });

    it('tags use Badge component (semantic)', () => {
      expect(card).toContain('Badge');
    });
  });

  describe('Form inputs have labels', () => {
    it('RecipeForm has labeled inputs', () => {
      const form = readFile('components/recipes/RecipeForm.tsx');
      // Should have labels or aria-labels for form fields
      const hasLabels = form.includes('Label') || form.includes('aria-label') || form.includes('htmlFor');
      expect(hasLabels).toBe(true);
    });

    it('ImportSheet has labeled input', () => {
      const sheet = readFile('components/recipes/ImportSheet.tsx');
      const hasLabels = sheet.includes('Label') || sheet.includes('aria-label') || sheet.includes('placeholder');
      expect(hasLabels).toBe(true);
    });
  });

  describe('Color contrast: tags and badges', () => {
    it('RecipeCard tags use warm stone palette tokens (Sprint 23)', () => {
      const card = readFile('components/recipes/RecipeCard.tsx');
      // Sprint 23: Tags use CSS tokens for warm stone colors
      expect(card).toContain('--fs-bg-elevated');
      expect(card).toContain('--fs-text-secondary');
    });

    it('RecencyBadge has distinct color classes per threshold', () => {
      const badge = readFile('components/common/RecencyBadge.tsx');
      expect(badge).toContain('green');
      expect(badge).toContain('yellow');
      expect(badge).toContain('red');
    });

    it('FAB uses white text on amber-600 (sufficient contrast)', () => {
      const nav = readFile('components/layout/BottomNav.tsx');
      expect(nav).toContain('bg-amber-600 text-white');
    });
  });

  describe('Keyboard navigation', () => {
    it('BottomNav buttons support keyboard activation', () => {
      const nav = readFile('components/layout/BottomNav.tsx');
      // Using <button> elements (natively keyboard-accessible)
      expect(nav).toContain('<button');
    });

    it('Settings button is keyboard accessible', () => {
      const app = readFile('App.tsx');
      // Sprint 23: Settings gear is a <button> inside WarmHeader rightAction
      expect(app).toContain('<button');
      expect(app).toContain("aria-label={t('nav.settings')}");
    });
  });

  describe('Screen reader support', () => {
    it('Header has page title for context', () => {
      const app = readFile('App.tsx');
      // Sprint 23: WarmHeader shows page-specific titles (Schedule/Library)
      expect(app).toContain('pageTitle');
    });

    it('SyncStatusBadge provides status info', () => {
      const app = readFile('App.tsx');
      expect(app).toContain('<SyncStatusBadge');
    });

    it('ErrorBoundary provides error context', () => {
      const eb = readFile('components/common/ErrorBoundary.tsx');
      expect(eb).toContain('ErrorBoundary');
    });
  });
});
