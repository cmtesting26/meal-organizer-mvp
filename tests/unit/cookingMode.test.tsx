/**
 * Cooking Mode Tests (Sprint 20)
 *
 * Tests for cooking mode polish features:
 * - Responsive layout (portrait vs landscape)
 * - Edge cases (single step, empty instructions, no ingredients)
 * - Keyboard navigation (arrow keys, Escape)
 * - Start cooking button on Recipe Detail
 * - Exit flow with confirmation dialog
 * - Wake lock integration
 * - Step counter and progress dots
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookingMode } from '@/components/CookingMode/CookingMode';
import type { Recipe } from '@/types/recipe';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'cookingMode.stepOf': `Step ${opts?.current} of ${opts?.total}`,
        'cookingMode.ingredients': 'Ingredients for this step',
        'cookingMode.allIngredients': 'All Ingredients',
        'cookingMode.noIngredientsForStep': 'No specific ingredients for this step',
        'cookingMode.previousStep': 'Previous',
        'cookingMode.nextStep': 'Next',
        'cookingMode.finish': 'Finish',
        'cookingMode.exitTitle': 'Exit Cooking Mode?',
        'cookingMode.exitMessage': 'Your progress won\'t be saved.',
        'cookingMode.exitConfirm': 'Exit',
        'cookingMode.exitCancel': 'Keep Cooking',
        'cookingMode.startCooking': 'Step-by-step instructions',
        'cookingMode.wakeLockActive': 'Screen will stay on',
        'cookingMode.wakeLockUnsupported': 'Tip: Adjust your screen timeout',
        'cookingMode.noSteps': 'No steps found for this recipe.',
      };
      return map[key] || key;
    },
  }),
}));

// Mock useWakeLock
vi.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({ isSupported: true, isActive: true }),
}));

const makeRecipe = (overrides?: Partial<Recipe>): Recipe => ({
  id: 'test-1',
  title: 'Test Recipe',
  ingredients: ['2 cups flour', '1 cup sugar', '3 eggs', '1 cup milk'],
  instructions: [
    'Mix the flour and sugar together.',
    'Add the eggs one at a time.',
    'Pour in the milk and stir until smooth.',
  ],
  imageUrl: '',
  tags: [],
  servings: 4,
  prepTime: '',
  cookTime: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
} as Recipe);

describe('CookingMode — Sprint 20 Polish', () => {
  const onExit = vi.fn();

  beforeEach(() => {
    onExit.mockClear();
  });

  // ===== BASIC RENDERING =====

  test('renders cooking mode with recipe title', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  test('displays step counter with correct numbers', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  test('renders step text for first step', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    expect(screen.getByText(/Mix the flour and sugar/)).toBeInTheDocument();
  });

  // ===== NAVIGATION =====

  test('navigates forward with Next button', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  test('navigates backward with Previous button', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    // Go to step 2
    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByText('Previous'));
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  test('Previous button is disabled on first step', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    const prevBtn = screen.getByLabelText('Previous');
    expect(prevBtn).toBeDisabled();
  });

  test('shows Finish button on last step', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  test('clicking Finish exits cooking mode', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Finish'));

    expect(onExit).toHaveBeenCalled();
  });

  // ===== KEYBOARD NAVIGATION =====

  test('arrow right advances to next step', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  test('arrow left goes to previous step', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  test('Escape key exits immediately (S25-03)', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalled();
  });

  // ===== EXIT FLOW (S25-03: instant exit, no confirmation) =====

  test('X button exits immediately — no confirmation dialog (S25-03)', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    await user.click(screen.getByLabelText('Exit'));
    expect(onExit).toHaveBeenCalled();
    // No dialog should appear
    expect(screen.queryByText('Exit Cooking Mode?')).not.toBeInTheDocument();
  });

  test('Exit is instant — no Keep Cooking button exists (S25-03)', () => {
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    expect(screen.queryByText('Keep Cooking')).not.toBeInTheDocument();
  });

  test('Exit button calls onExit directly (S25-03)', async () => {
    const user = userEvent.setup();
    render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);

    await user.click(screen.getByLabelText('Exit'));
    expect(onExit).toHaveBeenCalledOnce();
  });

  // ===== EDGE CASES =====

  test('handles recipe with empty instructions', () => {
    render(
      <CookingMode recipe={makeRecipe({ instructions: [] })} onExit={onExit} />,
    );
    expect(screen.getByText('No steps found for this recipe.')).toBeInTheDocument();
  });

  test('handles recipe with single step', () => {
    render(
      <CookingMode
        recipe={makeRecipe({ instructions: ['Just mix everything together.'] })}
        onExit={onExit}
      />,
    );
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
    // Should show Finish immediately on single-step recipe
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  test('shows "no ingredients for this step" for unmatched steps', () => {
    render(
      <CookingMode
        recipe={makeRecipe({
          ingredients: ['400g dried spaghetti'],
          instructions: ['Preheat the oven to 350 degrees.'],
        })}
        onExit={onExit}
      />,
    );
    expect(
      screen.getByText('No specific ingredients for this step'),
    ).toBeInTheDocument();
  });

  // ===== WAKE LOCK =====

  test('renders wake lock indicator element when active', () => {
    const { container } = render(<CookingMode recipe={makeRecipe()} onExit={onExit} />);
    // The wake lock text is hidden on mobile (sm:inline), but the container span still renders
    const wakeLockIndicator = container.querySelector('.text-green-400');
    expect(wakeLockIndicator).toBeInTheDocument();
  });

  // ===== RESPONSIVE LAYOUT =====

  test('has responsive classes for landscape/tablet layout', () => {
    const { container } = render(
      <CookingMode recipe={makeRecipe()} onExit={onExit} />,
    );
    // Check that the split layout container has responsive flex direction
    const splitLayout = container.querySelector('.flex-col.md\\:flex-row');
    expect(splitLayout).toBeInTheDocument();
  });

  test('ingredients panel has responsive width for landscape', () => {
    const { container } = render(
      <CookingMode recipe={makeRecipe()} onExit={onExit} />,
    );
    const ingredientsPanel = container.querySelector('.md\\:w-\\[40\\%\\]');
    expect(ingredientsPanel).toBeInTheDocument();
  });

  // ===== PROGRESS DOTS =====

  test('hides progress dots for single-step recipe', () => {
    const { container } = render(
      <CookingMode
        recipe={makeRecipe({ instructions: ['Just one step.'] })}
        onExit={onExit}
      />,
    );
    // Progress dots should not render for 1-step recipes
    const dots = container.querySelectorAll('.rounded-full.h-1');
    expect(dots.length).toBe(0);
  });

  test('shows correct number of progress dots', () => {
    const { container } = render(
      <CookingMode recipe={makeRecipe()} onExit={onExit} />,
    );
    const dots = container.querySelectorAll('.rounded-full.transition-all');
    expect(dots.length).toBe(3);
  });
});
