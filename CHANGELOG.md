# Changelog

All notable changes to Fork and Spoon are documented here.

## [1.6.2] - 2026-02-20 — Share Link Hotfix

### Bug Fixes
- **Desktop share links now work:** Share URL was pointing to `/recipe/:id` (auth-required route) instead of `/recipe/shared/:id` (public route), causing "Recipe not found" for recipients
- **Mobile/PWA share links now work:** Share targets that ignore the Web Share API `url` field (common on Android) were receiving only the recipe title as text, causing a Google search instead of navigation to the app
- **Clipboard copy is a clean URL:** "Copy" option now copies only the raw share link (no title prefix), so it can be pasted directly into a browser
- **Photo uploads now persist across page refreshes:** When Supabase Storage isn't configured, photos were saved as blob URLs which are session-scoped and die on refresh. Now converts to compressed base64 data URLs that survive in IndexedDB
- **Recipe detail no longer shows empty gray box for broken images:** When an image fails to load, the entire hero container collapses instead of showing a tall empty placeholder
- Updated regression tests for share URL path, clipboard copy, and photo persistence

## [1.6.1] - 2026-02-20 — V1.6 Polish (Sprint 26)

### Detail Page
- Removed ingredient count and step count from stats row (cleaner layout)
- CookFrequency component hidden when recipe has never been cooked (avoids redundancy with RecencyBadge)
- "Start Cooking" button constrained to content container width (matches content above)

### Library Page
- Reduced top padding for tighter layout
- Sticky header uses theme-aware background color (was hardcoded gray)
- Year label moved from subtitle into each card's cook count badge ("Cooked 5× in 2026")
- RecencyBadge restored on RecipeCard (was lost during Sprint 23 compact redesign)

### Cooking Mode
- Improved ingredient-to-step matching: extracts individual keywords from compound ingredients, uses word-boundary matching for all terms (fixes misses like "parsley" from "1 bunch fresh parsley, chopped")
- Removed "Swipe to navigate" hint text
- Full-screen swipe gestures: swipe anywhere on the cooking mode screen (ingredients panel, instruction panel) to navigate steps

### Schedule Modal
- RecipePicker sorted by cook count descending (most cooked in 2026 first), then recency, with never-cooked at bottom
- Cook count flame badge shown on each recipe row in picker ("5× in 2026")

### Splash / Loading
- Splash screen extended to 3 seconds visible (was ~900ms)
- Logo rendered with circular clip (removes white rectangular frame)
- Post-splash loading spinner uses amber brand color (was gray)

### Testing & Quality
- 37 new Sprint 26 tests covering all changes
- Updated 7 existing tests to reflect Sprint 26 behavior changes
- Total: 1,486 tests across 48 test files, all passing
- TypeScript compilation clean

## [1.6.0] - 2026-02-19 — V1.6 "Timer & Photos" Release (Sprint 25)

### Cooking Timer (Epic 5)
- Auto-suggest timer: parses step text for time references ("8 minutes", "1 hour 30 min", "8-10 minutes") with 80%+ accuracy
- Timer UI: large countdown display, ±30s adjustment controls, progress bar, pulse animation at ≤10 seconds
- Audible alert via Web Audio API (3 beeps at 0:00)
- Timer persists across step navigation — switching steps doesn't reset an active timer
- Instant exit: X button and Escape key exit cooking mode immediately (no confirmation dialog)
- Cooking mode follows global light/dark theme via CSS custom properties (no hardcoded dark)
- V1.6 ingredients panel styling: amber section labels, bullet dots, 22px step text, themed navigation buttons

### Photo Upload (Epic 6)
- "Add Photo" button on Recipe Detail with dropdown menu (Take Photo / Upload File)
- Camera capture support on mobile devices
- Client-side image compression: max 800px width, JPEG at 80% quality, ≤200KB target
- Thumbnail generation (200px width) for optimized display
- Supabase Storage backend with household-scoped paths
- Optional photo field on manual recipe creation form with dashed placeholder and preview
- Graceful fallback to local preview when Supabase is not configured

### Testing & Quality
- 112 new Sprint 25 tests (timer parser, timer UI, cooking mode theme, exit behavior, photo upload, integration wiring)
- Total: 1,443 tests across 47 test files, all passing
- TypeScript compilation clean, build succeeds

## [1.5.0] - 2026-02-19 — V1.5 "Kitchen Companion" Release (Sprint 22)

