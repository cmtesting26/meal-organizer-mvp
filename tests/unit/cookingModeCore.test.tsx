/**
 * Cooking Mode Core Tests (Sprint 19)
 *
 * Unit tests for:
 * - Step parser (various instruction formats, edge cases)
 * - Ingredient-to-step matching (exact matches, partials, plurals)
 * - CookingMode split layout rendering and step counter
 *
 * QA Engineer · Sprint 19 · Stream D
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { parseSteps } from '../../src/lib/stepParser';
import { matchIngredientsToSteps } from '../../src/lib/ingredientMatcher';

// ============================================================
// STEP PARSER TESTS
// ============================================================
describe('parseSteps', () => {
  test('returns empty array for empty input', () => {
    expect(parseSteps([])).toEqual([]);
    expect(parseSteps([''])).toEqual([]);
  });

  test('parses pre-split instructions (most common format)', () => {
    const instructions = [
      'Boil water in a large pot.',
      'Add pasta and cook for 8 minutes.',
      'Drain and serve.',
    ];
    const steps = parseSteps(instructions);
    expect(steps).toHaveLength(3);
    expect(steps[0].stepNumber).toBe(1);
    expect(steps[0].text).toBe('Boil water in a large pot.');
    expect(steps[2].stepNumber).toBe(3);
    expect(steps[2].text).toBe('Drain and serve.');
  });

  test('handles numbered steps in a single string', () => {
    const instructions = [
      '1. Preheat oven to 180°C. 2. Mix flour and sugar. 3. Bake for 25 minutes.',
    ];
    const steps = parseSteps(instructions);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].text).toContain('Preheat oven');
  });

  test('handles "Step X:" format', () => {
    const instructions = [
      'Step 1: Chop the onions. Step 2: Heat oil in a pan. Step 3: Sauté until golden.',
    ];
    const steps = parseSteps(instructions);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].text).toContain('Chop the onions');
  });

  test('cleans leading numbers from pre-split steps', () => {
    const instructions = ['1. First step', '2. Second step', '3. Third step'];
    const steps = parseSteps(instructions);
    expect(steps[0].text).toBe('First step');
    expect(steps[1].text).toBe('Second step');
  });

  test('handles paragraph-separated instructions', () => {
    const instructions = ['First do this.\n\nThen do that.\n\nFinally serve.'];
    const steps = parseSteps(instructions);
    expect(steps.length).toBeGreaterThanOrEqual(3);
  });

  test('handles single step recipe', () => {
    const instructions = ['Mix everything together and serve.'];
    const steps = parseSteps(instructions);
    expect(steps).toHaveLength(1);
    expect(steps[0].stepNumber).toBe(1);
    expect(steps[0].text).toBe('Mix everything together and serve.');
  });

  test('filters out empty steps', () => {
    const instructions = ['Step one', '', 'Step two', '   '];
    const steps = parseSteps(instructions);
    expect(steps).toHaveLength(2);
  });

  test('preserves step numbering sequentially', () => {
    const instructions = ['A', 'B', 'C', 'D', 'E'];
    const steps = parseSteps(instructions);
    steps.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
    });
  });
});

// ============================================================
// INGREDIENT MATCHER TESTS
// ============================================================
describe('matchIngredientsToSteps', () => {
  test('returns empty map for empty inputs', () => {
    expect(matchIngredientsToSteps([], [])).toEqual(new Map());
    expect(matchIngredientsToSteps(['eggs'], [])).toEqual(new Map());
    expect(matchIngredientsToSteps([], ['mix'])).toEqual(new Map());
  });

  test('matches exact ingredient names to steps', () => {
    const ingredients = ['400g spaghetti', '2 eggs', '100g parmesan'];
    const steps = [
      'Boil the spaghetti until al dente.',
      'Whisk the eggs with parmesan.',
      'Toss spaghetti with the egg mixture.',
    ];
    const map = matchIngredientsToSteps(ingredients, steps);

    // Step 0 should match spaghetti
    expect(map.get(0)?.some((m) => m.text.includes('spaghetti'))).toBe(true);
    // Step 1 should match eggs and parmesan
    expect(map.get(1)?.some((m) => m.text.includes('eggs'))).toBe(true);
    expect(map.get(1)?.some((m) => m.text.includes('parmesan'))).toBe(true);
    // Step 2 should match spaghetti and eggs
    expect(map.get(2)?.some((m) => m.text.includes('spaghetti'))).toBe(true);
  });

  test('handles plural variations', () => {
    const ingredients = ['2 tomatoes', '1 onion'];
    const steps = ['Dice the tomato and onions.'];
    const map = matchIngredientsToSteps(ingredients, steps);

    // Should match both despite singular/plural mismatch
    expect(map.get(0)).toBeTruthy();
    expect(map.get(0)!.length).toBe(2);
  });

  test('handles partial matches with adjectives', () => {
    const ingredients = ['2 cups fresh basil', '1 tbsp extra virgin olive oil'];
    const steps = ['Add basil and drizzle with olive oil.'];
    const map = matchIngredientsToSteps(ingredients, steps);

    expect(map.get(0)).toBeTruthy();
    expect(map.get(0)!.length).toBe(2);
  });

  test('avoids false positives for short words (e.g., "oil" vs "boil")', () => {
    const ingredients = ['2 tbsp oil'];
    const steps = ['Boil the water for 10 minutes.'];
    const map = matchIngredientsToSteps(ingredients, steps);

    // "oil" should NOT match "boil" due to word boundary checking
    expect(map.get(0)).toBeUndefined();
  });

  test('returns correct ingredient indices', () => {
    const ingredients = ['salt', 'pepper', 'butter'];
    const steps = ['Season with salt and pepper.', 'Melt butter in a pan.'];
    const map = matchIngredientsToSteps(ingredients, steps);

    const step0Matches = map.get(0);
    expect(step0Matches?.find((m) => m.index === 0)).toBeTruthy(); // salt
    expect(step0Matches?.find((m) => m.index === 1)).toBeTruthy(); // pepper

    const step1Matches = map.get(1);
    expect(step1Matches?.find((m) => m.index === 2)).toBeTruthy(); // butter
  });

  test('steps with no matching ingredients get no entry', () => {
    const ingredients = ['chicken'];
    const steps = ['Preheat oven to 200°C.', 'Season the chicken.'];
    const map = matchIngredientsToSteps(ingredients, steps);

    expect(map.has(0)).toBe(false); // "Preheat oven" has no ingredients
    expect(map.has(1)).toBe(true); // "Season the chicken" matches
  });
});

// ============================================================
// COOKING MODE COMPONENT TESTS
// ============================================================

// Mock useWakeLock
vi.mock('../../src/hooks/useWakeLock', () => ({
  useWakeLock: () => ({
    isSupported: true,
    isActive: true,
    request: vi.fn(),
    release: vi.fn(),
  }),
}));

describe('CookingMode component', () => {
  const mockRecipe = {
    id: 'recipe-1',
    title: 'Test Carbonara',
    ingredients: ['400g spaghetti', '4 eggs', '200g guanciale', '100g pecorino'],
    instructions: [
      'Boil spaghetti in salted water until al dente.',
      'Crisp the guanciale in a pan until golden.',
      'Whisk eggs with pecorino in a bowl.',
      'Toss drained spaghetti with guanciale and egg mixture.',
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  test('renders split layout with ingredients and instruction panels', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    // Recipe title in header
    expect(screen.getByText('Test Carbonara')).toBeInTheDocument();

    // Step counter should show "Step 1 of 4"
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();

    // First step instruction
    expect(
      screen.getByText(/Boil spaghetti in salted water/),
    ).toBeInTheDocument();
  });

  test('navigates to next step with Next button', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    // Click Next
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    // Should now show step 2
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
    expect(screen.getByText(/Crisp the guanciale/)).toBeInTheDocument();
  });

  test('Previous button is disabled on first step', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    const prevBtn = screen.getByLabelText(/previous/i);
    expect(prevBtn).toBeDisabled();
  });

  test('shows Finish button on last step', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    // Navigate to last step
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn); // Step 2
    fireEvent.click(nextBtn); // Step 3
    fireEvent.click(nextBtn); // Step 4

    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  test('X button exits immediately — no confirmation dialog (S25-03)', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');
    const onExit = vi.fn();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={onExit} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    // Click the X button — should exit immediately
    const exitBtn = screen.getByLabelText(/exit/i);
    fireEvent.click(exitBtn);

    // No confirmation dialog
    expect(screen.queryByText(/Exit Cooking Mode/)).not.toBeInTheDocument();
    expect(onExit).toHaveBeenCalledOnce();
  });

  test('calls onExit directly on X click (S25-03)', async () => {
    const { CookingMode } = await import('../../src/components/CookingMode/CookingMode');
    const onExit = vi.fn();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <CookingMode recipe={mockRecipe} onExit={onExit} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText(/exit/i));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
