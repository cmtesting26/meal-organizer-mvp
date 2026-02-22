/**
 * Social Media Fetcher Tests (Sprint 13 — S13-10)
 *
 * Tests for: URL detection, oEmbed fetch, CORS proxy fallback,
 * private post detection, empty caption handling, error types.
 *
 * Implementation Plan Phase 18 · Roadmap V1.3 Epic 2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectSocialPlatform,
  isSocialMediaUrl,
  fetchSocialMediaPost,
} from '../../src/lib/socialMediaFetcher';
import type { SocialMediaFetchError } from '../../src/lib/socialMediaFetcher';

// ---------------------------------------------------------------------------
// URL Detection Tests
// ---------------------------------------------------------------------------

describe('Social Media URL Detection', () => {
  describe('detectSocialPlatform', () => {
    it('detects Instagram post URLs', () => {
      expect(detectSocialPlatform('https://www.instagram.com/p/ABC123/')).toBe('instagram');
      expect(detectSocialPlatform('https://instagram.com/p/ABC123/')).toBe('instagram');
      expect(detectSocialPlatform('http://www.instagram.com/p/ABC123/')).toBe('instagram');
    });

    it('detects Instagram reel URLs', () => {
      expect(detectSocialPlatform('https://www.instagram.com/reel/ABC123/')).toBe('instagram');
      expect(detectSocialPlatform('https://www.instagram.com/reels/ABC123/')).toBe('instagram');
    });

    it('detects Instagram short URLs', () => {
      expect(detectSocialPlatform('https://instagr.am/p/ABC123/')).toBe('instagram');
      expect(detectSocialPlatform('https://instagr.am/reel/ABC123/')).toBe('instagram');
    });

    it('detects TikTok video URLs', () => {
      expect(detectSocialPlatform('https://www.tiktok.com/@user/video/1234567890')).toBe('tiktok');
      expect(detectSocialPlatform('https://tiktok.com/@user.name/video/1234567890')).toBe('tiktok');
    });

    it('detects TikTok short/share URLs', () => {
      expect(detectSocialPlatform('https://vm.tiktok.com/ABC123/')).toBe('tiktok');
      expect(detectSocialPlatform('https://www.tiktok.com/t/ABC123/')).toBe('tiktok');
    });

    it('returns null for non-social URLs', () => {
      expect(detectSocialPlatform('https://www.allrecipes.com/recipe/123')).toBeNull();
      expect(detectSocialPlatform('https://google.com')).toBeNull();
      expect(detectSocialPlatform('https://instagram.com')).toBeNull(); // profile page, not a post
      expect(detectSocialPlatform('not a url')).toBeNull();
      expect(detectSocialPlatform('')).toBeNull();
    });

    it('returns null for Instagram profile URLs (not posts)', () => {
      expect(detectSocialPlatform('https://www.instagram.com/username/')).toBeNull();
      expect(detectSocialPlatform('https://www.instagram.com/explore/')).toBeNull();
    });

    it('returns null for YouTube URLs', () => {
      expect(detectSocialPlatform('https://www.youtube.com/watch?v=ABC123')).toBeNull();
    });
  });

  describe('isSocialMediaUrl', () => {
    it('returns true for supported URLs', () => {
      expect(isSocialMediaUrl('https://www.instagram.com/p/ABC123/')).toBe(true);
      expect(isSocialMediaUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
    });

    it('returns false for unsupported URLs', () => {
      expect(isSocialMediaUrl('https://www.google.com')).toBe(false);
      expect(isSocialMediaUrl('')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// fetchSocialMediaPost Tests
// ---------------------------------------------------------------------------

describe('fetchSocialMediaPost', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws unsupported_url error for non-social URLs', async () => {
    try {
      await fetchSocialMediaPost('https://www.google.com');
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as SocialMediaFetchError;
      expect(error.type).toBe('unsupported_url');
    }
  });

  it('extracts caption from TikTok oEmbed title', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'Easy pasta recipe! 🍝\n\nIngredients:\n2 cups pasta\n1 jar marinara\n\nInstructions:\n1. Boil pasta\n2. Add sauce\n3. Serve hot!',
        author_name: 'chef_test',
        thumbnail_url: 'https://example.com/thumb.jpg',
      }),
    } as Response);

    const result = await fetchSocialMediaPost('https://www.tiktok.com/@chef_test/video/1234567890');
    expect(result.platform).toBe('tiktok');
    expect(result.caption).toContain('Easy pasta recipe');
    expect(result.caption).toContain('Ingredients:');
    expect(result.postTitle).toBeDefined();
    expect(result.imageUrl).toBe('https://example.com/thumb.jpg');
    expect(result.sourceUrl).toBe('https://www.tiktok.com/@chef_test/video/1234567890');
  });

  it('falls back to HTML scraping when oEmbed fails', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        // oEmbed direct fails
        throw new Error('CORS blocked');
      }
      if (callCount === 2) {
        // oEmbed via proxy also fails
        throw new Error('Proxy failed for oEmbed');
      }
      // HTML scraping via proxy succeeds
      return {
        ok: true,
        text: async () => `
          <html>
            <head>
              <meta property="og:description" content="My amazing recipe! Ingredients: 2 cups flour, 1 egg, salt. Mix together and bake for 30 minutes." />
              <meta property="og:title" content="Chef Test Recipe" />
              <meta property="og:image" content="https://example.com/image.jpg" />
            </head>
          </html>
        `,
      } as Response;
    });

    const result = await fetchSocialMediaPost('https://www.tiktok.com/@chef/video/999999999');
    expect(result.caption).toContain('My amazing recipe');
    expect(result.platform).toBe('tiktok');
  });

  it('throws empty_caption when no caption text is found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: '',
        author_name: 'user',
        thumbnail_url: 'https://example.com/thumb.jpg',
      }),
      text: async () => '<html><head><meta property="og:description" content="short" /></head></html>',
    } as unknown as Response);

    try {
      await fetchSocialMediaPost('https://www.tiktok.com/@user/video/1234567890');
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as SocialMediaFetchError;
      expect(error.type).toBe('empty_caption');
    }
  });

  it('throws network_error when all fetch methods fail', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      await fetchSocialMediaPost('https://www.tiktok.com/@user/video/1234567890');
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as SocialMediaFetchError;
      expect(error.type).toBe('network_error');
    }
  });
});
