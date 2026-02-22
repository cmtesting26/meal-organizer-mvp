/**
 * Social Media Caption Parser Tests (Sprint 27)
 *
 * Tests parsing recipe data from Instagram/TikTok caption text
 */

import { describe, it, expect } from 'vitest';
import { parseSocialMediaRecipe, isSocialMediaUrl } from '@/lib/socialMediaParser';

describe('Social media URL detection', () => {
  it('detects Instagram URLs', () => {
    expect(isSocialMediaUrl('https://www.instagram.com/p/DRcy7fwDhQe/')).toBe(true);
    expect(isSocialMediaUrl('https://instagram.com/reel/abc123')).toBe(true);
  });

  it('detects TikTok URLs', () => {
    expect(isSocialMediaUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
  });

  it('rejects non-social URLs', () => {
    expect(isSocialMediaUrl('https://www.chefkoch.de/rezepte/123')).toBe(false);
    expect(isSocialMediaUrl('https://mobile.kptncook.com/recipe/abc')).toBe(false);
  });
});

describe('Instagram caption parsing — German recipe (Smashed Butterbeans)', () => {
  // Simulated HTML with the caption text in a meta tag + body text (how Instagram serves it)
  const captionText = `Das Must-Have für Netflix&Chill oder die Salatbowl! 🥗✨

Günstig, proteinreich und so lecker, dass du nicht genug bekommen kannst! 🌱💪

Diese Smashes Butterbeans könnten Teil deines Ernährungsplans in meinem 1:1 Coaching sein. Schau dir gerne die entsprechenden Highlights auf meinem Profil für weitere Infos an oder schreib mir eine DM 👌

Ich poste regelmäßig ähnliche vegane high protein Rezepte, also folge meinem Kanal @vegan_high_protein m nichts zu verpassen 🫶

Was brauchen wir:
1 Dose weiße Riesenbohnen
1 El Olivenöl
1 Tl Hefeflocken
1 Tl geräuchertes Paprikapulver
1 Tl Knoblauchpulver
1/2 Tl Kreuzkümmel
1/2 Tl Kurkuma
1/2 Tl Salz

Das Rezept:
1: Die Bohnen mit dem Öl und den Gewürzen vermengen
2: Auf einem Backblech verteilen und smashen
3: Wenn du möchtest kannst du noch etwas Olivenöl und Salz darübergeben (kein Muss)
4: für circa 20-25 Minuten bei 180 Grad Umluft backen
5: Pur genießen oder über deinen Salat geben

Die Nährwerte:
Kcal: 809
Fett: 27g
Kohlenhydrate: 73g
Eiweiß: 43g

#snackidee #veganersnack #knuspersnack #veganhighprotein`;

  // Real Instagram og:description format includes engagement stats prefix
  const ogDescription = `13K likes, 81 comments - vegan_high_protein on November 24, 2025: "${captionText}"`;
  
  const html = `<html><head>
    <meta property="og:title" content="Sören Manke | Vegan Online Coach on Instagram: &quot;Das Must-Have für Netflix&amp;Chill oder die Salatbowl! 🥗✨&quot;" />
    <meta property="og:description" content="${ogDescription.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="https://example.com/image.jpg" />
  </head><body><div>${captionText}</div></body></html>`;

  const result = parseSocialMediaRecipe(html, 'https://www.instagram.com/p/DRcy7fwDhQe/');

  it('succeeds', () => {
    expect(result.success).toBe(true);
  });

  it('extracts a meaningful title (not the og:title mess)', () => {
    expect(result.title).toBeTruthy();
    expect(result.title.length).toBeGreaterThan(5);
    expect(result.title.length).toBeLessThan(100);
    // Should NOT contain "on Instagram" or username
    expect(result.title).not.toContain('on Instagram');
    expect(result.title).not.toContain('vegan_high_protein');
  });

  it('extracts all ingredients', () => {
    expect(result.ingredients.length).toBeGreaterThanOrEqual(7);
    // Check key ingredients
    const joined = result.ingredients.join(' ');
    expect(joined).toContain('Riesenbohnen');
    expect(joined).toContain('Olivenöl');
    expect(joined).toContain('Hefeflocken');
    expect(joined).toContain('Paprikapulver');
    expect(joined).toContain('Salz');
  });

  it('does not include engagement stats (likes/comments) in ingredients', () => {
    for (const ing of result.ingredients) {
      expect(ing).not.toMatch(/likes?/i);
      expect(ing).not.toMatch(/comments?/i);
      expect(ing).not.toMatch(/^\d+[KkMm]/);
    }
  });

  it('does not include numbered instructions in ingredients', () => {
    for (const ing of result.ingredients) {
      // No ingredient should start with "1: Die Bohnen..." etc.
      expect(ing).not.toMatch(/^\d+\s*[:.)]\s*Die /);
      expect(ing).not.toMatch(/^\d+\s*[:.)]\s*Auf /);
      expect(ing).not.toMatch(/vermengen|smashen|backen/i);
    }
  });

  it('does not include hashtags or promotional text in ingredients', () => {
    for (const ing of result.ingredients) {
      expect(ing).not.toContain('#');
      expect(ing).not.toContain('Coaching');
      expect(ing).not.toContain('follow');
    }
  });

  it('extracts all instructions', () => {
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
    const joined = result.instructions.join(' ');
    expect(joined).toContain('Bohnen');
    expect(joined).toContain('smashen');
    expect(joined).toContain('180 Grad');
  });

  it('does not include nutrition data in instructions', () => {
    const joined = result.instructions.join(' ');
    expect(joined).not.toContain('Kcal');
    expect(joined).not.toContain('Fett');
    expect(joined).not.toContain('Kohlenhydrate');
  });

  it('extracts og:image', () => {
    expect(result.imageUrl).toBe('https://example.com/image.jpg');
  });
});

describe('English Instagram recipe caption', () => {
  const captionText = `Easy 10-Minute Garlic Butter Shrimp 🍤

Ingredients:
1 lb large shrimp, peeled
4 cloves garlic, minced
3 tbsp butter
1 tbsp olive oil
Red pepper flakes
Salt and pepper
Fresh parsley

Steps:
1. Heat butter and oil in a pan over medium-high heat
2. Add garlic and cook 30 seconds until fragrant
3. Add shrimp in a single layer, cook 2 min per side
4. Season with salt, pepper, and red pepper flakes
5. Garnish with parsley and serve immediately

#shrimp #easyrecipe #dinnerideas`;

  const html = `<html><head>
    <meta property="og:description" content="${captionText.replace(/"/g, '&quot;')}" />
  </head><body><div>${captionText}</div></body></html>`;

  const result = parseSocialMediaRecipe(html, 'https://www.instagram.com/p/ABC123/');

  it('succeeds with English recipe', () => {
    expect(result.success).toBe(true);
  });

  it('extracts ingredients', () => {
    expect(result.ingredients.length).toBeGreaterThanOrEqual(5);
    const joined = result.ingredients.join(' ');
    expect(joined).toContain('shrimp');
    expect(joined).toContain('garlic');
    expect(joined).toContain('butter');
  });

  it('extracts instructions', () => {
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
    const joined = result.instructions.join(' ');
    expect(joined).toContain('Heat butter');
    expect(joined).toContain('shrimp');
  });

  it('does not include hashtags in instructions', () => {
    for (const step of result.instructions) {
      expect(step).not.toContain('#');
    }
  });
});
