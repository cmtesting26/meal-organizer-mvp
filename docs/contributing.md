# Contributing Guide

## Development Setup

1. Clone the repo: `git clone https://github.com/cmtesting26/meal-organizer-mvp.git`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Open `http://localhost:5173`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (watch mode) |
| `npm run test -- --run` | Run tests once |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── components/       # React components
│   ├── common/       # Shared (ErrorBoundary, LoadingSpinner, DataManagement)
│   ├── layout/       # App layout (BottomTabs)
│   ├── recipes/      # Recipe-related (RecipeCard, RecipeForm, ImportSheet)
│   ├── schedule/     # Schedule (WeeklySchedule, DayCard, RecipePicker)
│   └── ui/           # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── hooks/            # Custom hooks (useRecipes, useSchedule, useToast)
├── lib/              # Utilities (database, parser, services, sanitize)
├── pages/            # Route pages (RecipeDetail, Settings, Privacy, Help)
├── types/            # TypeScript interfaces
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## Branching Strategy

- `main` — production, auto-deploys to Netlify
- `develop` — active development
- `feature/*` — feature branches from develop

## Code Style

- TypeScript strict mode
- ESLint + Prettier enforced
- Functional components with hooks
- PascalCase for components, camelCase for functions/variables
- Co-located tests in `/tests` directory

## Writing Tests

- Unit tests: `tests/unit/*.test.ts`
- Use Vitest (Jest-compatible)
- Use `fake-indexeddb` for database tests
- Target: 70%+ coverage on business logic

## Pull Request Process

1. Create feature branch from `develop`
2. Implement with tests
3. Run `npm run lint && npm run test -- --run && npm run build`
4. Open PR to `develop`
5. Self-review for solo dev
6. Merge to `develop`, then PR to `main` for release
