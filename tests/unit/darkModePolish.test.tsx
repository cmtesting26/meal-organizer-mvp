/**
 * Dark Mode Polish Tests (Sprint 21)
 *
 * Tests recency badge dark mode variants, theme transitions,
 * reduced-motion preference, and amber accent contrast.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'recencyBadge.neverCooked': 'Never cooked',
        'recencyBadge.never': 'Never',
        'recencyBadge.today': 'today',
        'recencyBadge.yesterday': 'yesterday',
        'recencyBadge.lastCooked': `Last cooked ${typeof fallbackOrOpts === 'object' ? fallbackOrOpts.distance : opts?.distance || ''}`,
        'recencyBadge.daysAgo': `${typeof fallbackOrOpts === 'object' ? fallbackOrOpts.count : opts?.count || 0} days ago`,
      };
      return translations[key] || key;
    },
  }),
}));

import {
  RecencyBadge,
  daysSince,
  getRecencyLevel,
  getRecencyColorClass,
} from '@/components/common/RecencyBadge';

// ─── Unit tests for getRecencyLevel ─────────────────────────────────────

describe('getRecencyLevel', () => {
  it('returns green for 0–7 days', () => {
    expect(getRecencyLevel(0)).toBe('green');
    expect(getRecencyLevel(7)).toBe('green');
  });

  it('returns yellow for 8–21 days', () => {
    expect(getRecencyLevel(8)).toBe('yellow');
    expect(getRecencyLevel(21)).toBe('yellow');
  });

  it('returns red for 22+ days', () => {
    expect(getRecencyLevel(22)).toBe('red');
    expect(getRecencyLevel(100)).toBe('red');
  });
});

describe('getRecencyColorClass (backward compat)', () => {
  it('returns green classes for fresh', () => {
    expect(getRecencyColorClass(3)).toContain('green');
  });

  it('returns yellow classes for stale', () => {
    expect(getRecencyColorClass(14)).toContain('yellow');
  });

  it('returns red classes for overdue', () => {
    expect(getRecencyColorClass(30)).toContain('red');
  });
});

// ─── RecencyBadge component tests ───────────────────────────────────────

describe('RecencyBadge dark mode integration', () => {
  it('renders gray badge with CSS custom property style for never cooked', () => {
    const { container } = render(<RecencyBadge />);
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge?.style.backgroundColor).toBe('var(--fs-recency-gray-bg)');
    expect(badge?.style.color).toBe('var(--fs-recency-gray-text)');
    expect(badge?.style.borderColor).toBe('var(--fs-recency-gray-border)');
  });

  it('renders green badge style for recently cooked (0 days)', () => {
    const today = new Date().toISOString().split('T')[0];
    const { container } = render(<RecencyBadge lastCookedDate={today} />);
    const badge = container.querySelector('span');
    expect(badge?.style.backgroundColor).toBe('var(--fs-recency-green-bg)');
    expect(badge?.style.color).toBe('var(--fs-recency-green-text)');
  });

  it('renders yellow badge style for 14 days ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    const dateStr = date.toISOString().split('T')[0];
    const { container } = render(<RecencyBadge lastCookedDate={dateStr} />);
    const badge = container.querySelector('span');
    expect(badge?.style.backgroundColor).toBe('var(--fs-recency-yellow-bg)');
  });

  it('renders red badge style for 30 days ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const dateStr = date.toISOString().split('T')[0];
    const { container } = render(<RecencyBadge lastCookedDate={dateStr} />);
    const badge = container.querySelector('span');
    expect(badge?.style.backgroundColor).toBe('var(--fs-recency-red-bg)');
  });

  it('uses CSS custom properties that auto-switch with theme', () => {
    const today = new Date().toISOString().split('T')[0];
    const { container } = render(<RecencyBadge lastCookedDate={today} />);
    const badge = container.querySelector('span');
    // The key assertion: styles use CSS variables, NOT hardcoded colors
    expect(badge?.style.backgroundColor).toMatch(/^var\(--fs-recency-/);
    expect(badge?.style.color).toMatch(/^var\(--fs-recency-/);
    expect(badge?.style.borderColor).toMatch(/^var\(--fs-recency-/);
  });
});

// ─── Token system tests ─────────────────────────────────────────────────

describe('Dark mode token CSS structure', () => {
  it('tokens.css should define light recency tokens', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    expect(css).toContain('--fs-recency-green-bg');
    expect(css).toContain('--fs-recency-yellow-bg');
    expect(css).toContain('--fs-recency-red-bg');
    expect(css).toContain('--fs-recency-gray-bg');
  });

  it('tokens.css should define dark recency tokens', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    // Dark recency tokens exist somewhere in the file
    expect(css).toContain('--fs-recency-green-bg: #064E3B');
    expect(css).toContain('--fs-recency-yellow-bg: #713F12');
    expect(css).toContain('--fs-recency-red-bg: #7F1D1D');
    expect(css).toContain('--fs-recency-gray-bg: #292524');
  });

  it('tokens.css should include reduced-motion media query', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('transition-duration: 0ms');
  });

  it('tokens.css should include theme transition rules', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    expect(css).toContain('[data-theme-transition]');
    expect(css).toContain('transition-property');
  });
});

// ─── daysSince regression tests ─────────────────────────────────────────

describe('daysSince', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(daysSince(today)).toBe(0);
  });

  it('returns 1 for yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(daysSince(d.toISOString().split('T')[0])).toBe(1);
  });

  it('clamps future dates to 0', () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    // daysSince should return 0 for future dates
    expect(daysSince(d.toISOString().split('T')[0])).toBe(0);
  });
});
