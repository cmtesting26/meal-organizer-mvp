# 🍴 Fork and Spoon

A recipe management and meal planning app for couples and small households. Import recipes from anywhere, plan your weekly meals, and never forget what you love to cook.

## Features

### Core
- **Recipe Library** — Browse, search, and sort all your recipes with tag-based filtering
- **Weekly Schedule** — Plan meals for the week (lunch & dinner slots)
- **Recency Tracking** — Color-coded badges show when you last cooked each meal

### Cooking Mode (V1.6)
- **Step-by-Step Mode** — Full-screen cooking mode with ingredient-step matching
- **Smart Timer** — Auto-detects cooking times from step text (80%+ accuracy)
- **Timer Controls** — ±30s adjustment, start/pause/reset, progress bar, pulse animation at ≤10s
- **Audible Alert** — 3-beep notification via Web Audio API when timer reaches 0:00
- **Timer Persistence** — Timer keeps running when navigating between steps
- **Wake Lock** — Keeps your screen on while cooking
- **Swipe & Keyboard Navigation** — Swipe between steps on mobile, arrow keys on desktop
- **Responsive Layout** — Portrait split (ingredients/instructions) and landscape side-by-side
- **Theme Support** — Cooking mode follows global light/dark theme

### Photo Upload (V1.6)
- **Recipe Photos** — Add photos to any recipe from Recipe Detail or manual creation
- **Camera + File Upload** — Take a photo or pick from gallery
- **Smart Compression** — Client-side resize (800px) and JPEG compression (≤200KB)
- **Cloud Storage** — Supabase Storage with household-scoped paths and thumbnails

### Dark Mode (V1.5)
- **System Detection** — Automatically follows your OS light/dark preference
- **Manual Override** — 3-way toggle (System / Light / Dark) in Settings
- **WCAG AA Compliant** — All color combinations audited for contrast compliance
- **Smooth Transitions** — 200ms theme transition with first-paint flash prevention

### Household Feed & Frequency (V1.5)
- **New Recipes Feed** — See recipes added by household members since your last login
- **Notification Badge** — Red dot on Library tab when new recipes are available
- **Cook Frequency Stats** — "Cooked 3× this month · 12× this year" on Recipe Detail
- **Most Cooked View** — Rank recipes by cook count with segmented control

### Import (4 methods)
- **Website Import** — Paste a recipe URL and auto-extract title, ingredients, instructions
- **Social Media Import** — Import from Instagram and TikTok posts (caption-based parsing)
- **Photo/OCR Import** — Photograph a cookbook page; AI vision extracts the recipe
- **Manual Entry** — Add recipes by hand with a simple form

### Scaling & Organization
- **Recipe Scaling** — Adjust serving sizes with proportional ingredient scaling
- **Tags** — Organize recipes with freeform tags and filter by them
- **Bulk Operations** — Multi-select recipes for batch tagging or deletion

### Cloud & Sync (optional)
- **Cloud Sync** — Supabase-backed sync across devices with offline support
- **Household Sharing** — Share a recipe library with family via invite codes
- **Public Sharing** — Generate shareable links for individual recipes
- **Onboarding** — 3-screen first-launch tour + condensed invite-link path
- **Data Migration** — One-click migration from local-only to cloud mode

### Data Safety
- **Data Export/Import** — JSON backup and restore, plus Paprika and Recipe Keeper import
- **PWA** — Installable as a home-screen app, works offline with branded splash screen

## Quick Start

```bash
git clone https://github.com/cmtesting26/meal-organizer-mvp.git
cd meal-organizer-mvp
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Cloud Sync (optional)

To enable cloud sync, create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app works fully offline without these.

## Prerequisites

- Node.js 20.x LTS
- npm 10.x
- Modern browser (Chrome, Firefox, or Safari)

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run unit tests (watch mode) |
| `npm run test -- --run` | Run tests once |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
├── components/       # React components
│   ├── auth/         # Authentication (AuthFlow)
│   ├── brand/        # Branding (ForkAndSpoonLogo, SplashScreen)
│   ├── common/       # Shared (ErrorBoundary, TagInput, RecencyBadge, DataManagement)
│   ├── layout/       # App layout (BottomNav, FullScreenBottomSheet)
│   ├── migration/    # Cloud migration wizard
│   ├── ocr/          # Photo capture & OCR review
│   ├── onboarding/   # First-launch onboarding flow + invite path
│   ├── recipes/      # Recipe-related (RecipeCard, RecipeForm, AddRecipeSheet, ImportSheet)
│   ├── schedule/     # Schedule (WeeklySchedule, DayCard, RecipePicker)
│   ├── settings/     # Account section
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Custom hooks (useRecipes, useSchedule, useAuth, useSyncProvider)
├── i18n/             # Translation files (en.json, de.json)
├── lib/              # Utilities (database, parsers, sync, OCR, services)
├── pages/            # Route pages (RecipeDetail, Settings, Privacy, Help)
├── types/            # TypeScript interfaces
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## Tech Stack

- **React 18** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui + CSS custom property design token system
- **IndexedDB** via Dexie.js (local-first)
- **Supabase** for cloud sync, auth, and real-time subscriptions (optional)
- **Tesseract.js** for client-side OCR (fallback)
- **Anthropic API** for AI-powered recipe extraction from photos (primary)
- **React Router** v7
- **react-i18next** for EN/DE internationalization
- **@dnd-kit** for drag-and-drop schedule reordering
- **Workbox** for PWA service worker and offline support
- **Vitest** + Playwright for testing (1,179 unit tests)

## Data & Privacy

All data is stored locally in your browser's IndexedDB by default. Cloud sync is opt-in and uses Supabase with row-level security. See the in-app [Privacy Policy](/privacy) for details.

**Back up your data** regularly using Settings → Export Data.

## Documentation

- [Architecture](docs/architecture.md) — System design and data flow
- [Database](docs/database.md) — IndexedDB schema and queries
- [Deployment](docs/deployment.md) — CI/CD and Netlify setup
- [Security](docs/security.md) — Headers, sanitization, XSS prevention
- [Contributing](docs/contributing.md) — Dev setup and code style

## License

MIT
