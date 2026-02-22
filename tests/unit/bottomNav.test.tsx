/**
 * Bottom Navigation Tests (Sprint 16 — S16-12)
 *
 * Tests for the new 3-item bottom navigation: Schedule (left), FAB (center), Library (right).
 * Covers:
 * - BottomNav renders 3 items (Schedule, FAB, Library)
 * - Active tab highlighting (amber-600)
 * - FAB triggers onAddClick
 * - Navigation to Schedule (/) and Library (/library)
 * - Settings gear icon in header
 * - FullScreenBottomSheet open/close
 * - AddRecipeSheet 4 import options
 * - Accessibility: aria-labels, aria-current, focus rings
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { BottomNav } from '../../src/components/layout/BottomNav';
import { FullScreenBottomSheet } from '../../src/components/layout/FullScreenBottomSheet';
import { AddRecipeSheet } from '../../src/components/recipes/AddRecipeSheet';

function renderWithRouter(ui: React.ReactNode, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  const defaultProps = { onAddClick: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
  });

  test('renders Schedule tab, FAB, and Library tab', () => {
    renderWithRouter(<BottomNav {...defaultProps} />);

    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
    expect(screen.getByLabelText('Add Recipe')).toBeInTheDocument();
    expect(screen.getByLabelText('Library')).toBeInTheDocument();
  });

  test('Schedule tab is active on / route', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/' });

    const scheduleTab = screen.getByLabelText('Schedule');
    expect(scheduleTab).toHaveAttribute('aria-current', 'page');
  });

  test('Library tab is active on /library route', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/library' });

    const libraryTab = screen.getByLabelText('Library');
    expect(libraryTab).toHaveAttribute('aria-current', 'page');
  });

  test('Library tab is active on /recipe/:id route', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/recipe/abc123' });

    const libraryTab = screen.getByLabelText('Library');
    expect(libraryTab).toHaveAttribute('aria-current', 'page');
  });

  test('Schedule tab is not active on /library route', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/library' });

    const scheduleTab = screen.getByLabelText('Schedule');
    expect(scheduleTab).not.toHaveAttribute('aria-current');
  });

  test('FAB button triggers onAddClick', () => {
    renderWithRouter(<BottomNav {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Add Recipe'));
    expect(defaultProps.onAddClick).toHaveBeenCalledTimes(1);
  });

  test('Schedule tab navigates to /', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/library' });

    fireEvent.click(screen.getByLabelText('Schedule'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('Library tab navigates to /library', () => {
    renderWithRouter(<BottomNav {...defaultProps} />, { route: '/' });

    fireEvent.click(screen.getByLabelText('Library'));
    expect(mockNavigate).toHaveBeenCalledWith('/library');
  });

  test('nav element has accessible label', () => {
    renderWithRouter(<BottomNav {...defaultProps} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  test('renders German labels when language is DE', () => {
    i18n.changeLanguage('de');
    renderWithRouter(<BottomNav {...defaultProps} />);

    expect(screen.getByLabelText('Wochenplan')).toBeInTheDocument();
    expect(screen.getByLabelText('Rezept hinzufügen')).toBeInTheDocument();
    expect(screen.getByLabelText('Rezepte')).toBeInTheDocument();
  });

  test('FAB has amber-600 background styling', () => {
    renderWithRouter(<BottomNav {...defaultProps} />);

    const fab = screen.getByLabelText('Add Recipe');
    expect(fab.className).toContain('bg-amber-600');
    expect(fab.className).toContain('rounded-full');
  });
});

describe('FullScreenBottomSheet', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Test Sheet',
    children: <div>Sheet content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
  });

  test('renders title when open', () => {
    renderWithRouter(<FullScreenBottomSheet {...defaultProps} />);

    expect(screen.getByText('Test Sheet')).toBeInTheDocument();
  });

  test('renders children when open', () => {
    renderWithRouter(<FullScreenBottomSheet {...defaultProps} />);

    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithRouter(<FullScreenBottomSheet {...defaultProps} open={false} />);

    expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();
  });

  test('close button has accessible label', () => {
    renderWithRouter(<FullScreenBottomSheet {...defaultProps} />);

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  test('close button calls onOpenChange(false)', () => {
    renderWithRouter(<FullScreenBottomSheet {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('AddRecipeSheet', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onWebsiteImport: vi.fn(),
    onSocialImport: vi.fn(),
    onScanImport: vi.fn(),
    onManualAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
  });

  test('renders "Add Recipe" title', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    expect(screen.getByText('Add Recipe')).toBeInTheDocument();
  });

  test('renders all 4 import options', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    expect(screen.getByText('Import from Website')).toBeInTheDocument();
    expect(screen.getByText('Instagram / TikTok')).toBeInTheDocument();
    expect(screen.getByText('Scan Cookbook')).toBeInTheDocument();
    expect(screen.getByText('Add Manually')).toBeInTheDocument();
  });

  test('renders descriptions for all options', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    expect(screen.getByText('Paste a recipe URL to auto-import')).toBeInTheDocument();
    expect(screen.getByText('Import from a social media post')).toBeInTheDocument();
    expect(screen.getByText('Take a photo of a recipe page')).toBeInTheDocument();
    expect(screen.getByText('Type in a new recipe from scratch')).toBeInTheDocument();
  });

  test('clicking "Import from Website" triggers handler and closes sheet', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    fireEvent.click(screen.getByText('Import from Website'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onWebsiteImport).toHaveBeenCalled();
  });

  test('clicking "Instagram / TikTok" triggers handler and closes sheet', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    fireEvent.click(screen.getByText('Instagram / TikTok'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onSocialImport).toHaveBeenCalled();
  });

  test('clicking "Scan Cookbook" triggers handler and closes sheet', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    fireEvent.click(screen.getByText('Scan Cookbook'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onScanImport).toHaveBeenCalled();
  });

  test('clicking "Add Manually" triggers handler and closes sheet', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Manually'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onManualAdd).toHaveBeenCalled();
  });

  test('renders German labels when language is DE', () => {
    i18n.changeLanguage('de');
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    expect(screen.getByText('Rezept hinzufügen')).toBeInTheDocument();
    expect(screen.getByText('Von Website importieren')).toBeInTheDocument();
    expect(screen.getByText('Kochbuch scannen')).toBeInTheDocument();
    expect(screen.getByText('Manuell eingeben')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} open={false} />);

    expect(screen.queryByText('Import from Website')).not.toBeInTheDocument();
  });

  test('import option cards have amber icon containers (S24-07: V1.6 inline style)', () => {
    renderWithRouter(<AddRecipeSheet {...defaultProps} />);

    // S24-07: amber icon containers now use inline style (#FEF3C7) instead of .bg-amber-100
    const allDivs = document.querySelectorAll('div');
    const amberContainers = Array.from(allDivs).filter(
      (el) => (el as HTMLElement).style.backgroundColor === 'rgb(254, 243, 199)' ||
              (el as HTMLElement).style.backgroundColor === '#FEF3C7'
    );
    expect(amberContainers.length).toBe(4);
  });
});
