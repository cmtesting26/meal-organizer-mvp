/**
 * Bug Fix Regression Tests (Sprint 19)
 *
 * Covers all 4 bug fixes:
 * 1. Recipe Detail header consistency with Schedule/Library headers
 * 2. Share button URL correctness (in-app URL, not source URL)
 * 3. iOS nav bar height (safe-area-inset handling)
 * 4. Multi-select icon removal from search bar
 *
 * QA Engineer · Sprint 19 · Stream D
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-recipe-1' }),
  };
});

// Mock hooks
vi.mock('../../src/hooks/useRecipes', () => ({
  useRecipes: () => ({
    recipes: [
      {
        id: 'test-recipe-1',
        title: 'Test Spaghetti',
        ingredients: ['400g spaghetti', '2 eggs'],
        instructions: ['Boil pasta', 'Mix eggs'],
        tags: ['Italian'],
        sourceUrl: 'https://example.com/spaghetti',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    loading: false,
    allTags: ['Italian'],
    getRecipeById: (id: string) =>
      id === 'test-recipe-1'
        ? {
            id: 'test-recipe-1',
            title: 'Test Spaghetti',
            ingredients: ['400g spaghetti', '2 eggs'],
            instructions: ['Boil pasta', 'Mix eggs'],
            tags: ['Italian'],
            sourceUrl: 'https://example.com/spaghetti',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          }
        : undefined,
    refreshRecipes: vi.fn(),
    deleteRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    bulkDeleteRecipes: vi.fn(),
    bulkAssignTag: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useRecipeIngredients', () => ({
  useRecipeIngredients: () => ({
    loading: false,
    getScaledIngredients: () => [],
    parseAndStore: vi.fn(),
    hasStructuredIngredients: false,
  }),
}));

vi.mock('../../src/hooks/useToast', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn() },
  }),
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
  }),
}));

vi.mock('../../src/lib/publicShareService', () => ({
  generateShareableLink: vi.fn(),
}));

// ============================================================
// Test 1: Recipe Detail header consistency
// ============================================================
describe('Bug Fix: Recipe Detail header layout consistency', () => {
  test('RecipeDetail header uses max-w-7xl matching Schedule/Library', async () => {
    const { RecipeDetail } = await import('../../src/pages/RecipeDetail');

    const { container } = render(
      <MemoryRouter initialEntries={['/recipe/test-recipe-1']}>
        <I18nextProvider i18n={i18n}>
          <RecipeDetail />
        </I18nextProvider>
      </MemoryRouter>,
    );

    const headerDiv = container.querySelector('header > div');
    expect(headerDiv).toBeTruthy();
    // Sprint 23: RecipeDetail now uses WarmHeader component with px-4 py-3 styling
    expect(headerDiv!.className).toContain('px-4');
    expect(headerDiv!.className).toContain('py-3');
  });
});

// ============================================================
// Test 2: Share button URL correctness
// ============================================================
describe('Bug Fix: Share button uses in-app URL', () => {
  test('shareRecipe constructs in-app URL, not source URL', async () => {
    const { shareRecipe } = await import('../../src/lib/share');

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      share: undefined, // No native share
    });

    const recipe = {
      id: 'recipe-123',
      title: 'Test Recipe',
      ingredients: ['ingredient 1'],
      instructions: ['step 1'],
      sourceUrl: 'https://external-site.com/recipe',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    await shareRecipe(recipe);

    // Should copy public share URL only (raw URL, no title prefix), NOT the source URL
    const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(copiedText).toContain('/recipe/shared/recipe-123');
    expect(copiedText).not.toContain('external-site.com');
    expect(copiedText).not.toContain('Test Recipe');
  });
});

// ============================================================
// Test 3: iOS nav bar height
// ============================================================
describe('Bug Fix: PWA bottom nav bar height on iOS', () => {
  test('BottomNav source uses safe-area padding on nav element, not inner container', async () => {
    // jsdom strips env() CSS — verify via source code inspection
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/layout/BottomNav.tsx',
      'utf-8',
    );

    // Nav element should have inline style with safe-area-inset-bottom
    expect(source).toContain("paddingBottom: 'env(safe-area-inset-bottom");
    // Inner container should NOT have pb-[env(safe-area-inset-bottom)]
    expect(source).not.toContain('pb-[env(safe-area-inset-bottom)]');
  });

  test('BottomNav renders without errors', async () => {
    const { BottomNav } = await import('../../src/components/layout/BottomNav');

    const { container } = render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <BottomNav onAddClick={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    // Inner flex container should have h-14 for consistent nav height
    const innerDiv = nav!.querySelector('div');
    expect(innerDiv!.className).toContain('h-14');
  });
});

// ============================================================
// Test 4: Multi-select icon removal
// ============================================================
describe('Bug Fix: Multi-select icon removed from Library search bar', () => {
  test('RecipeLibrary search bar does not render CheckSquare icon button', async () => {
    const { RecipeLibrary } = await import('../../src/components/recipes/RecipeLibrary');

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <RecipeLibrary
            onRecipeClick={vi.fn()}
            onImportClick={vi.fn()}
            onAddManualClick={vi.fn()}
          />
        </I18nextProvider>
      </MemoryRouter>,
    );

    // The multi-select toggle button should NOT be present
    const selectModeBtn = screen.queryByLabelText(/select mode/i);
    expect(selectModeBtn).toBeNull();
  });

  test('S27-06: Multi-select mode fully removed from RecipeLibrary', async () => {
    // Sprint 27 removed all multi-select functionality entirely
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/recipes/RecipeLibrary.tsx',
      'utf-8',
    );
    expect(source).not.toContain('handleLongPress');
    expect(source).not.toContain('onLongPress');
    expect(source).not.toContain('CheckSquare');
    expect(source).not.toContain('selectedRecipes');
    expect(source).not.toContain('BulkActionBar');
  });
});
