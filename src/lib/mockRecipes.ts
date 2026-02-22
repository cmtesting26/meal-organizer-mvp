/**
 * Mock Recipe Data
 * Used for development and testing until real parser is integrated
 * 
 * @note This file will be removed once the recipe parser is working
 * and connected to IndexedDB from Sprint 2
 */

import type { Recipe } from '@/types/recipe';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    ingredients: [
      '400g spaghetti',
      '200g pancetta or guanciale',
      '4 large eggs',
      '100g Parmesan cheese, grated',
      'Black pepper',
      'Salt'
    ],
    instructions: [
      'Boil pasta in salted water until al dente',
      'Meanwhile, fry pancetta until crispy',
      'Beat eggs with grated Parmesan',
      'Drain pasta, reserving 1 cup pasta water',
      'Mix hot pasta with egg mixture off heat',
      'Add pancetta and pasta water to desired consistency',
      'Season with black pepper and serve'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    sourceUrl: 'https://example.com/carbonara',
    lastCookedDate: '2026-01-15',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Thai Red Curry',
    ingredients: [
      '500g chicken breast, sliced',
      '2 tbsp red curry paste',
      '400ml coconut milk',
      '1 red bell pepper',
      '100g green beans',
      'Thai basil',
      'Fish sauce',
      'Palm sugar'
    ],
    instructions: [
      'Fry curry paste in oil until fragrant',
      'Add chicken and cook until browned',
      'Pour in half the coconut milk and simmer',
      'Add vegetables and remaining coconut milk',
      'Season with fish sauce and palm sugar',
      'Simmer until vegetables are tender',
      'Garnish with Thai basil and serve with rice'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    sourceUrl: 'https://example.com/thai-curry',
    lastCookedDate: '2026-02-01',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z'
  },
  {
    id: '3',
    title: 'Margherita Pizza',
    ingredients: [
      'Pizza dough (store-bought or homemade)',
      '200g tomato sauce',
      '250g fresh mozzarella',
      'Fresh basil leaves',
      'Olive oil',
      'Salt'
    ],
    instructions: [
      'Preheat oven to 250°C (480°F)',
      'Roll out pizza dough on floured surface',
      'Spread tomato sauce evenly',
      'Tear mozzarella and distribute on pizza',
      'Drizzle with olive oil',
      'Bake for 10-12 minutes until crust is golden',
      'Top with fresh basil leaves before serving'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    sourceUrl: 'https://example.com/margherita-pizza',
    lastCookedDate: undefined, // Never cooked
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z'
  },
  {
    id: '4',
    title: 'Classic Beef Tacos',
    ingredients: [
      '500g ground beef',
      'Taco shells',
      'Lettuce, shredded',
      'Tomatoes, diced',
      'Cheddar cheese, shredded',
      'Sour cream',
      'Taco seasoning',
      'Hot sauce (optional)'
    ],
    instructions: [
      'Brown ground beef in a large skillet',
      'Add taco seasoning and water per package instructions',
      'Simmer until thickened',
      'Warm taco shells in oven',
      'Fill shells with beef',
      'Top with lettuce, tomatoes, cheese, and sour cream',
      'Add hot sauce if desired'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    sourceUrl: 'https://example.com/beef-tacos',
    lastCookedDate: '2026-01-05',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z'
  },
  {
    id: '5',
    title: 'Greek Salad',
    ingredients: [
      'Romaine lettuce',
      'Cucumber, diced',
      'Tomatoes, diced',
      'Red onion, sliced',
      '200g feta cheese, cubed',
      'Kalamata olives',
      'Olive oil',
      'Red wine vinegar',
      'Oregano'
    ],
    instructions: [
      'Chop lettuce and place in large bowl',
      'Add cucumber, tomatoes, and red onion',
      'Top with feta cheese and olives',
      'Drizzle with olive oil and red wine vinegar',
      'Sprinkle with oregano',
      'Toss gently and serve immediately'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    sourceUrl: 'https://example.com/greek-salad',
    lastCookedDate: '2026-01-25',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z'
  }
];

/**
 * Get a single mock recipe by ID
 */
export function getMockRecipeById(id: string): Recipe | undefined {
  return mockRecipes.find(recipe => recipe.id === id);
}

/**
 * Search mock recipes by title or ingredients
 */
export function searchMockRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return mockRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(lowerQuery) ||
    recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery))
  );
}