### V1.5 Release — Testing, Polish & Sign-off
- Full V1.0–V1.5 regression test suite: 1,179 tests across 43 test files, all passing
- 114 new Sprint 22 regression tests covering every major feature area
- Dark mode WCAG AA contrast audit: all text/background combinations verified programmatically
- i18n completeness audit: EN↔DE parity confirmed, zero missing keys
- Accessibility audit: keyboard navigation, ARIA labels, focus indicators verified
- Cross-device infrastructure verified: touch sensors, safe-area-inset handling, responsive breakpoints
- Performance profiling: CSS custom properties for dark mode (zero JS overhead), efficient frequency queries
- Build succeeds with code splitting: 265KB gzipped main bundle + lazy-loaded routes
- Version bumped to 1.5.0 across package.json, PWA manifest, and export metadata
- Fixed minor duplicate JSDoc comment in recipeService.ts
- Zero bugs found during regression testing

## [1.4.9] - 2026-02-19 — V1.5 Dark Mode Polish + Household Feed + Meal Frequency (Sprint 21)

### Dark Mode Polish
- Adapted recency badge colors for dark mode with dedicated CSS custom properties (green, yellow, red, gray variants)
- Lightened amber accent to #FBBF24 for dark backgrounds
- Added reduced-motion support for theme transitions (prefers-reduced-motion: reduce)
- Added theme transition animation (200ms ease-in-out) with first-paint flash prevention
- Ensured body and #root background colors are set in both themes

### Household Feed ("New Since Last Login")
- Added `last_seen_at` column to Supabase users table (migration 004)
- Built `useNewRecipes` hook: queries recipes added by other household members since last login
- Auto-updates `last_seen_at` on app open (once per session)
- Added notification dot badge (8px red with ping animation) on Library tab
- Built `NewRecipesSection` component: highlights new recipes at top of Library with "New from [name]" labels
- Dismissible: badge clears and section hides after user opens Library
- Full i18n support (EN/DE)

### Meal Frequency Stats
- Built `useCookFrequency` hook: aggregates cook count from schedule entries (total, this month, this year)
- Added `CookFrequency` display component on Recipe Detail page ("Cooked 3× this month · 12× this year")
- Built pill-shaped `SegmentedControl` for Library: "All Recipes" | "Most Cooked"
- Built `MostCookedView`: ranks recipes by cook count with amber-tinted count badges and top-3 rank badges
- Full i18n support (EN/DE)

### Testing
- 37 new tests across 2 test files (dark mode polish + household feed/frequency)
- Full test suite: 1,074 tests passing, 42 test files, zero failures

## [1.7.0] - 2026-02-18 — V1.5 Bug Fixes + Cooking Mode Core (Sprint 19)

### Bug Fixes
- **Fix Recipe Detail header** (S19-01): Aligned padding, max-width, and spacing to match Schedule/Library header pattern (max-w-7xl, py-4, lg:px-8)
- **Fix share button URL** (S19-02): Share button now constructs and shares the in-app route URL (`/recipe/:id`) instead of the original source URL — clipboard fallback also uses in-app URL
- **Fix PWA bottom nav height on iOS** (S19-03): Safe-area-inset-bottom padding is now applied additively to the nav element (not squished inside the flex container), fixing cut-off icons and FAB on iOS standalone PWA
- **Remove multi-select icon from search bar** (S19-04): Removed the CheckSquare toggle button from Library search bar — long-press multi-select still works, cleaner UI

### New Features: Cooking Mode Core
- **Step parser utility** (S19-05): `src/lib/stepParser.ts` — Parses recipe instructions into individual steps, handling numbered lists, "Step X:" format, paragraph breaks, and single-string combined instructions
- **CookingMode split-layout** (S19-06): Full-screen dark cooking mode with ~30% ingredients panel (top) and ~70% instruction panel (bottom), step counter with progress dots, recipe title header, exit confirmation dialog
- **Step navigation** (S19-07): Swipe gesture (left/right) and Previous/Next buttons to navigate between cooking steps — disabled Previous on step 1, "Finish" button on last step, safe-area-aware bottom padding
- **Ingredient-to-step matching** (S19-08): `src/lib/ingredientMatcher.ts` — Scans step text for ingredient names with plural/singular handling, adjective stripping, and word-boundary-aware short-word matching to avoid false positives
- **Wake Lock API** (S19-09): `useWakeLock` hook keeps screen on during cooking mode, auto-re-acquires after visibility change, graceful fallback toast for unsupported browsers (Safari)
- **"Start Cooking" button** on Recipe Detail page launches cooking mode for any recipe with instructions
- **i18n**: All cooking mode strings added in both English and German

### Tests
- **28 new Sprint 19 tests**: Bug fix regression tests (header consistency, share URL, nav height, icon removal) + cooking mode core tests (step parser formats/edge cases, ingredient matcher with plurals/partials/boundaries, CookingMode component rendering/navigation/exit)
- **992 total tests passing**, zero regressions

