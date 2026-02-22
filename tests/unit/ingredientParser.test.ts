/**
 * Ingredient Parser Tests (Sprint 12 — S12-13)
 *
 * Edge cases: fractions, Unicode fractions, ranges, mixed numbers,
 * "to taste", "a pinch of", decimals, unit variations, German units.
 */

import { describe, it, expect } from 'vitest';
import {
  parseIngredient,
  parseIngredients,
  scaleIngredient,
  formatQuantity,
  formatScaledIngredient,
} from '@/lib/ingredientParser';

describe('parseIngredient', () => {
  // ─── Basic quantity + unit + name ───────────────────────────────────

  describe('basic parsing', () => {
    it('parses "2 cups flour"', () => {
      const r = parseIngredient('2 cups flour');
      expect(r.quantity).toBe(2);
      expect(r.unit).toBe('cup');
      expect(r.name).toBe('flour');
      expect(r.rawText).toBe('2 cups flour');
    });

    it('parses "1 tbsp olive oil"', () => {
      const r = parseIngredient('1 tbsp olive oil');
      expect(r.quantity).toBe(1);
      expect(r.unit).toBe('tbsp');
      expect(r.name).toBe('olive oil');
    });

    it('parses "400g spaghetti"', () => {
      const r = parseIngredient('400g spaghetti');
      expect(r.quantity).toBe(400);
      expect(r.unit).toBe('g');
      expect(r.name).toBe('spaghetti');
    });

    it('parses "3 large eggs" (no unit)', () => {
      const r = parseIngredient('3 large eggs');
      expect(r.quantity).toBe(3);
      expect(r.unit).toBe('');
      expect(r.name).toBe('large eggs');
    });
  });

  // ─── Fractions ──────────────────────────────────────────────────────

  describe('fractions', () => {
    it('parses "1/2 tsp salt"', () => {
      const r = parseIngredient('1/2 tsp salt');
      expect(r.quantity).toBe(0.5);
      expect(r.unit).toBe('tsp');
      expect(r.name).toBe('salt');
    });

    it('parses "3/4 cup sugar"', () => {
      const r = parseIngredient('3/4 cup sugar');
      expect(r.quantity).toBe(0.75);
      expect(r.unit).toBe('cup');
    });

    it('parses "1/3 cup milk"', () => {
      const r = parseIngredient('1/3 cup milk');
      expect(r.quantity).toBeCloseTo(1 / 3, 5);
    });
  });

  // ─── Unicode fractions ──────────────────────────────────────────────

  describe('Unicode fractions', () => {
    it('parses "½ tsp vanilla extract"', () => {
      const r = parseIngredient('½ tsp vanilla extract');
      expect(r.quantity).toBe(0.5);
      expect(r.unit).toBe('tsp');
      expect(r.name).toBe('vanilla extract');
    });

    it('parses "¾ cup butter"', () => {
      const r = parseIngredient('¾ cup butter');
      expect(r.quantity).toBe(0.75);
    });

    it('parses "⅓ cup cream"', () => {
      const r = parseIngredient('⅓ cup cream');
      expect(r.quantity).toBeCloseTo(1 / 3, 5);
    });
  });

  // ─── Mixed numbers ─────────────────────────────────────────────────

  describe('mixed numbers', () => {
    it('parses "1 1/2 cups water"', () => {
      const r = parseIngredient('1 1/2 cups water');
      expect(r.quantity).toBe(1.5);
      expect(r.unit).toBe('cup');
      expect(r.name).toBe('water');
    });

    it('parses "2 1/4 tsp baking powder"', () => {
      const r = parseIngredient('2 1/4 tsp baking powder');
      expect(r.quantity).toBe(2.25);
      expect(r.unit).toBe('tsp');
    });

    it('parses "1½ cups flour" (Unicode mixed)', () => {
      const r = parseIngredient('1½ cups flour');
      expect(r.quantity).toBe(1.5);
      expect(r.unit).toBe('cup');
    });
  });

  // ─── Ranges ─────────────────────────────────────────────────────────

  describe('ranges', () => {
    it('parses "2-3 cloves garlic"', () => {
      const r = parseIngredient('2-3 cloves garlic');
      expect(r.quantity).toBe(2);
      expect(r.quantityMax).toBe(3);
      expect(r.unit).toBe('clove');
      expect(r.name).toBe('garlic');
    });

    it('parses "3 to 4 tablespoons butter"', () => {
      const r = parseIngredient('3 to 4 tablespoons butter');
      expect(r.quantity).toBe(3);
      expect(r.quantityMax).toBe(4);
      expect(r.unit).toBe('tbsp');
    });
  });

  // ─── Decimals ───────────────────────────────────────────────────────

  describe('decimals', () => {
    it('parses "0.5 kg chicken"', () => {
      const r = parseIngredient('0.5 kg chicken');
      expect(r.quantity).toBe(0.5);
      expect(r.unit).toBe('kg');
    });

    it('parses "1.25 liters water"', () => {
      const r = parseIngredient('1.25 liters water');
      expect(r.quantity).toBe(1.25);
      expect(r.unit).toBe('l');
    });
  });

  // ─── No-quantity items ──────────────────────────────────────────────

  describe('no-quantity items', () => {
    it('parses "salt to taste"', () => {
      const r = parseIngredient('salt to taste');
      expect(r.quantity).toBe(null);
      expect(r.unit).toBe('');
      expect(r.name).toBe('salt to taste');
    });

    it('parses "a pinch of pepper"', () => {
      const r = parseIngredient('a pinch of pepper');
      expect(r.quantity).toBe(null);
      // "a" is not a quantity, so it remains in the name
      expect(r.name).toContain('pepper');
    });

    it('parses empty string', () => {
      const r = parseIngredient('');
      expect(r.quantity).toBe(null);
      expect(r.unit).toBe('');
      expect(r.name).toBe('');
    });

    it('parses "freshly ground black pepper"', () => {
      const r = parseIngredient('freshly ground black pepper');
      expect(r.quantity).toBe(null);
    });
  });

  // ─── Unit variations ────────────────────────────────────────────────

  describe('unit normalisation', () => {
    it('normalises "tablespoons" → "tbsp"', () => {
      expect(parseIngredient('2 tablespoons sugar').unit).toBe('tbsp');
    });

    it('normalises "teaspoons" → "tsp"', () => {
      expect(parseIngredient('1 teaspoons salt').unit).toBe('tsp');
    });

    it('normalises "grams" → "g"', () => {
      expect(parseIngredient('200 grams flour').unit).toBe('g');
    });

    it('normalises "ounces" → "oz"', () => {
      expect(parseIngredient('8 ounces cream cheese').unit).toBe('oz');
    });

    it('normalises "pounds" → "lb"', () => {
      expect(parseIngredient('2 pounds beef').unit).toBe('lb');
    });

    it('normalises "milliliters" → "ml"', () => {
      expect(parseIngredient('250 milliliters milk').unit).toBe('ml');
    });
  });

  // ─── German units ──────────────────────────────────────────────────

  describe('German units', () => {
    it('normalises "EL" (Esslöffel) → "tbsp"', () => {
      expect(parseIngredient('2 EL Olivenöl').unit).toBe('tbsp');
    });

    it('normalises "TL" (Teelöffel) → "tsp"', () => {
      expect(parseIngredient('1 TL Salz').unit).toBe('tsp');
    });

    it('normalises "Prise" → "pinch"', () => {
      expect(parseIngredient('1 Prise Pfeffer').unit).toBe('pinch');
    });
  });
});

