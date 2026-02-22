/**
 * Caption-to-Recipe Parser Tests (Sprint 13 — S13-11)
 *
 * Tests for: emoji bullet ingredients, numbered instruction lists,
 * section headers (EN + DE), mixed commentary handling, title extraction,
 * edge cases, and parse success detection.
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

import { describe, it, expect } from 'vitest';
import { parseCaptionToRecipe } from '../../src/lib/captionRecipeParser';

// ---------------------------------------------------------------------------
// Title Extraction
// ---------------------------------------------------------------------------

describe('Caption Parser — Title Extraction', () => {
  it('uses oEmbed postTitle when provided', () => {
    const result = parseCaptionToRecipe('Some caption text with ingredients', {
      postTitle: 'My Amazing Pasta | TikTok',
    });
    expect(result.title).toBe('My Amazing Pasta');
  });

  it('strips "on Instagram" suffix from postTitle', () => {
    const result = parseCaptionToRecipe('Caption text', {
      postTitle: '@chef_test on Instagram: "Best cake ever"',
    });
    // Should clean up the title
    expect(result.title).not.toContain('on Instagram');
  });

  it('extracts title from first non-empty caption line when no postTitle', () => {
    const caption = `Creamy Garlic Pasta

Ingredients:
2 cups pasta
3 cloves garlic

Instructions:
1. Cook pasta
2. Sauté garlic`;

    const result = parseCaptionToRecipe(caption);
    expect(result.title).toBe('Creamy Garlic Pasta');
  });

  it('falls back to "Social Media Recipe" when no title found', () => {
    const result = parseCaptionToRecipe('#food #recipe #yummy');
    expect(result.title).toBe('Social Media Recipe');
  });
});

// ---------------------------------------------------------------------------
// Section Header Detection (EN)
// ---------------------------------------------------------------------------

describe('Caption Parser — English Section Headers', () => {
  it('parses "Ingredients:" and "Instructions:" headers', () => {
    const caption = `Best Brownies

Ingredients:
2 cups flour
1 cup sugar
3 eggs

Instructions:
1. Mix dry ingredients
2. Add eggs and stir
3. Bake at 350°F for 25 minutes`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0]).toBe('2 cups flour');
    expect(result.instructions).toHaveLength(3);
    expect(result.instructions[0]).toContain('Mix dry ingredients');
  });

  it('handles "What you\'ll need:" header', () => {
    const caption = `Simple Soup

What you'll need:
1 onion
2 carrots
500ml broth

Steps:
Dice onion and carrots
Add to broth
Simmer for 20 minutes`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.instructions.length).toBeGreaterThanOrEqual(2);
  });

  it('handles "Method:" header for instructions', () => {
    const caption = `Quick Salad

Ingredients
Mixed greens
1 tomato
olive oil

Method
Wash greens and chop tomato
Drizzle with olive oil
Toss and serve`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.instructions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Section Header Detection (DE)
// ---------------------------------------------------------------------------

describe('Caption Parser — German Section Headers', () => {
  it('parses "Zutaten:" and "Zubereitung:" headers', () => {
    const caption = `Kartoffelsuppe

Zutaten:
500g Kartoffeln
1 Zwiebel
200ml Sahne
Salz und Pfeffer

Zubereitung:
Kartoffeln und Zwiebel schälen und würfeln
In einem Topf mit Wasser kochen
Pürieren und Sahne hinzufügen
Mit Salz und Pfeffer abschmecken`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
    expect(result.ingredients[0]).toBe('500g Kartoffeln');
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
  });

  it('handles "Anleitung:" header', () => {
    const caption = `Omas Pfannkuchen

Zutaten
250g Mehl
3 Eier
500ml Milch

Anleitung
Mehl und Eier vermengen
Milch hinzufügen und glattrühren
In der Pfanne goldbraun backen`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
    expect(result.instructions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Emoji Bullet Ingredients
// ---------------------------------------------------------------------------

describe('Caption Parser — Emoji Bullets', () => {
  it('parses emoji-bulleted ingredient lists', () => {
    const caption = `🍝 Quick Pasta

🧅 1 onion, diced
🧄 3 cloves garlic
🥫 1 can crushed tomatoes
🧀 100g parmesan
🧂 salt and pepper

Cook pasta. Sauté onion and garlic. Add tomatoes. Season and top with parmesan.`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(4);
    // Emoji should be stripped
    expect(result.ingredients[0]).not.toMatch(/🧅/);
    expect(result.ingredients[0]).toContain('onion');
  });

  it('handles mixed emoji and text bullets', () => {
    const caption = `Easy Smoothie

• 1 banana
🫐 1 cup blueberries
- 1 cup milk
▸ 2 tbsp honey

Blend everything together until smooth. Serve cold.`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Numbered Lists
// ---------------------------------------------------------------------------

describe('Caption Parser — Numbered Lists', () => {
  it('strips number prefixes from instructions', () => {
    const caption = `Scrambled Eggs

Ingredients:
3 eggs
1 tbsp butter
salt

Instructions:
1. Melt butter in a pan over medium heat
2. Whisk eggs and pour into pan
3. Stir gently until set
4. Season with salt and serve`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.instructions[0]).not.toMatch(/^1\./);
    expect(result.instructions[0]).toContain('Melt butter');
  });

  it('handles number-prefixed ingredients', () => {
    const caption = `Recipe

Ingredients:
1) 2 cups flour
2) 1 cup sugar
3) 3 eggs

Directions:
1) Mix flour and sugar
2) Add eggs
3) Bake at 180°C`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients[0]).toContain('cups flour');
  });
});

// ---------------------------------------------------------------------------
// Mixed Commentary
// ---------------------------------------------------------------------------

describe('Caption Parser — Mixed Commentary', () => {
  it('ignores social media boilerplate at the end', () => {
    const caption = `Banana Bread

Ingredients:
3 ripe bananas
2 cups flour
1 cup sugar

Instructions:
Mash bananas. Mix in flour and sugar. Bake at 350°F.

Follow for more recipes! 🙌
Save this for later! 💾
#bananabread #recipe #baking #homemade`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    // Should not include "Follow for more" or hashtags in the recipe
    const allContent = [...result.ingredients, ...result.instructions].join(' ');
    expect(allContent).not.toContain('Follow');
    expect(allContent).not.toContain('#bananabread');
  });

  it('ignores narrative commentary between sections', () => {
    const caption = `My Grandma's Secret Cookie Recipe 🍪

This has been in our family for generations!

Ingredients:
2 cups flour
1 cup butter
1 cup chocolate chips

The trick is to not overmix!

Instructions:
Cream butter and sugar.
Fold in flour and chocolate chips.
Bake at 375°F for 12 minutes.

Made these for my friend's birthday and everyone loved them!`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
    // Ingredients section should contain the actual ingredients
    expect(result.ingredients.some(i => i.includes('flour'))).toBe(true);
    expect(result.ingredients.some(i => i.includes('butter'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Heuristic-Only Parsing (No Headers)
// ---------------------------------------------------------------------------

describe('Caption Parser — Heuristic Mode (No Headers)', () => {
  it('identifies ingredients by quantity patterns', () => {
    const caption = `Simple Pancakes

2 cups flour
2 eggs
1 cup milk
1 tbsp sugar
pinch of salt

Mix everything together. Cook on a griddle until golden. Flip and cook the other side.`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
    // Quantities should be detected
    expect(result.ingredients.some(i => i.includes('flour'))).toBe(true);
  });

  it('identifies instructions by action verbs', () => {
    const caption = `Quick Dinner

1 chicken breast
2 cups rice
some soy sauce

Season the chicken and grill for 5 minutes per side. Cook rice according to package. Drizzle with soy sauce and serve.`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.instructions.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('Caption Parser — Edge Cases', () => {
  it('handles empty caption', () => {
    const result = parseCaptionToRecipe('');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('handles caption with only hashtags', () => {
    const result = parseCaptionToRecipe('#food #recipe #cooking #yummy');
    expect(result.success).toBe(false);
  });

  it('handles very short caption', () => {
    const result = parseCaptionToRecipe('Yum!');
    expect(result.success).toBe(false);
  });

  it('handles caption with only instructions (no ingredients)', () => {
    const caption = `Quick tip:
Preheat oven to 400°F.
Roast vegetables for 30 minutes.
Season to taste.`;

    const result = parseCaptionToRecipe(caption);
    // Should still succeed — has at least instructions
    expect(result.success).toBe(true);
    expect(result.instructions.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves sourceUrl and imageUrl from options', () => {
    const caption = `Ingredients:
1 cup water
Instructions:
Boil the water.`;

    const result = parseCaptionToRecipe(caption, {
      sourceUrl: 'https://instagram.com/p/ABC',
      imageUrl: 'https://example.com/img.jpg',
    });
    expect(result.sourceUrl).toBe('https://instagram.com/p/ABC');
    expect(result.imageUrl).toBe('https://example.com/img.jpg');
  });

  it('handles Windows-style line endings', () => {
    const caption = "Test Recipe\r\n\r\nIngredients:\r\n1 cup flour\r\n2 eggs\r\n\r\nInstructions:\r\nMix and bake.";
    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Real-World Caption Samples (S13-12 accuracy tests)
// ---------------------------------------------------------------------------

describe('Caption Parser — Real-World Samples', () => {
  it('parses TikTok-style recipe with emoji bullets', () => {
    const caption = `CREAMY TUSCAN CHICKEN 🍗✨

🫒 2 tbsp olive oil
🍗 4 chicken thighs
🧄 4 cloves garlic, minced
🍅 1 cup sun-dried tomatoes
🥬 3 cups spinach
🧀 ½ cup parmesan
🥛 1 cup heavy cream

1. Season chicken and sear in olive oil until golden
2. Remove chicken, add garlic and sun-dried tomatoes
3. Pour in cream and bring to a simmer
4. Add spinach and parmesan, stir until wilted
5. Return chicken to pan and cook 5 more min

Save this! 💾 Tag someone who needs this recipe! 
#tuscanchicken #recipe #easyrecipe #dinner`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.title).toContain('CREAMY TUSCAN CHICKEN');
    expect(result.ingredients.length).toBeGreaterThanOrEqual(5);
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
  });

  it('parses Instagram-style recipe with casual format', () => {
    const caption = `The easiest banana bread you'll ever make! 🍌

Here's what you need:
3 ripe bananas (the browner the better!)
⅓ cup melted butter
¾ cup sugar
1 egg, beaten
1 tsp vanilla
1 tsp baking soda
a pinch of salt
1½ cups all-purpose flour

How to make it:
Preheat oven to 350°F.
Mash bananas with a fork.
Mix in melted butter, sugar, egg, and vanilla.
Sprinkle in baking soda and salt, then mix in flour.
Pour into a greased loaf pan.
Bake for 60-65 minutes.

Trust me, your kitchen will smell AMAZING! 😍

Follow @bakingqueen for more!
#bananabread #baking #homemade`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(6);
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
  });

  it('parses German-language recipe caption', () => {
    const caption = `Omas Kartoffelsuppe 🥔🥣

Zutaten:
1 kg Kartoffeln
2 Zwiebeln
200ml Sahne
1 Bund Petersilie
Salz und Pfeffer
2 EL Butter

Zubereitung:
Kartoffeln schälen und in Würfel schneiden.
Zwiebeln in Butter anschwitzen.
Kartoffeln dazugeben und mit Wasser bedecken.
20 Minuten kochen lassen, dann pürieren.
Sahne einrühren und mit Salz und Pfeffer abschmecken.
Mit Petersilie garnieren.

Guten Appetit! 😋
Speichern für später! 💾
#kartoffelsuppe #deutsch #rezept`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(5);
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
    expect(result.ingredients.some(i => i.includes('Kartoffeln'))).toBe(true);
  });

  it('parses minimal TikTok recipe (very short format)', () => {
    const caption = `3 ingredient cookies 🍪

1 cup peanut butter
1 cup sugar
1 egg

Mix together, roll into balls, bake 350°F 10 min!

#3ingredients #cookies #easy`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(3);
  });

  it('handles recipe with ingredients on same line (comma-separated)', () => {
    const caption = `Super Quick Stir Fry

Ingredients: 1 lb chicken, 2 cups rice, soy sauce, garlic, ginger

Heat oil. Cook chicken until done. Add garlic and ginger. Stir in soy sauce. Serve over rice.`;

    const result = parseCaptionToRecipe(caption);
    // This is a harder case — comma-separated ingredients on one line
    // The parser might treat the whole line as one ingredient, which is still valid
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Inline Bullet Splitting
// ---------------------------------------------------------------------------

describe('Caption Parser — Inline Bullet Splitting', () => {
  it('splits ▫️-separated ingredients on a single line', () => {
    const caption = `Recipe Title\n\nZUTATEN\n\n▫️1 kg Rindfleisch▫️Butterschmalz▫️3 Zwiebeln▫️300g Bauchspeck▫️6-8 Gewürzgurken▫️2 EL Senf\n\nZUBEREITUNG\n\nAlles kochen und servieren.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.ingredients.length).toBe(6);
    expect(result.ingredients[0]).toContain('Rindfleisch');
    expect(result.ingredients[4]).toContain('Gewürzgurken');
  });

  it('splits •-separated ingredients on a single line', () => {
    const caption = `Test Recipe\n\nIngredients\n\n•2 cups flour•1 cup sugar•3 eggs•1 tsp vanilla\n\nMethod\n\nMix everything and bake at 350F.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.ingredients.length).toBe(4);
  });

  it('does not split when bullets are at line start with newlines', () => {
    const caption = `Test\n\nIngredients:\n▫️flour\n▫️sugar\n▫️eggs\n\nSteps:\nMix and bake.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.ingredients.length).toBe(3);
  });
});