## [1.6.0] - 2026-02-17 — V1.4 Release: Final Testing & Validation (Sprint 18)

### V1.4 Release Summary
Fork and Spoon V1.4 is the **Adoption & Polish** release, delivering a complete user experience for two-person households:
- **Onboarding flow** for new users (3-screen tour + invite-link path)
- **Navigation redesign** (3-item bottom nav with elevated FAB, full-screen bottom sheet with 4 import options)
- **Visual polish** (locale-aware schedule dates, compact Data Management, 16px mobile font, branded splash screen)
- **Full rebrand** from "Meal Organizer" to "Fork and Spoon" (PWA manifest, icons, all UI strings)
- **Bug fixes** (auth route, recency badge colors, tag hover state)

### Sprint 18: Testing & Validation
- **Comprehensive regression tests** (S18-01): 219 assertions verifying all V1.0–V1.4 features — recipe CRUD, schedule, import/export, tags, recency badges, auth, sync, OCR, social import, navigation redesign, onboarding, PWA rebrand
- **Cross-device audit** (S18-02): touch targets ≥44px, safe area handling, locale-aware date format, viewport-fit=cover
- **PWA install/update verification** (S18-03): manifest branding, icon assets on disk, index.html meta tags, splash screen session gating
- **Navigation + onboarding E2E** (S18-04): complete new user journey from first launch → onboarding → auth → app, invite-link path, skip button, Settings via header gear
- **i18n completeness audit** (S18-05): deep EN↔DE key parity check, t() call verification across all new components, zero "Meal Organizer" remnants
- **Export/import backward compatibility** (S18-06): legacy backup acceptance, Paprika/Recipe Keeper support, preview validation, DB name preservation
- **Performance profiling** (S18-08): lazy loading verified, session-gated splash/onboarding, Workbox caching, icon sizes reasonable
- **Accessibility audit** (S18-09): ARIA attributes on nav/sheets/buttons, focus trap in modals, keyboard navigation, color contrast verification
- **964 total tests passing**, zero regressions

### Changed
- Export appVersion updated to 1.6.0 (was 1.4.0)

## [1.6.0] - 2026-02-17 — V1.4 Onboarding + PWA Rebrand Completion (Sprint 17)

### Added
- **3-screen onboarding flow** (S17-01 to S17-04): full-screen slides with illustrations — Plan Your Week, Import Any Recipe, Cook Together
- **First-launch detection** (S17-05): localStorage flag, skip button on all screens, shows once per device
- **Invite-link user path** (S17-06): detects `?invite=` URL param, skips full tour, shows condensed feature highlights after account creation
- **Onboarding i18n** (S17-07): all strings in English and German
- **Onboarding illustrations** (S17-08): Lucide icon-based illustrations with colored circular backgrounds
- **PWA splash animation** (S17-11): SplashScreen now integrated into app entry, 400ms fade+scale per spec, session-gated (shows once per session)

