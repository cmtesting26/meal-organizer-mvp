/**
 * Scaling Accuracy Tests (Sprint 12 — S12-14)
 *
 * Tests that recipe scaling produces correct proportional quantities
 * for real-world recipe ingredient lists.
 */

import { describe, it, expect } from 'vitest';
import {
  parseIngredient,
  scaleIngredient,
  formatQuantity,
  formatScaledIngredient,
} from '@/lib/ingredientParser';

/**
 * Helper: parse, scale, and return formatted display
 */
function scaleAndFormat(raw: string, factor: number): string {
  const parsed = parseIngredient(raw);
  const scaled = scaleIngredient(parsed, factor);
  return formatScaledIngredient(scaled);
}

describe('Scaling accuracy: real recipe scenarios', () => {
  // ─── Spaghetti Carbonara (4 servings baseline) ────────────────────

  describe('Spaghetti Carbonara → doubled (8 servings)', () => {
    const factor = 2;

    it('400g spaghetti → 800g', () => {
      const result = scaleAndFormat('400g spaghetti', factor);
      expect(result).toContain('800');
      expect(result).toContain('g');
    });

    it('4 egg yolks → 8', () => {
      const parsed = parseIngredient('4 egg yolks');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(8);
    });

    it('200g guanciale → 400g', () => {
      const parsed = parseIngredient('200g guanciale');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(400);
    });

    it('salt to taste stays unchanged', () => {
      const parsed = parseIngredient('salt to taste');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(null);
    });
  });

  // ─── Banana Bread (1 loaf → 3 loaves) ─────────────────────────────

  describe('Banana Bread → tripled', () => {
    const factor = 3;

    it('3 ripe bananas → 9', () => {
      const parsed = parseIngredient('3 ripe bananas');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(9);
    });

    it('1/3 cup butter → 1 cup', () => {
      const parsed = parseIngredient('1/3 cup butter');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBeCloseTo(1, 1);
      expect(scaled.unit).toBe('cup');
    });

    it('1 1/2 cups flour → 4½ cups', () => {
      const parsed = parseIngredient('1 1/2 cups flour');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(4.5);
    });

    it('1 tsp baking soda → 3 tsp', () => {
      const parsed = parseIngredient('1 tsp baking soda');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(3);
    });
  });

  // ─── Halving a recipe ──────────────────────────────────────────────

  describe('Cookie recipe → halved', () => {
    const factor = 0.5;

    it('2 cups flour → 1 cup', () => {
      const parsed = parseIngredient('2 cups flour');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(1);
    });

    it('1 cup sugar → ½ cup', () => {
      const parsed = parseIngredient('1 cup sugar');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(0.5);
      expect(formatQuantity(scaled.quantity)).toBe('½');
    });

    it('2 tsp vanilla → 1 tsp', () => {
      const parsed = parseIngredient('2 tsp vanilla extract');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(1);
    });

    it('1/4 tsp salt → ⅛ tsp', () => {
      const parsed = parseIngredient('1/4 tsp salt');
      const scaled = scaleIngredient(parsed, factor);
      expect(scaled.quantity).toBe(0.125);
      expect(formatQuantity(scaled.quantity)).toBe('⅛');
    });
  });

  // ─── Scaling with ranges ──────────────────────────────────────────

  describe('Range scaling', () => {
    it('2-3 cloves garlic × 2 → 4-6', () => {
      const parsed = parseIngredient('2-3 cloves garlic');
      const scaled = scaleIngredient(parsed, 2);
      expect(scaled.quantity).toBe(4);
      expect(scaled.quantityMax).toBe(6);
    });

    it('3 to 4 tbsp oil × 0.5 → 1.5-2', () => {
      const parsed = parseIngredient('3 to 4 tablespoons oil');
      const scaled = scaleIngredient(parsed, 0.5);
      expect(scaled.quantity).toBe(1.5);
      expect(scaled.quantityMax).toBe(2);
    });
  });

  // ─── Formatting accuracy ──────────────────────────────────────────

  describe('Display formatting after scaling', () => {
    it('scaling 1 cup by ⅓ shows ⅓', () => {
      const parsed = parseIngredient('1 cup milk');
      const scaled = scaleIngredient(parsed, 1 / 3);
      const qty = formatQuantity(scaled.quantity);
      expect(qty).toBe('⅓');
    });

    it('scaling 1 cup by ⅔ shows ⅔', () => {
      const parsed = parseIngredient('1 cup milk');
      const scaled = scaleIngredient(parsed, 2 / 3);
      const qty = formatQuantity(scaled.quantity);
      expect(qty).toBe('⅔');
    });

    it('scaling 3 by 1.5 shows 4½', () => {
      const parsed = parseIngredient('3 cups water');
      const scaled = scaleIngredient(parsed, 1.5);
      const qty = formatQuantity(scaled.quantity);
      expect(qty).toBe('4½');
    });
  });
});
