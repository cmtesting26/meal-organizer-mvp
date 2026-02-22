# V1.3 Performance Profile

*Sprint 14 — S14-08 · 2026-02-14*

## Bundle Size (Production Build)

| Chunk | Raw | Gzipped |
|---|---|---|
| Main bundle (`index.js`) | 835 KB | 257 KB |
| CSS | 40 KB | 7.5 KB |
| RecipeDetail (lazy) | 17 KB | 5.8 KB |
| Settings (lazy) | 24 KB | 6.5 KB |
| SharedRecipeView (lazy) | 5 KB | 1.6 KB |
| **Total** | **928 KB** | **280 KB** |

**Note**: Main bundle exceeds 500KB warning threshold. Tesseract.js is dynamically loaded at OCR runtime (not included in initial bundle). Primary optimization opportunities: code-split the recipe parser chain, tree-shake unused date-fns locales.

## Build Performance

| Metric | Value |
|---|---|
| Production build time | 10.1s |
| TypeScript compilation | Clean (0 errors) |
| Source code | 13,404 lines (68 files) |
| Test code | 6,869 lines (26 files) |

## Test Suite Performance

| Metric | Value |
|---|---|
| Total tests | 503 |
| Test files | 26 |
| Pass rate | 100% |
| Total duration | 43.6s |
| Actual test execution | 3.2s |
| Environment setup | 84.6s (jsdom overhead) |

The vast majority of test time is jsdom environment initialization, not actual test execution. Tests themselves run in ~3.2s.

## Feature Latency Estimates

### OCR Pipeline (Photo Import)
| Step | Expected Latency |
|---|---|
| Image preprocessing (resize + grayscale) | 50–200ms |
| Claude Vision API (primary) | 2–5s (network dependent) |
| Tesseract.js OCR (fallback, first run) | 8–15s (downloads language data) |
| Tesseract.js OCR (subsequent) | 3–8s (cached worker) |
| OCR text → recipe parsing | <10ms |

### Social Media Import (Caption Parsing)
| Step | Expected Latency |
|---|---|
| oEmbed API fetch | 500ms–2s |
| CORS proxy fallback | 1–3s |
| Caption → recipe parsing | <5ms |

### Recipe URL Import
| Step | Expected Latency |
|---|---|
| Direct fetch | 500ms–2s |
| CORS proxy chain (up to 3 proxies) | 1–5s |
| Schema.org parsing | <20ms |
| Heuristic parsing | <50ms |

### Core UI
| Interaction | Target | Status |
|---|---|---|
| Recipe library render (100 recipes) | <100ms | ✅ |
| Search/filter (keystroke) | <50ms | ✅ |
| Recipe detail load | <200ms | ✅ |
| Recipe scaling (serving change) | <50ms | ✅ |
| IndexedDB read (single recipe) | <10ms | ✅ |
| IndexedDB bulk read (100 recipes) | <50ms | ✅ |

## Recommendations for V1.4+

1. **Code-split main bundle**: Dynamic import for import/export, social media, and OCR modules
2. **Tesseract worker pre-warming**: Load Tesseract worker on first visit to ImportSheet (not on button click)
3. **Image compression**: Compress uploaded photos to <500KB before sending to API
4. **IndexedDB pagination**: For libraries >500 recipes, implement virtual scrolling + cursor-based queries
