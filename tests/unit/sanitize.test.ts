/**
 * Unit Tests for Sanitization Module (Sprint 6)
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, stripHtml, isValidRecipeUrl, sanitizeSearchQuery } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe tags', () => {
    const input = '<b>Bold</b> and <em>italic</em>';
    expect(sanitizeHtml(input)).toBe('<b>Bold</b> and <em>italic</em>');
  });

  it('strips script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeHtml(input)).toBe('Hello  World');
  });

  it('strips onclick attributes', () => {
    const input = '<b onclick="alert(1)">Click</b>';
    expect(sanitizeHtml(input)).toBe('<b>Click</b>');
  });

  it('strips iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>';
    expect(sanitizeHtml(input)).toBe('');
  });

  it('allows list elements', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    expect(sanitizeHtml(input)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
  });
});

describe('stripHtml', () => {
  it('removes all HTML tags', () => {
    const input = '<b>Bold</b> and <a href="x">link</a>';
    expect(stripHtml(input)).toBe('Bold and link');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('isValidRecipeUrl', () => {
  it('accepts valid https URLs', () => {
    expect(isValidRecipeUrl('https://www.allrecipes.com/recipe/123')).toBe(true);
  });

  it('accepts valid http URLs', () => {
    expect(isValidRecipeUrl('http://example.com/recipe')).toBe(true);
  });

  it('rejects localhost', () => {
    expect(isValidRecipeUrl('http://localhost:3000')).toBe(false);
  });

  it('rejects 127.0.0.1', () => {
    expect(isValidRecipeUrl('http://127.0.0.1/test')).toBe(false);
  });

  it('rejects private IPs', () => {
    expect(isValidRecipeUrl('http://192.168.1.1/recipe')).toBe(false);
    expect(isValidRecipeUrl('http://10.0.0.1/recipe')).toBe(false);
  });

  it('rejects .local domains', () => {
    expect(isValidRecipeUrl('http://myserver.local/recipe')).toBe(false);
  });

  it('rejects ftp protocol', () => {
    expect(isValidRecipeUrl('ftp://example.com/recipe')).toBe(false);
  });

  it('rejects javascript protocol', () => {
    expect(isValidRecipeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidRecipeUrl('not a url')).toBe(false);
    expect(isValidRecipeUrl('')).toBe(false);
  });
});

describe('sanitizeSearchQuery', () => {
  it('trims whitespace', () => {
    expect(sanitizeSearchQuery('  hello  ')).toBe('hello');
  });

  it('removes angle brackets', () => {
    expect(sanitizeSearchQuery('<script>alert</script>')).toBe('scriptalert/script');
  });

  it('removes curly braces', () => {
    expect(sanitizeSearchQuery('{test}')).toBe('test');
  });

  it('keeps normal search terms', () => {
    expect(sanitizeSearchQuery('pasta carbonara')).toBe('pasta carbonara');
  });
});
