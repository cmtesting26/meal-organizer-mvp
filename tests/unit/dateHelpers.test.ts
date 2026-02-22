/**
 * Date Helpers Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatDayName,
  getRecencyText,
  getRecencyCategory,
  getTodayISO,
  toISODateString,
  getWeekStart,
  getWeekDays,
  formatWeekRange,
} from '../../src/lib/dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('formats ISO date string', () => {
      expect(formatDate('2026-02-11')).toBe('Feb 11, 2026');
    });

    it('handles invalid date', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });
  });

  describe('formatDateShort', () => {
    it('formats date as short string', () => {
      const result = formatDateShort('2026-02-11');
      expect(result).toMatch(/Wed 2\/11/);
    });
  });

  describe('formatDayName', () => {
    it('returns full day name', () => {
      expect(formatDayName('2026-02-11')).toBe('Wednesday');
    });
  });

  describe('getRecencyText', () => {
    it('returns "Never cooked" for undefined', () => {
      expect(getRecencyText(undefined)).toBe('Never cooked');
    });

    it('returns relative time for valid date', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 3);
      const result = getRecencyText(recent.toISOString().split('T')[0]);
      expect(result).toContain('ago');
    });
  });

  describe('getRecencyCategory', () => {
    it('returns "never" for undefined', () => {
      expect(getRecencyCategory()).toBe('never');
    });

    it('returns "fresh" for today', () => {
      expect(getRecencyCategory(getTodayISO())).toBe('fresh');
    });

    it('returns "stale" for old date', () => {
      expect(getRecencyCategory('2020-01-01')).toBe('stale');
    });
  });

  describe('getTodayISO', () => {
    it('returns YYYY-MM-DD format', () => {
      expect(getTodayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getWeekStart', () => {
    it('returns Monday for a Wednesday', () => {
      const wed = new Date(2026, 1, 11); // Feb 11 2026 = Wednesday
      const monday = getWeekStart(wed);
      expect(monday.getDay()).toBe(1); // Monday
    });
  });

  describe('getWeekDays', () => {
    it('returns 7 days starting from Monday', () => {
      const monday = new Date(2026, 1, 9); // Feb 9 2026 = Monday
      const days = getWeekDays(monday);
      expect(days).toHaveLength(7);
      expect(days[0].getDay()).toBe(1); // Monday
      expect(days[6].getDay()).toBe(0); // Sunday
    });
  });

  describe('formatWeekRange', () => {
    it('formats range within same month', () => {
      const monday = new Date(2026, 1, 9); // Feb 9
      const range = formatWeekRange(monday);
      expect(range).toContain('Feb');
    });
  });

  describe('toISODateString', () => {
    it('converts Date to YYYY-MM-DD', () => {
      const date = new Date(2026, 1, 11);
      expect(toISODateString(date)).toBe('2026-02-11');
    });
  });
});