### Changed
- **PWA manifest updated** (S17-09): background_color aligned to brand Warm Stone 50 (#FAFAF9), added `id` field, updated `includeAssets` to reference brand icons
- **In-app header** (S17-10): verified ForkAndSpoonLogo icon mark at 28px (already shipped Sprint 15)
- **Netlify metadata** (S17-12): site rename noted for dashboard update

### Tests
- 25 new tests: OnboardingScreen (7), OnboardingFlow (4), isOnboardingComplete (2), InviteHighlights (4), SplashScreen (5), ForkAndSpoonLogo (3)
- **699 total tests passing** (674 existing + 25 new), zero regressions

## [1.5.0] - 2026-02-17 — V1.4 Navigation Redesign + Visual Polish (Sprint 16)

### Added
- **3-item bottom navigation** (S16-01): Schedule (left), elevated "+" FAB (center), Library (right). FAB is 56px circular amber-600 with shadow, raised above nav bar per Design Spec V1.4
- **Full-screen bottom sheet** (S16-02): `FullScreenBottomSheet` component using Radix Dialog — slides up from bottom, rounded-t-[20px], shadow, drag handle, X close, focus trap, Escape to dismiss, 300ms animation
- **Add Recipe bottom sheet** (S16-03): 4 import option cards with amber icons — Import from Website (Globe), Instagram/TikTok (Share2), Scan Cookbook (Camera), Add Manually (PenLine)
- **Locale-aware schedule dates** (S16-08): `formatScheduleDay()` using date-fns locales — EN: "Tuesday, Feb 17th" / DE: "Dienstag, 17. Feb."
- **i18n strings** (S16-10): 16 new translation keys for bottom nav labels, bottom sheet options, and compact data management (EN + DE)
- **Sprint 16 tests**: 63 new tests (674 total) — BottomNav rendering/navigation/a11y (12), FullScreenBottomSheet open/close/a11y (5), AddRecipeSheet options/handlers/i18n (9), mobile font CSS (4), schedule date format EN/DE (7), DataManagement compact layout (8), i18n string completeness (8), visual consistency file checks (12)

### Changed
- **Settings moved to header** (S16-04): Gear icon in header instead of bottom nav tab. Bottom nav now has only 3 items
- **Navigation wiring** (S16-05): New BottomNav replaces old BottomTabs. FAB opens AddRecipeSheet which dispatches to Website/Social/Scan/Manual flows
- **Header simplified** (S16-06): Removed old "Add Recipe" header button — recipe adding now exclusively via FAB
- **Mobile font size** (S16-07): Body font bumped 14→16px on mobile (≤767px) to prevent iOS auto-zoom on input focus
- **Schedule date format** (S16-08): DayCard now shows full locale-aware date ("Monday, Feb 17th") instead of separate day name + month/day
- **Data Management compacted** (S16-09): Single card with heading + subtitle left, side-by-side Export/Import buttons right (was two separate cards)
- **Visual consistency** (S16-11): Amber accent color on FAB + import icons, consistent spacing, safe area padding

### Removed
- Old `BottomTabs.tsx` 2-tab component (replaced by `BottomNav` 3-item)
- Old `BottomSheetImportMockup.tsx` Sprint 15 design reference (replaced by real `AddRecipeSheet`)
- Old "Add Recipe" header button with PlusCircle icon
- Updated integration wiring tests to reference real Sprint 16 components instead of mockup

## [1.4.0] - 2026-02-17 — V1.4 Rebrand & Polish (Sprint 15)

### Fixed
- **Auth route white screen** (S15-01): /auth now renders full-screen outside app shell. Graceful redirect to home when Supabase not configured instead of broken auth forms
- **Recency badge colors** (S15-02): Updated to match Design Spec V1.4 — green-600, yellow-600, red-600 text (was -800). Gray "never cooked" badge uses stone-100/stone-500
- **Tag hover state** (S15-03): Removed text color change on hover. Now uses subtle background shift only (hover:bg-blue-150) per Design Spec V1.3

### Changed
- **Rebrand to "Fork and Spoon"**: Standardized all user-facing strings from "Meal Organizer" and "Fork & Spoon" (ampersand) to official "Fork and Spoon" product name
- **i18n (EN/DE)**: All 8 occurrences per language updated to "Fork and Spoon"
- **index.html**: Title, meta description, og:title, apple-mobile-web-app-title updated with em-dash separator
- **PWA manifest**: `name` → "Fork and Spoon", `short_name` → "Fork & Spoon" (space-constrained)
- **CORS proxy**: User-agent updated to ForkAndSpoon-Bot/1.4, header comment updated
- **Backward compatibility**: localStorage key, IndexedDB name, and GitHub/Cloudflare URLs preserved. Import accepts both "Fork and Spoon" and "Meal Organizer" backup files

### Added
- **Brand kit integration**: Official IconKitchen-generated assets — favicon.ico (16/32px), app icons (192/512px), maskable icons (192/512px), apple-touch-icon (180px), OG image (1200×630px), header logo SVG (light/dark variants)
- **Splash screen** (`SplashScreen.tsx`): Animated loading screen with fade+scale entrance, Fraunces serif font, configurable duration
- **Logo component** (`ForkAndSpoonLogo.tsx`): Updated to use brand kit PNG/SVG assets. Icon and wordmark variants using official header-logo.svg
- **Bottom sheet mockup** (`BottomSheetImportMockup.tsx`): Design reference for Sprint 16 import redesign
- **Regression tests**: 39 new tests across 3 files — auth route logic (7), recency badge colors (22), tag filter chips (10)

## [1.3.0] - 2026-02-14 — V1.3 Complete (Sprint 14)

### Added
- **Claude Vision OCR** (`claudeVisionOcr.ts`): AI-powered recipe extraction from photos using Anthropic API. Handles decorative fonts, complex layouts, handwritten text. Returns structured recipe data (title, ingredients, instructions) with confidence scores. Falls back to Tesseract.js if API unavailable
- **Photo/OCR Import** (`ocrProcessor.ts`, `ocrRecipeParser.ts`): Local OCR fallback using Tesseract.js with image preprocessing (grayscale, contrast enhancement, resize), EN/DE support, progress callbacks, and heuristic text-to-recipe parsing
- **Photo Capture UI** (`PhotoCapture.tsx`): Camera capture (getUserMedia with back camera) and file upload (JPEG/PNG/WebP). Mobile-optimized viewfinder, graceful camera permission handling
- **OCR Review/Correction** (`OcrReviewForm.tsx`): Split-view review interface with editable title, ingredients, and instructions. Per-section confidence indicators (high/medium/low). Raw OCR text toggle for reference. Save corrected recipe to library
- **OCR i18n**: Full English and German translations for all OCR UI strings
- **Import from Photo button**: Added to ImportSheet alongside URL import and manual entry

### Fixed
- **Recipe Card**: Removed ingredient count, blue tag chips (distinct from green recency badges), single-line truncated title for consistent card heights
- **Recipe Card**: Removed QuickLogButton (chef hat icon) that appeared non-functional — still available in RecipeDetail toolbar
- **RecipeDetail**: Removed decorative ChefHat icon from Instructions section header
- **Search Bar**: Fixed white rectangular background — rounded-xl edges with subtle shadow on gray-50 background
- **Tag colors**: Unified all tag badges to blue (RecipeCard, RecipeDetail, TagInput, TagFilterChips, SharedRecipeView) to differentiate from green recency badges
- **recipeParser tests**: Fixed 5 failures caused by broken DOMParser mock overriding jsdom, outdated CORS error message expectations, and proxy fallback call count mismatch
- **publicShareService tests**: Fixed mock setup to properly intercept getAnonClient's createClient call using vi.mock factory pattern
- **All 6 pre-existing test failures resolved**: 480→503 tests, 0 failures

### Changed
- Version bumped to 1.3.0
- OCR pipeline: Claude Vision (primary) → Tesseract.js (fallback) for best quality across font types

## [Sprint 13] - 2026-02-13 — Social Media Import + Enhanced Export/Import (V1.3)

### Added
- **Social Media Caption Fetcher** (`socialMediaFetcher.ts`): Fetches post metadata (caption, title, thumbnail) from Instagram and TikTok URLs. Primary: oEmbed API. Fallback: CORS proxy + HTML meta tag scraping. Handles private post detection, empty captions, network errors
- **Caption-to-Recipe Parser** (`captionRecipeParser.ts`): Parses unstructured social media captions into structured recipes. Handles emoji bullets (🧅🧄🥕), numbered lists, "Ingredients:"/"Zutaten:" headers, line-break-delimited lists, mixed commentary. Supports both English and German captions
- **Social Media URL Detection**: Real-time detection of Instagram/TikTok URLs in import form with platform badge indicator. Supported patterns: Instagram posts/reels, TikTok videos, short URLs (instagr.am, vm.tiktok.com)
- **Social Media Import Flow**: Paste Instagram/TikTok URL → fetch caption → parse recipe → review/edit → save. Seamlessly integrated into existing ImportSheet with auto-routing based on URL type
- **Enhanced Export** (v2 format): Full backup including recipes, schedule entries, structured ingredients (recipeIngredients), and tags. Added app version metadata
- **Paprika Import** (`parsePaprikaRecipes`): Import recipes from Paprika app format (.paprikarecipes / JSON). Parses name, ingredients, directions, categories, source URL, photo URL
- **Recipe Keeper Import** (`parseRecipeKeeperRecipes`): Import recipes from Recipe Keeper format (JSON or XML). Parses recipe data, categories, source URLs
- **Import Format Detection** (`detectImportFormat`): Auto-detects Meal Organizer backup, Paprika, or Recipe Keeper format from file content and extension
- **i18n strings** (EN/DE): All new social media import and enhanced export/import UI strings
- **15 social media fetcher tests**: URL detection (Instagram/TikTok patterns), oEmbed fetch, CORS proxy fallback, error type assertions
- **28 caption parser tests**: Title extraction, section headers (EN/DE), emoji bullets, numbered lists, mixed commentary, heuristic mode, real-world sample captions, edge cases
- **18 export/import tests**: Format detection, Paprika parsing, Recipe Keeper parsing, preview validation, backward compatibility

### Changed
- ImportSheet now auto-detects social media URLs and routes to caption-based import flow
- ImportSheet shows platform indicator (Instagram icon) when social media URL detected
- Caption parser improved: first line always treated as title candidate, numbered instruction lines correctly classified vs ingredients
- Export format bumped to v2 (includes recipeIngredients, tags count)
- `importData()` now accepts filename parameter for format detection
- `previewImport()` now returns format type and recipeIngredientCount

---

## [Sprint 12] - 2026-02-13 — Recipe Scaling + Account & Profile Management (V1.3)

### Added
- **Ingredient Parser** (`ingredientParser.ts`): Structured parsing of raw ingredient strings into {quantity, unit, name} objects. Handles fractions (1/2, ¾), Unicode fractions (½), ranges (2-3), mixed numbers (1 1/2), decimals, "to taste" items, and both English and German units (EL/TL/Prise)
- **Recipe Scaling Logic**: Proportional quantity calculation with serving multiplier, unit-aware formatting, Unicode fraction display (½, ¼, ⅓, ⅔, ¾, ⅛)
- **Serving Selector UI** (`ServingSelector.tsx`): Adjust serving count on recipe detail view
- **Scaled Ingredient Display** (`ScaledIngredientList.tsx`): Live-updating ingredient quantities as servings change, with original text fallback
- **Account Section Component** (`AccountSection.tsx`): Full account management in Settings — shows user info, household name, invite code, sync status, sign-out with confirmation dialog, and guest CTA
- **Sync Status Display**: Shows synced/syncing/offline status, pending changes count, last synced timestamp, and manual sync trigger
- **Household Management**: Member list, invite code display/copy, code regeneration
- **Guest State CTA**: "Sign in to enable cloud sync" card in Settings for unauthenticated users
- **Sign-Out Flow**: Confirmation dialog, clean session teardown, return to local-only mode
- **IndexedDB V4 Schema**: Added `recipeIngredients` table for structured ingredient storage
- **49 ingredient parser tests**: Covers basic parsing, fractions, Unicode, ranges, decimals, no-quantity items, unit normalization, German units, scaling, and formatting
- **17 scaling accuracy tests**: Real recipe scenarios — doubling, tripling, halving, range scaling, fraction display
- **14 account section tests**: Guest CTA, authenticated state, sync status display, sign-out confirmation flow, loading state
- **E2E sign-out tests**: Guest settings navigation, CTA flow, local data persistence, cloud sign-out flow
- **i18n strings** (EN/DE): All new Account & Scaling UI translated

### Changed
- Settings page now uses `AccountSection` component (replaced inline account code) — shows for both authenticated and guest users
- `RecipeIngredient` type added to `types/recipe.ts`
- Database schema upgraded to V4 with `recipeIngredients` table
- Fixed TypeScript strict mode issues in `ingredientParser.ts` (undefined vs null handling for `quantityMax`)
- Removed unused import (`useMemo`) from `useRecipeIngredients.ts`

### Technical
- **New files**: 7 (ingredientParser.ts, ServingSelector.tsx, ScaledIngredientList.tsx, AccountSection.tsx, useRecipeIngredients.ts, sign-out-flow.spec.ts, + test files)
- **Modified files**: 4 (Settings.tsx, database.ts, types/recipe.ts, CHANGELOG.md)
- **Total tests**: 392 passing (80 new Sprint 12 tests)
- **Build**: Clean TypeScript compilation, PWA v1.2.0
- **Sprint scope**: 57 story points, 16 tasks, Implementation Plan Phases 17 + 17b, Roadmap V1.3 Epics 1 + 4

## [Sprint 11] - 2026-02-13 — Data Migration, Public Sharing & V1.2 Release (v1.2.0)

### Added
- **Migration Wizard UI** (`MigrationWizard.tsx`): Multi-step wizard for migrating local IndexedDB data to Supabase cloud with detection, progress, success/failure states, and rollback option
- **Migration Service** (`migrationService.ts`): Batch upload of recipes and schedule entries to cloud, snapshot creation for rollback, migration status tracking via localStorage
- **Public Recipe Sharing** (`publicShareService.ts`): Generate shareable public URLs for recipes, mark recipes as shared in Supabase
- **Shared Recipe View** (`SharedRecipeView.tsx`): Public read-only recipe page at `/recipe/shared/:id` — no auth required, includes CTA for new users
- **Enhanced Share Button**: Authenticated users generate public links via native share sheet or clipboard; local users get basic share
- **Privacy Policy updated**: New sections for Cloud Sync & Accounts and Public Recipe Sharing
- **Account section in Settings**: Shows logged-in user email, household name, sign-out button
- **Migrate Data button in Settings**: For users who skipped the initial migration wizard
- **11 new unit tests**: Migration service, public sharing service, MigrationWizard component
- **50+ new i18n keys** (EN + DE) for migration, public sharing, account settings

### Changed
- App version bumped to v1.2.0
- `RecipeDetail` share button now generates public links for authenticated users
- `App.tsx` now auto-detects local data on first login and shows migration wizard
- Settings page shows account info and migration option when authenticated
- Privacy policy includes cloud sync and public sharing disclosures

### Technical
- **New files**: 6 (4 production + 2 test)
- **Modified files**: 7 (App.tsx, RecipeDetail.tsx, Settings.tsx, PrivacyPolicy.tsx, en.json, de.json, CHANGELOG.md)
- **Total tests**: 313 passing (11 new)
- **Build**: Clean TypeScript compilation, PWA v1.2.0

## [Sprint 10] - 2026-02-12 — Cloud Sync & Offline Support (v1.2.0-beta.1)

### Added
- **Sync-aware data access layer** (`syncService.ts`, 678 lines): All recipe and schedule CRUD now routes through a unified service that syncs with Supabase when authenticated and queues writes offline
- **Offline sync queue**: Writes are queued in IndexedDB (`syncQueue` table) when offline and processed on reconnect
- **Sync queue processor**: Exponential backoff (1s base, 60s max, ±25% jitter), max 5 retries per operation
- **Last-write-wins conflict resolution**: Uses `updated_at` timestamps to resolve concurrent edits
- **Full data reconciliation on login** (`pullFromCloud()`): Pulls all household data and merges with local state
- **Supabase Realtime subscriptions**: Live updates for `recipes` and `schedule_entries` tables scoped to household
- **SyncProvider context** (`useSyncProvider.tsx`, 349 lines): Online/offline detection, queue processing, Realtime lifecycle management
- **SyncStatusBadge component**: Green (synced), amber pulse (syncing), gray (offline), red (error) — displayed in header
- **12 new i18n keys** (EN + DE) for all sync status strings
- **51 new tests** covering sync CRUD, queue operations, conflict resolution, component rendering
- **IndexedDB V3 schema**: Added `syncQueue` table

### Changed
- `useRecipes` hook now imports from `syncService` instead of `recipeService`
- `useSchedule` hook now imports from `syncService` instead of `scheduleService`
- `App.tsx` wrapped with `SyncProvider` inside `AuthProvider`
- Header now shows `SyncStatusBadge` next to the settings button
- Version bumped to 1.2.0-beta.1

### Technical
- **New files**: 6 (4 production + 2 test)
- **Modified files**: 7
- **New code**: ~1,155 lines production + ~530 lines tests
- **Total passing tests**: 280 (up from 229)
- **Zero regressions**: All pre-existing tests pass
- **Coverage**: Implementation Plan Phase 14, Roadmap V1.2 Epic 3

## [Sprint 8] - 2026-02-12 — Schedule UX, Bulk Actions & V1.1 Polish (v1.1.1)

### Added
- **Recipe Thumbnails in Schedule**: Meal slots now show recipe thumbnail images (with placeholder icon fallback)
- **Drag-and-Drop Reorder**: Meals can be dragged between slots within a week using @dnd-kit (desktop pointer + mobile touch)
- **Drag Overlay**: Visual feedback showing the recipe being dragged
- **Multi-Select Mode**: Long-press a recipe card or tap the checkbox icon to enter selection mode
- **Bulk Delete**: Delete multiple selected recipes at once with confirmation dialog
- **Bulk Assign Tags**: Assign a tag to multiple selected recipes — pick existing tag or create new one
- **BulkActionBar**: Floating action bar with selected count, tag, delete, and clear actions
- **BulkDeleteDialog**: Confirmation dialog for bulk recipe deletion
- **BulkTagDialog**: Tag assignment dialog with existing tag picker and new tag input
- **21 new unit tests** for bulk operations, swapMeals, MealSlot ID encoding, i18n key parity

### Changed
- MealSlot now shows GripVertical drag handle + recipe thumbnail + droppable zone
- WeeklySchedule wrapped with DndContext for drag-and-drop support
- DayCard passes `date` prop to MealSlot for drag identification
- RecipeCard supports `onLongPress` callback for entering multi-select mode
- RecipeLibrary includes CheckSquare toggle for multi-select mode
- useRecipes hook exposes `bulkDeleteRecipes` and `bulkAssignTag`
- useSchedule hook exposes `swapMeals`
- scheduleService adds `swapMeals` function for entry swapping/moving
- recipeService adds `bulkDeleteRecipes` and `bulkAssignTag` functions
- All new UI strings externalized to EN/DE translation files (bulk.* and schedule.dragMeal)
- Version bumped to 1.1.1

### Technical
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for accessible drag-and-drop
- PointerSensor (desktop, 8px activation) + TouchSensor (mobile, 200ms delay) configuration
- Dexie transactions for atomic bulk tag assignment
- 186 total passing tests (21 new Sprint 8 + 165 existing)

## [Sprint 7] - 2026-02-12 — PWA, i18n, Tags & Quick-Log (v1.1.0)

### Added
- **PWA Support**: Web app manifest, service worker (Workbox via vite-plugin-pwa), offline-first caching, installable "Add to Home Screen"
- **PWA Icons**: 192px and 512px icons for homescreen/splash
- **PWA Update Prompt**: Banner when new version available with "Update now" button
- **i18n (Internationalization)**: react-i18next integration with browser language detection
- **English (EN)** and **German (DE)** translation files (170+ keys each)
- **Language Toggle**: Settings page EN/DE switcher, persisted in localStorage
- **Freeform Tags**: `tags: string[]` field on Recipe type with Dexie v2 migration
- **TagInput Component**: Add tags by typing + Enter/comma, remove with X, backspace to delete last
- **Tag Filter Chips**: Horizontal scrollable tag filter in Recipe Library and Schedule Picker
- **Quick-Log "Cooked Today"**: One-tap button on RecipeCard and RecipeDetail
- **Quick-Log Undo**: Toast with 5-second undo window to revert lastCookedDate
- **Web Share API**: Native share sheet on supported devices, clipboard fallback
- **Share Button**: Added to RecipeDetail top bar
- **19 new unit tests** for tags, quick-log, i18n key parity, and share utility

### Changed
- Database upgraded to v2 (migration adds empty `tags` array to existing recipes)
- All UI strings externalized to translation files (en.json, de.json)
- RecipeCard now shows tags (max 3 + overflow count) and quick-log button
- RecipeLibrary includes tag filter chips and searches tags
- RecipeForm includes TagInput for adding tags on new/edited recipes
- RecipeDetail shows tags, share button, and quick-log button
- Settings page includes language selector section
- BottomTabs labels are now i18n-aware
- App header text uses translation keys
- Version bumped to 1.1.0
- HTML updated with PWA meta tags (theme-color, apple-touch-icon, viewport-fit)
- Vite config updated with VitePWA plugin configuration

### Technical
- `vite-plugin-pwa` for automatic service worker generation
- `react-i18next` + `i18next-browser-languagedetector` for i18n
- Workbox strategies: CacheFirst for fonts/images, NavigateFallback for SPA routing
- Dexie multi-entry `*tags` index for efficient tag-based queries
- 165 total passing tests (19 new Sprint 7 + 146 existing)

## [Sprint 6] - 2026-02-11 — Testing, Polish & Launch Prep

### Added
- E2E tests with Playwright for 3 critical user flows
- Data export/import feature (JSON backup & restore)
- Settings page with data management
- Privacy Policy page (`/privacy`)
- Help & FAQ page (`/help`)
- Error boundaries with friendly fallback UI
- Schedule skeleton loader for loading states
- Input sanitization with DOMPurify
- URL validation for recipe imports
- Security headers (CSP, Permissions-Policy)
- Production documentation (architecture, database, deployment, security, contributing)

### Changed
- Lazy-loaded routes for code splitting (RecipeDetail, Settings, Privacy, Help)
- Added Settings gear icon to app header
- Bottom tabs hidden on sub-pages (settings, privacy, help, recipe detail)
- Improved cache headers for static assets

### Fixed
- Various bug fixes from E2E and cross-browser QA testing

## [Sprint 5] - 2026-02-11 — Weekly Schedule & Data Persistence

### Added
- Weekly schedule view with Mon-Sun layout
- Recipe picker bottom sheet for adding meals
- Bottom tab navigation (Schedule ↔ Library)
- Real IndexedDB persistence via Dexie.js (replacing mock data)
- Schedule CRUD operations with auto-recency update
- Week navigation (previous/next week)
- GitHub Actions CI/CD pipeline restored
- ESLint + Prettier configuration restored
- Unit & integration tests for schedule and persistence

### Changed
- Schedule is now the default home tab (/)
- Library moved to /library route

## [Sprint 4] - 2026-02-11 — Recipe Library & Manual Entry

### Added
- Recipe card component with recency badges
- Recipe detail view page
- Manual recipe entry form
- Search bar with real-time filtering
- Sort options (oldest cooked, newest, A-Z)
- Delete recipe with confirmation dialog
- Edit last cooked date dialog
- Empty state with onboarding CTAs

## [Sprint 3] - 2026-02-10 — Recipe Import

### Added
- Recipe parser (schema.org JSON-LD + heuristic HTML parsing)
- Import sheet modal (URL input)
- Pre-filled review form after import
- CORS proxy worker for blocked sites
- Import error handling and fallback to manual entry

## [Sprint 2] - 2026-02-10 — Core Data Layer

### Added
- IndexedDB schema with Dexie.js
- Recipe CRUD operations (create, read, update, delete)
- Schedule CRUD operations
- Search/filter logic
- Date helpers (format, parse, recency calculation)
- Custom hooks (useRecipes, useSchedule)
- TypeScript interfaces for all data models

## [Sprint 1] - 2026-02-10 — Foundation

### Added
- Vite + React + TypeScript project setup
- Tailwind CSS + shadcn/ui component library
- GitHub repository structure
- CI/CD pipeline with GitHub Actions
- Netlify deployment configuration
- ESLint + Prettier code formatting
- Vitest testing framework
- Project documentation (README)
