/**
 * OCR Recipe Parser Tests (Sprint 14 — S14-09)
 *
 * Tests for parsing raw OCR text into structured recipes.
 */

import { describe, it, expect } from 'vitest';
import { parseOcrText } from '../../src/lib/ocrRecipeParser';

describe('OCR Recipe Parser', () => {
  describe('parseOcrText', () => {
    it('should parse a well-structured recipe with section headers', () => {
      const text = [
        'Pasta Carbonara',
        '',
        'Ingredients',
        '400g spaghetti',
        '200g pancetta',
        '4 eggs',
        '100g Parmesan',
        '',
        'Instructions',
        '1. Boil the spaghetti in salted water until al dente.',
        '2. Fry pancetta until crispy.',
        '3. Mix eggs with grated Parmesan.',
        '4. Combine hot pasta with pancetta, then add egg mixture off heat.',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.success).toBe(true);
      expect(result.title).toBe('Pasta Carbonara');
      expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(result.instructions.length).toBeGreaterThanOrEqual(3);
      expect(result.confidence.overall).not.toBe('low');
    });

    it('should detect ingredients by unit patterns', () => {
      const text = [
        'Simple Soup',
        '',
        '200g carrots',
        '1 cup vegetable broth',
        '2 tbsp olive oil',
        '1 pinch salt',
        '',
        'Dice carrots and cook in broth with olive oil for 20 minutes.',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.success).toBe(true);
      expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(result.ingredients.some(i => i.includes('carrots'))).toBe(true);
    });

    it('should detect German recipes', () => {
      const text = [
        'Kartoffelsuppe',
        '',
        'Zutaten',
        '500g Kartoffeln',
        '1 Bund Petersilie',
        '200ml Sahne',
        '',
        'Zubereitung',
        '1. Kartoffeln schälen und in Würfel schneiden.',
        '2. In Wasser kochen bis weich.',
        '3. Sahne hinzufügen und pürieren.',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.success).toBe(true);
      expect(result.title).toBe('Kartoffelsuppe');
      expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
      expect(result.instructions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty text', () => {
      const result = parseOcrText('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle text with no recipe structure', () => {
      const result = parseOcrText('Hello world\nThis is not a recipe');
      expect(result.confidence.overall).toBe('low');
    });

    it('should include raw text in result', () => {
      const text = 'Test Recipe\n1 cup flour';
      const result = parseOcrText(text);
      expect(result.rawText).toBe(text);
    });

    it('should provide confidence scores', () => {
      const text = [
        'Good Recipe Title',
        '',
        'Ingredients',
        '200g flour',
        '100ml milk',
        '2 eggs',
        '',
        'Instructions',
        '1. Mix all ingredients together in a large bowl until smooth.',
        '2. Pour into a greased baking pan and bake at 180C for 30 minutes.',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.confidence).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.confidence.title);
      expect(['high', 'medium', 'low']).toContain(result.confidence.ingredients);
      expect(['high', 'medium', 'low']).toContain(result.confidence.instructions);
      expect(['high', 'medium', 'low']).toContain(result.confidence.overall);
    });

    it('should handle instructions starting with action verbs', () => {
      const text = [
        'Quick Salad',
        '',
        '2 cups lettuce',
        '1 cup tomatoes',
        '',
        'Chop the lettuce into bite-sized pieces and place in a large bowl.',
        'Add sliced tomatoes on top and toss with dressing before serving.',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.success).toBe(true);
      expect(result.instructions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
