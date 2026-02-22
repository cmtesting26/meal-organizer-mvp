/**
 * Household Feed & Meal Frequency Tests (Sprint 21)
 *
 * Tests: notification dot, new recipes section, cook frequency,
 * segmented control, Most Cooked ranking, i18n keys.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      const resolvedOpts = typeof fallbackOrOpts === 'object' ? fallbackOrOpts : opts;
      const translations: Record<string, string> = {
        'nav.newRecipes': `${resolvedOpts?.count || 0} new recipes`,
        'householdFeed.sectionLabel': 'New recipes from your household',
        'householdFeed.title': `${resolvedOpts?.count || 0} new recipe(s)`,
        'householdFeed.newFrom': `New from ${resolvedOpts?.name || ''}`,
        'householdFeed.dismiss': 'Dismiss new recipes',
        'frequency.neverCooked': 'Never cooked',
        'frequency.cooked': 'Cooked',
        'frequency.thisMonth': `${resolvedOpts?.count || 0}× this month`,
        'frequency.thisYear': `${resolvedOpts?.count || 0}× this year`,
        'frequency.cookedCount': `Cooked ${resolvedOpts?.count || 0}×`,
        'frequency.allRecipes': 'All Recipes',
        'frequency.mostCooked': 'Most Cooked',
        'frequency.viewSwitch': 'Library view',
        'frequency.emptyTitle': 'No cooking history yet',
        'frequency.emptySubtitle': 'Cook some recipes to see your favorites here!',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/library' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLocalOnly: true,
    profile: null,
    user: null,
  }),
}));

vi.mock('@/hooks/useCookFrequency', () => ({
  useCookFrequency: () => ({
    frequency: { total: 0, thisMonth: 0, thisYear: 0 },
    frequencyMap: new Map(),
    mostCooked: [],
    loading: false,
  }),
}));

// ─── NotificationDot tests ──────────────────────────────────────────────

import { NotificationDot } from '@/components/layout/NotificationDot';

describe('NotificationDot', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<NotificationDot visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dot when visible is true', () => {
    const { container } = render(<NotificationDot visible={true} />);
    const dot = container.querySelector('span');
    expect(dot).toBeTruthy();
    expect(dot?.getAttribute('role')).toBe('status');
  });

  it('applies custom aria label', () => {
    render(<NotificationDot visible={true} label="3 new recipes" />);
    const dot = screen.getByRole('status');
    expect(dot.getAttribute('aria-label')).toBe('3 new recipes');
  });

  it('has animated ping ring', () => {
    const { container } = render(<NotificationDot visible={true} />);
    const pingRing = container.querySelector('.animate-ping');
    expect(pingRing).toBeTruthy();
  });
});

// ─── NewRecipesSection tests ────────────────────────────────────────────

import { NewRecipesSection } from '@/components/recipes/NewRecipesSection';

const mockRecipes = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    ingredients: ['pasta', 'eggs'],
    instructions: ['Cook pasta', 'Mix eggs'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    addedByName: 'Alice',
  },
  {
    id: '2',
    title: 'Green Curry',
    ingredients: ['curry paste', 'coconut milk'],
    instructions: ['Heat paste', 'Add milk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    addedByName: 'Bob',
  },
];

describe('NewRecipesSection', () => {
  it('renders nothing when no new recipes', () => {
    const { container } = render(
      <NewRecipesSection recipes={[]} onRecipeClick={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders section with recipe count', () => {
    render(
      <NewRecipesSection recipes={mockRecipes} onRecipeClick={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('2 new recipe(s)')).toBeTruthy();
  });

  it('shows "New from [name]" labels', () => {
    render(
      <NewRecipesSection recipes={mockRecipes} onRecipeClick={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('New from Alice')).toBeTruthy();
    expect(screen.getByText('New from Bob')).toBeTruthy();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <NewRecipesSection recipes={mockRecipes} onRecipeClick={vi.fn()} onDismiss={onDismiss} />
    );
    const dismissBtn = screen.getByLabelText('Dismiss new recipes');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has accessible section label', () => {
    render(
      <NewRecipesSection recipes={mockRecipes} onRecipeClick={vi.fn()} onDismiss={vi.fn()} />
    );
    const section = screen.getByLabelText('New recipes from your household');
    expect(section).toBeTruthy();
  });
});

// ─── TextTabs tests (Sprint 23: replaced SegmentedControl) ──────────────

import { TextTabs } from '@/components/common/TextTabs';

describe('TextTabs (replaces SegmentedControl)', () => {
  const tabs = [
    { key: 'all', label: 'All Recipes' },
    { key: 'mostCooked', label: 'Most Cooked' },
  ];

  it('renders all tabs', () => {
    render(<TextTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} />);
    expect(screen.getByText('All Recipes')).toBeTruthy();
    expect(screen.getByText('Most Cooked')).toBeTruthy();
  });

  it('marks active tab with aria-selected', () => {
    render(<TextTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} />);
    const allTab = screen.getByText('All Recipes');
    expect(allTab.getAttribute('aria-selected')).toBe('true');
    const mostTab = screen.getByText('Most Cooked');
    expect(mostTab.getAttribute('aria-selected')).toBe('false');
  });

  it('calls onTabChange when tab clicked', () => {
    const onChange = vi.fn();
    render(<TextTabs tabs={tabs} activeTab="all" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Most Cooked'));
    expect(onChange).toHaveBeenCalledWith('mostCooked');
  });

  it('has tablist role', () => {
    render(<TextTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeTruthy();
  });
});

// ─── CookFrequency component tests ─────────────────────────────────────

import { CookFrequency } from '@/components/recipes/CookFrequency';

describe('CookFrequency', () => {
  it('S26-02: returns null for zero frequency (hidden when never cooked)', () => {
    const { container } = render(<CookFrequency recipeId="test-123" />);
    // Should render nothing (null) when frequency.total === 0
    expect(container.firstChild).toBeNull();
  });
});

// ─── i18n key coverage tests ────────────────────────────────────────────

describe('i18n key coverage', () => {
  it('EN has all household feed keys', async () => {
    const fs = await import('fs');
    const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
    expect(en.householdFeed).toBeTruthy();
    expect(en.householdFeed.sectionLabel).toBeTruthy();
    expect(en.householdFeed.title).toBeTruthy();
    expect(en.householdFeed.newFrom).toBeTruthy();
    expect(en.householdFeed.dismiss).toBeTruthy();
  });

  it('EN has all frequency keys', async () => {
    const fs = await import('fs');
    const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
    expect(en.frequency).toBeTruthy();
    expect(en.frequency.allRecipes).toBeTruthy();
    expect(en.frequency.mostCooked).toBeTruthy();
    expect(en.frequency.neverCooked).toBeTruthy();
    expect(en.frequency.cookedCount).toBeTruthy();
  });

  it('DE has all household feed keys', async () => {
    const fs = await import('fs');
    const de = JSON.parse(fs.readFileSync('src/i18n/de.json', 'utf8'));
    expect(de.householdFeed).toBeTruthy();
    expect(de.householdFeed.sectionLabel).toBeTruthy();
    expect(de.householdFeed.title).toBeTruthy();
    expect(de.householdFeed.newFrom).toBeTruthy();
  });

  it('DE has all frequency keys', async () => {
    const fs = await import('fs');
    const de = JSON.parse(fs.readFileSync('src/i18n/de.json', 'utf8'));
    expect(de.frequency).toBeTruthy();
    expect(de.frequency.allRecipes).toBeTruthy();
    expect(de.frequency.mostCooked).toBeTruthy();
    expect(de.frequency.neverCooked).toBeTruthy();
  });

  it('nav has newRecipes key in both languages', async () => {
    const fs = await import('fs');
    const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
    const de = JSON.parse(fs.readFileSync('src/i18n/de.json', 'utf8'));
    expect(en.nav.newRecipes).toBeTruthy();
    expect(de.nav.newRecipes).toBeTruthy();
  });
});
