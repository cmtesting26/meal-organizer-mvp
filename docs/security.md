# Security Documentation

## Overview

Meal Organizer follows security best practices for a client-side web application. No sensitive data is collected or stored.

## Input Sanitization

### HTML Sanitization (DOMPurify)
All imported recipe content is sanitized before rendering:
- `sanitizeHtml()` — allows only safe tags (b, i, em, strong, br, p, lists)
- `stripHtml()` — removes all HTML, returns plain text
- Used in recipe parser output before saving to IndexedDB

### URL Validation
Recipe import URLs are validated before fetching:
- Must be HTTP or HTTPS protocol
- Blocks localhost, private IPs (192.168.x, 10.x), .local domains
- See `src/lib/sanitize.ts`

### Search Input
Search queries are sanitized to remove angle brackets and braces.

## Security Headers

Configured in `netlify.toml`:

| Header | Value | Purpose |
|---|---|---|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Limits referrer info |
| Permissions-Policy | camera=(), microphone=() ... | Disables unused APIs |
| Content-Security-Policy | default-src 'self' ... | Restricts resource loading |

## XSS Prevention

- React escapes strings by default in JSX
- DOMPurify sanitizes any HTML from recipe imports
- No use of `dangerouslySetInnerHTML` without sanitization
- CSP header restricts script sources to 'self'

## Data Security

- No passwords or PII stored
- No API keys in client code
- No cookies used
- Data stored in IndexedDB (browser-local, not encrypted by default)
- HTTPS enforced by Netlify

## Dependency Security

- Run `npm audit` regularly
- Keep dependencies updated
- Minimal dependency footprint
