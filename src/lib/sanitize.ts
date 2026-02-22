/**
 * Input Sanitization Utilities (Sprint 6)
 *
 * Provides DOMPurify-based HTML sanitization and URL validation
 * for recipe imports and user inputs.
 *
 * @module sanitize
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Used when rendering imported recipe content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Strip all HTML tags and return plain text.
 * Used for recipe titles and ingredients.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate a URL for recipe import.
 * Ensures it's a valid HTTP/HTTPS URL and not a local resource.
 */
export function isValidRecipeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Block local/private addresses
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input for search queries.
 * Trims whitespace and removes potentially dangerous characters.
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[<>{}]/g, '');
}