describe('parseIngredients', () => {
  it('parses an array of ingredients', () => {
    const results = parseIngredients([
      '2 cups flour',
      '1/2 tsp salt',
      'salt to taste',
    ]);
    expect(results).toHaveLength(3);
    expect(results[0].quantity).toBe(2);
    expect(results[1].quantity).toBe(0.5);
    expect(results[2].quantity).toBe(null);
  });
});

describe('scaleIngredient', () => {
  it('scales quantity by factor', () => {
    const parsed = parseIngredient('2 cups flour');
    const scaled = scaleIngredient(parsed, 2);
    expect(scaled.quantity).toBe(4);
  });

  it('scales range quantities', () => {
    const parsed = parseIngredient('2-3 cloves garlic');
    const scaled = scaleIngredient(parsed, 1.5);
    expect(scaled.quantity).toBe(3);
    expect(scaled.quantityMax).toBe(4.5);
  });

  it('handles null quantity (no-quantity items)', () => {
    const parsed = parseIngredient('salt to taste');
    const scaled = scaleIngredient(parsed, 2);
    expect(scaled.quantity).toBe(null);
  });

  it('handles factor of 0.5 (halving)', () => {
    const parsed = parseIngredient('4 tbsp butter');
    const scaled = scaleIngredient(parsed, 0.5);
    expect(scaled.quantity).toBe(2);
  });
});

describe('formatQuantity', () => {
  it('returns empty string for null', () => {
    expect(formatQuantity(null)).toBe('');
  });

  it('returns "0" for zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });

  it('returns whole number without decimals', () => {
    expect(formatQuantity(3)).toBe('3');
  });

  it('returns ½ for 0.5', () => {
    expect(formatQuantity(0.5)).toBe('½');
  });

  it('returns 1½ for 1.5', () => {
    expect(formatQuantity(1.5)).toBe('1½');
  });

  it('returns ¼ for 0.25', () => {
    expect(formatQuantity(0.25)).toBe('¼');
  });

  it('returns ¾ for 0.75', () => {
    expect(formatQuantity(0.75)).toBe('¾');
  });

  it('returns ⅓ for 1/3', () => {
    expect(formatQuantity(1 / 3)).toBe('⅓');
  });

  it('returns ⅔ for 2/3', () => {
    expect(formatQuantity(2 / 3)).toBe('⅔');
  });

  it('rounds unusual decimals to 2 places', () => {
    expect(formatQuantity(1.333)).toBe('1⅓'); // close to 1/3
    expect(formatQuantity(2.17)).toBe('2.17'); // no fraction match
  });
});

describe('formatScaledIngredient', () => {
  it('formats a basic scaled ingredient', () => {
    const parsed = parseIngredient('2 cups flour');
    expect(formatScaledIngredient(parsed)).toBe('2 cup flour');
  });

  it('formats a range ingredient', () => {
    const parsed = parseIngredient('2-3 cloves garlic');
    expect(formatScaledIngredient(parsed)).toBe('2-3 clove garlic');
  });

  it('formats no-quantity ingredient', () => {
    const parsed = parseIngredient('salt to taste');
    expect(formatScaledIngredient(parsed)).toBe('salt to taste');
  });

  it('formats scaled unicode fraction ingredient', () => {
    const parsed = parseIngredient('½ tsp vanilla');
    const scaled = scaleIngredient(parsed, 2);
    expect(formatScaledIngredient(scaled)).toBe('1 tsp vanilla');
  });
});
