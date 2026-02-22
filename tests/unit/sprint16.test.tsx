/**
 * Sprint 16 Tests — Navigation Redesign + Visual Polish
 *
 * S16-12: Navigation flow tests — BottomNav, AddRecipeSheet, FullScreenBottomSheet
 * S16-13: Visual polish verification — date format EN/DE, i18n keys, font size, DataManagement compact
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { formatScheduleDay } from '../../src/lib/dateHelpers';

// ============================================================
// S16-12: Navigation Flow Tests
// ============================================================

describe('S16-12: Navigation Flow Tests', () => {
  // --- BottomNav ---
  describe('BottomNav component', () => {
    let BottomNav: any;

    beforeEach(async () => {
      const mod = await import('../../src/components/layout/BottomNav');
      BottomNav = mod.BottomNav;
    });

    test('renders Schedule tab, FAB, and Library tab', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByLabelText('Add Recipe')).toBeInTheDocument();
    });

    test('Schedule tab is active on / route', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      const scheduleBtn = screen.getByText('Schedule').closest('button');
      expect(scheduleBtn).toHaveAttribute('aria-current', 'page');
    });

    test('Library tab is active on /library route', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/library']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      const libraryBtn = screen.getByText('Library').closest('button');
      expect(libraryBtn).toHaveAttribute('aria-current', 'page');
    });

    test('FAB button calls onAddClick', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      fireEvent.click(screen.getByLabelText('Add Recipe'));
      expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    test('FAB has amber-600 background styling', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      const fab = screen.getByLabelText('Add Recipe');
      expect(fab.className).toContain('bg-amber-600');
      expect(fab.className).toContain('rounded-full');
    });

    test('Settings tab is NOT present in bottom nav', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    test('nav element has aria-label for accessibility', () => {
      const onAddClick = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <BottomNav onAddClick={onAddClick} />
          </MemoryRouter>
        </I18nextProvider>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');
    });
  });

  // --- FullScreenBottomSheet ---
  describe('FullScreenBottomSheet component', () => {
    let FullScreenBottomSheet: any;

    beforeEach(async () => {
      const mod = await import('../../src/components/layout/FullScreenBottomSheet');
      FullScreenBottomSheet = mod.FullScreenBottomSheet;
    });

    test('renders title and children when open', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <FullScreenBottomSheet open={true} onOpenChange={() => {}} title="Test Sheet">
            <p>Sheet content</p>
          </FullScreenBottomSheet>
        </I18nextProvider>
      );

      expect(screen.getByText('Test Sheet')).toBeInTheDocument();
      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });

    test('does not render content when closed', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <FullScreenBottomSheet open={false} onOpenChange={() => {}} title="Test Sheet">
            <p>Sheet content</p>
          </FullScreenBottomSheet>
        </I18nextProvider>
      );

      expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();
    });

    test('close button has accessible label', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <FullScreenBottomSheet open={true} onOpenChange={() => {}} title="Test Sheet">
            <p>Content</p>
          </FullScreenBottomSheet>
        </I18nextProvider>
      );

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    test('calls onOpenChange(false) when close button clicked', () => {
      const onOpenChange = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <FullScreenBottomSheet open={true} onOpenChange={onOpenChange} title="Test Sheet">
            <p>Content</p>
          </FullScreenBottomSheet>
        </I18nextProvider>
      );

      fireEvent.click(screen.getByLabelText('Close'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // --- AddRecipeSheet ---
  describe('AddRecipeSheet component', () => {
    let AddRecipeSheet: any;

    beforeEach(async () => {
      const mod = await import('../../src/components/recipes/AddRecipeSheet');
      AddRecipeSheet = mod.AddRecipeSheet;
    });

    test('renders all 4 import options when open', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={() => {}}
            onWebsiteImport={() => {}}
            onSocialImport={() => {}}
            onScanImport={() => {}}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      expect(screen.getByText('Import from Website')).toBeInTheDocument();
      expect(screen.getByText('Instagram / TikTok')).toBeInTheDocument();
      expect(screen.getByText('Scan Cookbook')).toBeInTheDocument();
      expect(screen.getByText('Add Manually')).toBeInTheDocument();
    });

    test('renders "Add Recipe" title', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={() => {}}
            onWebsiteImport={() => {}}
            onSocialImport={() => {}}
            onScanImport={() => {}}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      expect(screen.getByText('Add Recipe')).toBeInTheDocument();
    });

    test('calls correct handler when Website option clicked', () => {
      const onWebsiteImport = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={onOpenChange}
            onWebsiteImport={onWebsiteImport}
            onSocialImport={() => {}}
            onScanImport={() => {}}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      fireEvent.click(screen.getByText('Import from Website'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onWebsiteImport).toHaveBeenCalledTimes(1);
    });

    test('calls correct handler when Manual option clicked', () => {
      const onManualAdd = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={onOpenChange}
            onWebsiteImport={() => {}}
            onSocialImport={() => {}}
            onScanImport={() => {}}
            onManualAdd={onManualAdd}
          />
        </I18nextProvider>
      );

      fireEvent.click(screen.getByText('Add Manually'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onManualAdd).toHaveBeenCalledTimes(1);
    });

    test('calls correct handler when Scan option clicked', () => {
      const onScanImport = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={() => {}}
            onWebsiteImport={() => {}}
            onSocialImport={() => {}}
            onScanImport={onScanImport}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      fireEvent.click(screen.getByText('Scan Cookbook'));
      expect(onScanImport).toHaveBeenCalledTimes(1);
    });

    test('calls correct handler when Social option clicked', () => {
      const onSocialImport = vi.fn();
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={() => {}}
            onWebsiteImport={() => {}}
            onSocialImport={onSocialImport}
            onScanImport={() => {}}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      fireEvent.click(screen.getByText('Instagram / TikTok'));
      expect(onSocialImport).toHaveBeenCalledTimes(1);
    });

    test('each import option has amber icon container (S24-07 V1.6 update)', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <AddRecipeSheet
            open={true}
            onOpenChange={() => {}}
            onWebsiteImport={() => {}}
            onSocialImport={() => {}}
            onScanImport={() => {}}
            onManualAdd={() => {}}
          />
        </I18nextProvider>
      );

      // S24-07: amber icon containers now use inline style (#FEF3C7) instead of .bg-amber-100
      const allDivs = document.querySelectorAll('div');
      const amberContainers = Array.from(allDivs).filter(
        (el) => (el as HTMLElement).style.backgroundColor === 'rgb(254, 243, 199)' ||
                (el as HTMLElement).style.backgroundColor === '#FEF3C7'
      );
      expect(amberContainers.length).toBe(4);
    });
  });
});

// ============================================================
// S16-13: Visual Polish Verification
// ============================================================

describe('S16-13: Visual Polish Verification', () => {
  // --- Schedule date format (S16-08) ---
  describe('formatScheduleDay — locale-aware date formatting', () => {
    test('EN: formats as "weekday, Mon DDth" e.g. "Monday, Feb 17th"', () => {
      const result = formatScheduleDay('2026-02-17', 'en');
      expect(result).toBe('Tuesday, Feb 17th');
    });

    test('DE: formats as "Wochentag, DD. Mon" e.g. "Dienstag, 17. Feb."', () => {
      const result = formatScheduleDay('2026-02-17', 'de');
      expect(result).toMatch(/Dienstag, 17\. Feb/);
    });

    test('EN: handles month boundary dates', () => {
      const result = formatScheduleDay('2026-02-28', 'en');
      expect(result).toBe('Saturday, Feb 28th');
    });

    test('DE: handles month boundary dates', () => {
      const result = formatScheduleDay('2026-02-28', 'de');
      expect(result).toMatch(/Samstag, 28\. Feb/);
    });

    test('EN: handles ordinal suffixes (1st, 2nd, 3rd)', () => {
      expect(formatScheduleDay('2026-03-01', 'en')).toContain('1st');
      expect(formatScheduleDay('2026-03-02', 'en')).toContain('2nd');
      expect(formatScheduleDay('2026-03-03', 'en')).toContain('3rd');
    });

    test('returns "Invalid date" for invalid input', () => {
      expect(formatScheduleDay('not-a-date', 'en')).toBe('Invalid date');
    });

    test('defaults to EN when no lang provided', () => {
      const result = formatScheduleDay('2026-02-17');
      // Should use EN format with ordinal
      expect(result).toContain('Feb');
      expect(result).toContain('17th');
    });
  });

  // --- i18n keys (S16-10) ---
  describe('i18n — Sprint 16 keys exist', () => {
    test('EN: nav keys exist', () => {
      expect(i18n.t('nav.main', { lng: 'en' })).toBe('Main navigation');
      expect(i18n.t('nav.addRecipe', { lng: 'en' })).toBe('Add Recipe');
      expect(i18n.t('nav.schedule', { lng: 'en' })).toBe('Schedule');
      expect(i18n.t('nav.library', { lng: 'en' })).toBe('Library');
    });

    test('DE: nav keys exist', () => {
      expect(i18n.t('nav.main', { lng: 'de' })).toBe('Hauptnavigation');
      expect(i18n.t('nav.addRecipe', { lng: 'de' })).toBe('Rezept hinzufügen');
    });

    test('EN: addRecipeSheet keys exist', () => {
      expect(i18n.t('addRecipeSheet.title', { lng: 'en' })).toBe('Add Recipe');
      expect(i18n.t('addRecipeSheet.website', { lng: 'en' })).toBe('Import from Website');
      expect(i18n.t('addRecipeSheet.social', { lng: 'en' })).toBe('Instagram / TikTok');
      expect(i18n.t('addRecipeSheet.scan', { lng: 'en' })).toBe('Scan Cookbook');
      expect(i18n.t('addRecipeSheet.manual', { lng: 'en' })).toBe('Add Manually');
    });

    test('DE: addRecipeSheet keys exist', () => {
      expect(i18n.t('addRecipeSheet.title', { lng: 'de' })).toBe('Rezept hinzufügen');
      expect(i18n.t('addRecipeSheet.website', { lng: 'de' })).toBe('Von Website importieren');
      expect(i18n.t('addRecipeSheet.social', { lng: 'de' })).toBe('Instagram / TikTok');
      expect(i18n.t('addRecipeSheet.scan', { lng: 'de' })).toBe('Kochbuch scannen');
      expect(i18n.t('addRecipeSheet.manual', { lng: 'de' })).toBe('Manuell eingeben');
    });

    test('EN: settings data management compact keys exist', () => {
      expect(i18n.t('settings.dataManagementDescription', { lng: 'en' })).toBe('Export or restore your data');
      expect(i18n.t('settings.export', { lng: 'en' })).toBe('Export');
      expect(i18n.t('settings.import', { lng: 'en' })).toBe('Import');
    });

    test('DE: settings data management compact keys exist', () => {
      expect(i18n.t('settings.dataManagementDescription', { lng: 'de' })).toBe('Daten exportieren oder wiederherstellen');
      expect(i18n.t('settings.export', { lng: 'de' })).toBe('Export');
      expect(i18n.t('settings.import', { lng: 'de' })).toBe('Import');
    });

    test('version updated to v1.6.0', () => {
      expect(i18n.t('app.version', { lng: 'en' })).toBe('v1.6.0');
      expect(i18n.t('app.version', { lng: 'de' })).toBe('v1.6.0');
    });
  });

  // --- Font size (S16-07) ---
  describe('Mobile font size — CSS check', () => {
    test('index.css contains mobile font-size rule', async () => {
      const fs = await import('fs');
      const css = fs.readFileSync('/home/claude/meal-organizer-mvp/src/index.css', 'utf-8');

      expect(css).toContain('max-width: 767px');
      expect(css).toContain('font-size: 16px');
      expect(css).toContain('font-size: 1rem');
    });
  });

  // --- Old BottomTabs removed (S16-04/S16-06) ---
  describe('Old navigation removed', () => {
    test('App.tsx no longer imports BottomTabs', async () => {
      const fs = await import('fs');
      const appCode = fs.readFileSync('/home/claude/meal-organizer-mvp/src/App.tsx', 'utf-8');

      expect(appCode).not.toContain("from './components/layout/BottomTabs'");
      expect(appCode).toContain("from './components/layout/BottomNav'");
    });

    test('App.tsx no longer has PlusCircle header button', async () => {
      const fs = await import('fs');
      const appCode = fs.readFileSync('/home/claude/meal-organizer-mvp/src/App.tsx', 'utf-8');

      expect(appCode).not.toContain('PlusCircle');
    });

    test('App.tsx imports AddRecipeSheet', async () => {
      const fs = await import('fs');
      const appCode = fs.readFileSync('/home/claude/meal-organizer-mvp/src/App.tsx', 'utf-8');

      expect(appCode).toContain("from './components/recipes/AddRecipeSheet'");
    });
  });

  // --- DataManagement compact (S16-09) ---
  describe('DataManagement compact redesign', () => {
    test('DataManagement renders compact layout with side-by-side buttons', async () => {
      const { DataManagement } = await import('../../src/components/common/DataManagement');
      render(
        <I18nextProvider i18n={i18n}>
          <DataManagement />
        </I18nextProvider>
      );

      // Should have Export and Import buttons side by side
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();

      // Should have the title
      expect(screen.getByText('Data Management')).toBeInTheDocument();
    });
  });
});
