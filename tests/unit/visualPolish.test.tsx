/**
 * Visual Polish Verification Tests (Sprint 16 — S16-13)
 *
 * Verifies visual polish tasks:
 * - S16-07: Font size 14→16px on mobile (CSS media query)
 * - S16-08: Schedule date format EN: "Monday, Feb 17th" / DE: "Montag, 17. Feb"
 * - S16-09: Compact DataManagement card layout
 * - S16-10: i18n strings for nav + bottom sheet (EN/DE)
 * - S16-11: Visual consistency (color, spacing)
 */

import { describe, test, expect, vi } from 'vitest';
import en from '../../src/i18n/en.json';
import de from '../../src/i18n/de.json';
import { formatScheduleDay } from '../../src/lib/dateHelpers';
import fs from 'node:fs';
import path from 'node:path';

// --- S16-07: Mobile font size CSS verification ---

describe('S16-07: Mobile font size bump (14→16px)', () => {
  const cssPath = path.resolve(__dirname, '../../src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  test('CSS contains mobile media query for 16px font', () => {
    expect(cssContent).toContain('@media (max-width: 767px)');
  });

  test('CSS sets html font-size to 16px on mobile', () => {
    expect(cssContent).toContain('font-size: 16px');
  });

  test('CSS sets body font-size to 1rem on mobile', () => {
    expect(cssContent).toContain('font-size: 1rem');
  });

  test('CSS sets input/textarea/select to 1rem (prevents iOS auto-zoom)', () => {
    // Check that inputs are explicitly set to 16px
    const mobileBlock = cssContent.split('@media (max-width: 767px)')[1];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toContain('input, textarea, select');
    expect(mobileBlock).toContain('font-size: 1rem');
  });
});

// --- S16-08: Schedule date format ---

describe('S16-08: Schedule date format', () => {
  test('English format: "Monday, Feb 17th"', () => {
    const result = formatScheduleDay('2026-02-17', 'en');
    // date-fns "EEEE, MMM do" produces "Tuesday, Feb 17th" for 2026-02-17
    expect(result).toMatch(/^\w+day, \w{3} \d{1,2}(st|nd|rd|th)$/);
  });

  test('German format: "Montag, 17. Feb"', () => {
    const result = formatScheduleDay('2026-02-17', 'de');
    // date-fns "EEEE, d. MMM" with de locale produces "Dienstag, 17. Feb." for 2026-02-17
    expect(result).toMatch(/^\w+, \d{1,2}\. \w{3}\.?$/);
  });

  test('handles invalid date gracefully', () => {
    const result = formatScheduleDay('not-a-date', 'en');
    expect(result).toBe('Invalid date');
  });

  test('formats specific date correctly in English', () => {
    // Feb 16, 2026 is a Monday
    const result = formatScheduleDay('2026-02-16', 'en');
    expect(result).toBe('Monday, Feb 16th');
  });

  test('formats specific date correctly in German', () => {
    // Feb 16, 2026 is a Monday (Montag)
    const result = formatScheduleDay('2026-02-16', 'de');
    // German format: "Montag, 16. Feb."
    expect(result).toMatch(/Montag, 16\. Feb\.?/);
  });

  test('English ordinals: 1st, 2nd, 3rd, 4th', () => {
    expect(formatScheduleDay('2026-02-01', 'en')).toContain('1st');
    expect(formatScheduleDay('2026-02-02', 'en')).toContain('2nd');
    expect(formatScheduleDay('2026-02-03', 'en')).toContain('3rd');
    expect(formatScheduleDay('2026-02-04', 'en')).toContain('4th');
  });
});

// --- S16-09: Compact DataManagement card ---

describe('S16-09: DataManagement compact layout', () => {
  const dmPath = path.resolve(__dirname, '../../src/components/common/DataManagement.tsx');
  const dmContent = fs.readFileSync(dmPath, 'utf-8');

  test('DataManagement uses compact card layout (single card)', () => {
    // Should have a single containing card with the compact layout pattern
    expect(dmContent).toContain('bg-white rounded-lg border p-4');
  });

  test('DataManagement has side-by-side Export/Import buttons', () => {
    // The flex gap-2 container for the two buttons
    expect(dmContent).toContain('flex gap-2 flex-shrink-0');
  });

  test('DataManagement has heading + subtitle left, buttons right', () => {
    // The flex justify-between layout
    expect(dmContent).toContain('flex items-center justify-between');
  });

  test('DataManagement Export button uses Download icon', () => {
    expect(dmContent).toContain('Download');
  });

  test('DataManagement Import button uses Upload icon', () => {
    expect(dmContent).toContain('Upload');
  });

  test('DataManagement uses Database icon for section heading', () => {
    expect(dmContent).toContain('Database');
  });

  test('EN i18n has DataManagement title', () => {
    expect(en.dataManagement.title).toBe('Data Management');
  });

  test('DE i18n has DataManagement title', () => {
    expect(de.dataManagement.title).toBe('Datenverwaltung');
  });
});

