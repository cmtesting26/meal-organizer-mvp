/**
 * Timer Parser Unit Tests (Sprint 25)
 *
 * Tests for auto-suggest cooking timer duration parsing from step text.
 */

import { describe, it, expect } from 'vitest';
import { parseTimerFromStep, formatTimerLabel } from '../../src/lib/timerParser';

describe('timerParser', () => {
  describe('parseTimerFromStep', () => {
    // Simple time patterns
    it('parses "about 8 minutes" → 480s', () => {
      const result = parseTimerFromStep('Cook the pasta for about 8 minutes until al dente.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(480);
    });

    it('parses "for 15 min" → 900s', () => {
      const result = parseTimerFromStep('Simmer for 15 min.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(900);
    });

    it('parses "simmer 20 minutes" → 1200s', () => {
      const result = parseTimerFromStep('Simmer 20 minutes until sauce thickens.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(1200);
    });

    it('parses "bake for 1 hour" → 3600s', () => {
      const result = parseTimerFromStep('Bake for 1 hour at 350°F.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(3600);
    });

    it('parses "rest 30 seconds" → 30s', () => {
      const result = parseTimerFromStep('Let rest 30 seconds before serving.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(30);
    });

    it('parses "cook 45 min" → 2700s', () => {
      const result = parseTimerFromStep('Cook 45 min on medium heat.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(2700);
    });

    // Compound times
    it('parses "1 hour 30 minutes" → 5400s', () => {
      const result = parseTimerFromStep('Bake for 1 hour 30 minutes.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(5400);
    });

    it('parses "2 hours 15 minutes" → 8100s', () => {
      const result = parseTimerFromStep('Slow cook for 2 hours 15 minutes.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(8100);
    });

    it('parses "1 hr and 45 min" → 6300s', () => {
      const result = parseTimerFromStep('Roast for 1 hr and 45 min.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(6300);
    });

    // Range times — use lower bound
    it('parses "8-10 minutes" → 480s (lower bound)', () => {
      const result = parseTimerFromStep('Sauté for 8-10 minutes until golden.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(480);
    });

    it('parses "3-5 min" → 180s (lower bound)', () => {
      const result = parseTimerFromStep('Stir fry 3-5 min.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(180);
    });

    it('parses "20-25 minutes" → 1200s (lower bound)', () => {
      const result = parseTimerFromStep('Bake 20-25 minutes until golden brown.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(1200);
    });

    // Case insensitive
    it('is case insensitive', () => {
      const result = parseTimerFromStep('Cook for About 10 MINUTES.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(600);
    });

    // No time detected
    it('returns null when no time is in text', () => {
      expect(parseTimerFromStep('Chop the onions finely.')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseTimerFromStep('')).toBeNull();
    });

    it('returns null for null-ish input', () => {
      expect(parseTimerFromStep(null as any)).toBeNull();
      expect(parseTimerFromStep(undefined as any)).toBeNull();
    });

    // Edge cases
    it('ignores "minutes" without a number', () => {
      // "minutes" alone without a preceding number should not match
      expect(parseTimerFromStep('A few minutes later, check the oven.')).toBeNull();
    });

    it('handles "approximately 12 minutes"', () => {
      const result = parseTimerFromStep('Cook approximately 12 minutes.');
      expect(result).not.toBeNull();
      expect(result!.seconds).toBe(720);
    });

    it('handles step with multiple time references — picks first compound or first match', () => {
      const result = parseTimerFromStep('Cook for 5 minutes, then add sauce and cook 10 minutes more.');
      expect(result).not.toBeNull();
      // Should pick the first match
      expect(result!.seconds).toBe(300);
    });

    // Label check
    it('generates correct label for detected time', () => {
      const result = parseTimerFromStep('Bake for 1 hour 30 minutes.');
      expect(result).not.toBeNull();
      expect(result!.label).toBe('1 hr 30 min');
    });
  });

  describe('formatTimerLabel', () => {
    it('formats seconds only', () => {
      expect(formatTimerLabel(30)).toBe('30 sec');
    });

    it('formats minutes only', () => {
      expect(formatTimerLabel(600)).toBe('10 min');
    });

    it('formats hours only', () => {
      expect(formatTimerLabel(7200)).toBe('2 hr');
    });

    it('formats hours and minutes', () => {
      expect(formatTimerLabel(5400)).toBe('1 hr 30 min');
    });

    it('formats minutes and seconds', () => {
      expect(formatTimerLabel(90)).toBe('1 min 30 sec');
    });

    it('formats 0 seconds', () => {
      expect(formatTimerLabel(0)).toBe('0 sec');
    });
  });
});
