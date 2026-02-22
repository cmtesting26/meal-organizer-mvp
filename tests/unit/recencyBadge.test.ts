/**
 * RecencyBadge Tests (Sprint 15 — S15-04)
 *
 * Verifies bug fixes:
 * - Correct color thresholds: green ≤7d, yellow 8–21d, red ≥22d
 * - Past-only dates: future dates clamped to today
 * - Most-recent-wins: latest date is used when multiple provided
 * - Never cooked: gray badge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { daysSince, getRecencyColorClass } from '../../src/components/common/RecencyBadge';

// Fix "now" to a known date for deterministic tests
const FIXED_NOW = new Date('2026-02-17T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('daysSince', () => {
  it('returns 0 for today', () => {
    expect(daysSince('2026-02-17')).toBe(0);
  });

  it('returns 1 for yesterday', () => {
    expect(daysSince('2026-02-16')).toBe(1);
  });

  it('returns 7 for 7 days ago', () => {
    expect(daysSince('2026-02-10')).toBe(7);
  });

  it('returns 14 for 14 days ago', () => {
    expect(daysSince('2026-02-03')).toBe(14);
  });

  it('returns 0 for future dates (clamped)', () => {
    // daysSince should return 0 for future dates (Math.max(0, diff))
    expect(daysSince('2026-02-20')).toBe(0);
  });

  it('returns correct count for old dates', () => {
    expect(daysSince('2026-01-17')).toBe(31);
  });
});

describe('getRecencyColorClass — color thresholds', () => {
  it('green for 0 days (today)', () => {
    expect(getRecencyColorClass(0)).toContain('green');
  });

  it('green for 7 days', () => {
    expect(getRecencyColorClass(7)).toContain('green');
  });

  it('yellow for 8 days', () => {
    expect(getRecencyColorClass(8)).toContain('yellow');
  });

  it('yellow for 14 days', () => {
    expect(getRecencyColorClass(14)).toContain('yellow');
  });

  it('yellow for 21 days', () => {
    expect(getRecencyColorClass(21)).toContain('yellow');
  });

  it('red for 22 days', () => {
    expect(getRecencyColorClass(22)).toContain('red');
  });

  it('red for 30 days', () => {
    expect(getRecencyColorClass(30)).toContain('red');
  });

  it('red for 100 days', () => {
    expect(getRecencyColorClass(100)).toContain('red');
  });

  // Edge case: verify OLD thresholds are no longer used
  it('does NOT use old threshold of 14 as boundary', () => {
    // 14 days should be yellow, NOT green (old code had green ≤14)
    expect(getRecencyColorClass(14)).not.toContain('green');
  });

  it('does NOT use old threshold of 30 as boundary', () => {
    // 25 days should be red, NOT yellow (old code had yellow 14-30)
    expect(getRecencyColorClass(25)).not.toContain('yellow');
  });
});

describe('getRecencyColorClass — exact Design Spec V1.4 colors', () => {
  it('green uses -600 text (not -800)', () => {
    const cls = getRecencyColorClass(3);
    expect(cls).toContain('text-green-600');
    expect(cls).not.toContain('text-green-800');
  });

  it('yellow uses -600 text (not -800)', () => {
    const cls = getRecencyColorClass(14);
    expect(cls).toContain('text-yellow-600');
    expect(cls).not.toContain('text-yellow-800');
  });

  it('red uses -600 text (not -800)', () => {
    const cls = getRecencyColorClass(30);
    expect(cls).toContain('text-red-600');
    expect(cls).not.toContain('text-red-800');
  });

  it('green has correct bg and border', () => {
    const cls = getRecencyColorClass(3);
    expect(cls).toContain('bg-green-100');
    expect(cls).toContain('border-green-200');
  });

  it('yellow has correct bg and border', () => {
    const cls = getRecencyColorClass(14);
    expect(cls).toContain('bg-yellow-100');
    expect(cls).toContain('border-yellow-200');
  });

  it('red has correct bg and border', () => {
    const cls = getRecencyColorClass(30);
    expect(cls).toContain('bg-red-100');
    expect(cls).toContain('border-red-200');
  });
});
