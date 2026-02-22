/**
 * Dark Mode Foundation Tests (Sprint 20)
 *
 * Tests for the dark mode token system, theme detection,
 * Settings toggle, and white flash prevention.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import * as fs from 'fs';
import * as path from 'path';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'settings.themeSystem': 'System',
        'settings.themeLight': 'Light',
        'settings.themeDark': 'Dark',
        'settings.appearance': 'Appearance',
        'settings.appearanceDescription': 'Choose how Fork & Spoon looks',
      };
      return map[key] || key;
    },
  }),
}));

// ===== CSS Token Tests =====

describe('CSS Token System', () => {
  let tokensCSS: string;

  beforeEach(() => {
    const tokensPath = path.resolve(__dirname, '../../src/styles/tokens.css');
    tokensCSS = fs.readFileSync(tokensPath, 'utf-8');
  });

  test('defines light theme tokens on :root', () => {
    expect(tokensCSS).toContain(':root {');
    expect(tokensCSS).toContain('--fs-bg-base');
    expect(tokensCSS).toContain('--fs-text-primary');
    expect(tokensCSS).toContain('--fs-accent');
  });

  test('defines dark theme tokens on [data-theme=\'dark\']', () => {
    expect(tokensCSS).toContain("[data-theme='dark']");
    expect(tokensCSS).toContain('--fs-bg-base: #1C1917');  // Stone 900
    expect(tokensCSS).toContain('--fs-bg-surface: #292524'); // Stone 800
    expect(tokensCSS).toContain('--fs-accent: #FBBF24');     // Amber 400 lightened
  });

  test('light theme has white backgrounds', () => {
    // First :root block should have white bg
    const rootBlock = tokensCSS.match(/:root\s*\{([^}]+)\}/);
    expect(rootBlock).toBeTruthy();
    expect(rootBlock![1]).toContain('--fs-bg-base: #FFFFFF');
  });

  test('defines all required token categories', () => {
    const categories = [
      '--fs-bg-', '--fs-text-', '--fs-accent', '--fs-border-',
      '--fs-shadow-', '--fs-success', '--fs-error', '--fs-warning',
      '--fs-info', '--fs-hover-bg', '--fs-nav-', '--fs-card-',
      '--fs-input-', '--fs-badge-', '--fs-toast-',
    ];
    for (const cat of categories) {
      expect(tokensCSS).toContain(cat);
    }
  });

  test('bridges to shadcn/ui tokens in dark mode', () => {
    expect(tokensCSS).toContain('--background:');
    expect(tokensCSS).toContain('--foreground:');
    expect(tokensCSS).toContain('--card:');
    expect(tokensCSS).toContain('--border:');
  });

  test('includes dark mode overrides for common Tailwind classes', () => {
    expect(tokensCSS).toContain("[data-theme='dark'] .bg-white");
    expect(tokensCSS).toContain("[data-theme='dark'] .text-gray-900");
    expect(tokensCSS).toContain("[data-theme='dark'] .border-gray-200");
  });

  test('includes form input dark mode styles', () => {
    expect(tokensCSS).toContain("[data-theme='dark'] input");
    expect(tokensCSS).toContain("[data-theme='dark'] textarea");
  });
});

// ===== useTheme Hook Tests =====

describe('useTheme Hook', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');

    // Mock matchMedia
    matchMediaMock = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-transition');
    document.documentElement.classList.remove('dark');
  });

  test('defaults to system preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe('system');
  });

  test('resolves system preference to light when OS is light', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  test('resolves system preference to dark when OS is dark', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  test('setTheme persists preference to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(localStorage.getItem('fs-theme-preference')).toBe('dark');
    expect(result.current.preference).toBe('dark');
  });

  test('reads stored preference from localStorage', () => {
    localStorage.setItem('fs-theme-preference', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  test('applies data-theme attribute to html', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('adds .dark class for shadcn/ui compatibility', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('removes .dark class when switching to light', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => result.current.setTheme('light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('switching between all 3 modes works', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme('dark'));
    expect(result.current.resolvedTheme).toBe('dark');

    act(() => result.current.setTheme('light'));
    expect(result.current.resolvedTheme).toBe('light');

    act(() => result.current.setTheme('system'));
    expect(result.current.preference).toBe('system');
  });

  test('ignores invalid stored preference', () => {
    localStorage.setItem('fs-theme-preference', 'invalid');
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe('system');
  });
});

// ===== ThemeToggle Component Tests =====

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  test('renders three theme options', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  test('System is selected by default', () => {
    render(<ThemeToggle />);
    const systemBtn = screen.getByText('System').closest('button');
    expect(systemBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking Dark activates dark mode', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByText('Dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('fs-theme-preference')).toBe('dark');
  });

  test('clicking Light activates light mode', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByText('Light'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('fs-theme-preference')).toBe('light');
  });
});

// ===== White Flash Prevention Tests =====

describe('White Flash Prevention', () => {
  test('index.html contains inline theme detection script', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');

    expect(html).toContain('fs-theme-preference');
    expect(html).toContain('data-theme');
    expect(html).toContain('prefers-color-scheme: dark');
    // Script must be before the #root div
    const scriptPos = html.indexOf('fs-theme-preference');
    const rootPos = html.indexOf('id="root"');
    expect(scriptPos).toBeLessThan(rootPos);
  });

  test('inline script sets background color for dark mode', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    expect(html).toContain('#1C1917'); // Stone 900 dark bg
  });
});