// --- S16-10: i18n strings verification ---

describe('S16-10: i18n strings for nav + bottom sheet', () => {
  test('English nav strings exist', () => {
    expect(en.nav.schedule).toBe('Schedule');
    expect(en.nav.library).toBe('Library');
    expect(en.nav.addRecipe).toBe('Add Recipe');
    expect(en.nav.settings).toBe('Settings');
    expect(en.nav.main).toBe('Main navigation');
  });

  test('German nav strings exist', () => {
    expect(de.nav.schedule).toBe('Wochenplan');
    expect(de.nav.library).toBe('Rezepte');
    expect(de.nav.addRecipe).toBe('Rezept hinzufügen');
    expect(de.nav.settings).toBe('Einstellungen');
    expect(de.nav.main).toBe('Hauptnavigation');
  });

  test('English bottom sheet strings exist', () => {
    expect(en.addRecipeSheet.title).toBe('Add Recipe');
    expect(en.addRecipeSheet.website).toBe('Import from Website');
    expect(en.addRecipeSheet.social).toBe('Instagram / TikTok');
    expect(en.addRecipeSheet.scan).toBe('Scan Cookbook');
    expect(en.addRecipeSheet.manual).toBe('Add Manually');
    expect(en.addRecipeSheet.websiteDesc).toBeDefined();
    expect(en.addRecipeSheet.socialDesc).toBeDefined();
    expect(en.addRecipeSheet.scanDesc).toBeDefined();
    expect(en.addRecipeSheet.manualDesc).toBeDefined();
  });

  test('German bottom sheet strings exist', () => {
    expect(de.addRecipeSheet.title).toBe('Rezept hinzufügen');
    expect(de.addRecipeSheet.website).toBe('Von Website importieren');
    expect(de.addRecipeSheet.social).toBe('Instagram / TikTok');
    expect(de.addRecipeSheet.scan).toBe('Kochbuch scannen');
    expect(de.addRecipeSheet.manual).toBe('Manuell eingeben');
    expect(de.addRecipeSheet.websiteDesc).toBeDefined();
    expect(de.addRecipeSheet.socialDesc).toBeDefined();
    expect(de.addRecipeSheet.scanDesc).toBeDefined();
    expect(de.addRecipeSheet.manualDesc).toBeDefined();
  });

  test('English common.close string exists', () => {
    expect(en.common.close).toBe('Close');
  });

  test('German common.close string exists', () => {
    expect(de.common.close).toBe('Schließen');
  });
});

// --- S16-11: Visual consistency ---

describe('S16-11: Visual consistency checks', () => {
  const navPath = path.resolve(__dirname, '../../src/components/layout/BottomNav.tsx');
  const navContent = fs.readFileSync(navPath, 'utf-8');

  const sheetPath = path.resolve(__dirname, '../../src/components/layout/FullScreenBottomSheet.tsx');
  const sheetContent = fs.readFileSync(sheetPath, 'utf-8');

  test('BottomNav FAB uses amber-600 (Design Spec V1.4)', () => {
    expect(navContent).toContain('bg-amber-600');
  });

  test('BottomNav active tab uses amber active color', () => {
    // Sprint 23: BottomNav uses #D97706 directly for active state
    expect(navContent).toContain('#D97706');
  });

  test('BottomNav inactive tab uses token-based nav color', () => {
    expect(navContent).toContain('--fs-nav-text');
  });

  test('BottomNav FAB is circular (rounded-full)', () => {
    expect(navContent).toContain('rounded-full');
  });

  test('BottomNav FAB is 60px (w-[60px] h-[60px])', () => {
    expect(navContent).toContain('w-[60px] h-[60px]');
  });

  test('BottomNav has safe area padding', () => {
    expect(navContent).toContain('safe-area-inset-bottom');
  });

  test('FullScreenBottomSheet has rounded-t-[20px]', () => {
    expect(sheetContent).toContain('rounded-t-[20px]');
  });

  test('FullScreenBottomSheet has shadow', () => {
    expect(sheetContent).toContain('shadow-');
  });

  test('FullScreenBottomSheet has slide-in animation', () => {
    expect(sheetContent).toContain('slide-in-from-bottom');
  });

  test('FullScreenBottomSheet has max-h-[90vh]', () => {
    expect(sheetContent).toContain('max-h-[90vh]');
  });

  test('Old BottomTabs.tsx has been removed', () => {
    const oldTabsPath = path.resolve(__dirname, '../../src/components/layout/BottomTabs.tsx');
    expect(fs.existsSync(oldTabsPath)).toBe(false);
  });

  test('Sprint 15 mockup has been removed', () => {
    const mockupPath = path.resolve(__dirname, '../../src/components/recipes/BottomSheetImportMockup.tsx');
    expect(fs.existsSync(mockupPath)).toBe(false);
  });
});
