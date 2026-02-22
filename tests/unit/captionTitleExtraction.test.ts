import { describe, it, expect } from 'vitest';
import { parseCaptionToRecipe } from '../../src/lib/captionRecipeParser';

describe('Instagram long title fix', () => {
  it('does not use full caption as title when postTitle is very long', () => {
    const longPostTitle = '50 30 EP. 16 Crispy Chicken & Leek-y Beans 55g Protein | 639 Cal | 32 Fat | 34 Carbs The final episode of S1 - hold tight for Season 2! INGREDIENTS FOR 2 For the chicken 400g chicken thighs, skin-on and boneless Salt and pepper';
    const caption = `50 30 EP. 16 Crispy Chicken & Leek-y Beans\n\nINGREDIENTS FOR 2\n400g chicken\nSalt and pepper\n\nMETHOD\nSeason with salt.\nCook the chicken.`;

    const result = parseCaptionToRecipe(caption, { postTitle: longPostTitle });
    expect(result.title.length).toBeLessThan(120);
    expect(result.title).toContain('Crispy Chicken');
  });

  it('uses short postTitle normally', () => {
    const result = parseCaptionToRecipe('Some caption', {
      postTitle: 'My Amazing Pasta | TikTok',
    });
    expect(result.title).toBe('My Amazing Pasta');
  });

  it('falls back to caption first line when postTitle is a username', () => {
    const result = parseCaptionToRecipe(
      `Crispy Chicken & Leek-y Beans\n\nIngredients:\n400g chicken\n\nMethod:\nCook it.`,
      { postTitle: 'finn_tonry' }
    );
    expect(result.title).toContain('Crispy Chicken');
  });

  it('caps postTitle at 120 chars', () => {
    const result = parseCaptionToRecipe('Test caption\nIngredients:\n1 egg', {
      postTitle: 'A'.repeat(200),
    });
    expect(result.title.length).toBeLessThan(120);
  });
});

describe('HTML entity and invisible char handling', () => {
  it('strips invisible separator chars (U+2063) from ingredient lines', () => {
    const caption = `Test Recipe\n\nIngredients:\n300ml good red wine\u2063\n500ml beef stock\u2063\n150g bacon\u2063\n\nMethod:\nCook everything.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    expect(result.ingredients[0]).toBe('300ml good red wine');
    expect(result.ingredients[0]).not.toContain('\u2063');
  });

  it('strips zero-width spaces from lines', () => {
    const caption = `Recipe\n\nIngredients:\n2\u200B cups flour\n1 egg\n\nSteps:\nMix and bake.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.ingredients[0]).toBe('2 cups flour');
  });
});

describe('Auto-switch from ingredients to instructions', () => {
  it('detects numbered instructions within ingredient section (no method header)', () => {
    const caption = `Beef Bourguignon

INGREDIENTS FOR 2
1.2 kg beef chuck, cut into chunks
300ml good red wine
500ml rich beef stock
150g smoked bacon lardons
2 onions, diced
3 carrots, sliced thick
4 garlic cloves, minced
2 tbsp tomato puree
Sea salt and freshly cracked black pepper

1. Pat the beef dry and season generously
2. Sear the beef in batches until deeply browned
3. Cook the bacon until crispy
4. Finish and serve`;

    const result = parseCaptionToRecipe(caption);
    expect(result.success).toBe(true);
    // Ingredients should NOT contain "Finish and serve"
    const ingredientText = result.ingredients.join(' ');
    expect(ingredientText).not.toContain('Finish and serve');
    expect(ingredientText).not.toContain('Pat the beef');
    // Instructions should contain them
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
    expect(result.instructions.some(i => i.includes('Finish and serve'))).toBe(true);
    // First ingredient should be present
    expect(result.ingredients.some(i => i.includes('beef chuck'))).toBe(true);
  });

  it('handles "INGREDIENTS FOR 2" header format', () => {
    const caption = `Recipe Title\n\nINGREDIENTS FOR 2\n400g pasta\n1 onion\n\nMETHOD\nBoil pasta.\nChop onion.`;
    const result = parseCaptionToRecipe(caption);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.ingredients[0]).toContain('pasta');
  });
});

describe('German recipe without section headers', () => {
  it('correctly separates ▫️ bullet ingredients from instruction sentences', () => {
    const caption = `SZEGEDINER GULASCH - Leckerer Klassiker

▫️1 kg Rindfleisch (z. B. Rouladenfleisch oder Schmorfleisch, in Streifen geschnitten)
▫️Butterschmalz
▫️3 Zwiebeln (in Streifen)
▫️300g Bauchspeck, in Würfel
▫️6-8 Gewürzgurken, in Scheiben
▫️2 EL Senf, mittelscharf
▫️2 EL Tomatenmark
▫️200ml Rotwein
▫️2 TL Paprika edelsüß
▫️1,2l Rinderfond
▫️Etwas Gewürzgurkenwasser
▫️Salz & Pfeffer
▫️1 TL Majoran
▫️2 Lorbeerblätter
▫️3 Karotten, in Würfel
▫️1kg Kartoffeln, in Würfel
▫️2 TL Speisestärke (mit kaltem Wasser angerührt)

Fleisch in Streifen schneiden und scharf anbraten.
Speck, Zwiebeln in den Topf geben und Braten.
Senf und Tomatenmark dazugeben und anschwitzen.
Mit Rotwein ablöschen.
Rinderfond dazugeben und 1,5 Stunden köcheln lassen.
Gewürzgurken und Gurkenwasser dazugeben.
Kartoffel- und Karottenwürfel jetzt dazugeben und weitere 45min. weiter köcheln.
Mit Speisestärke andicken.

Guten Appetit! Speichern für später!
#gulasch #rezept #deutsch`;

    const r = parseCaptionToRecipe(caption);
    expect(r.ingredients).toHaveLength(17);
    expect(r.ingredients[4]).toBe('6-8 Gewürzgurken, in Scheiben');
    expect(r.ingredients[9]).toBe('1,2l Rinderfond');
    // No instructions leaked into ingredients
    const ingredientText = r.ingredients.join('|');
    expect(ingredientText).not.toContain('geben');
    expect(ingredientText).not.toContain('köcheln');
    // Instructions present
    expect(r.instructions.length).toBeGreaterThanOrEqual(6);
    // End markers filtered
    expect(r.instructions.every(i => !i.includes('Appetit'))).toBe(true);
  });
});
