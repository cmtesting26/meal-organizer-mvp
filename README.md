# Meal Organizer MVP

A focused recipe management app that helps home cooks remember and rotate through their existing meal repertoire by tracking when each meal was last cooked.

## Tech Stack

- **Frontend:** React 18.3+ with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** IndexedDB (via Dexie.js)
- **Testing:** Vitest (unit/integration) + Playwright (E2E)
- **Hosting:** Netlify (free tier)
- **CI/CD:** GitHub Actions

## Prerequisites

- Node.js 20.x or higher
- npm (comes with Node.js)
- Git

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/[your-username]/meal-organizer-mvp.git
cd meal-organizer-mvp

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run unit and integration tests
- `npm run test:e2e` - Run E2E tests with Playwright

## Project Structure

```
meal-organizer-mvp/
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components (buttons, inputs, etc.)
│   │   ├── recipes/      # Recipe-related components
│   │   ├── schedule/     # Schedule-related components
│   │   └── layout/       # Layout components (navigation, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and libraries
│   │   ├── database.ts   # Dexie.js database setup
│   │   └── recipeParser.ts # Recipe import logic
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── tests/                # Test files
├── .github/workflows/    # CI/CD configuration
└── package.json
```

## Architecture

### Local-First Approach

This MVP uses a local-first architecture with IndexedDB for data storage:

- **No backend required** - All data stored client-side
- **Offline functionality** - App works without internet connection
- **Fast performance** - No network latency
- **Zero hosting costs** - Static site hosting on Netlify

### Data Storage

- **Recipes table:** Stores recipe metadata (title, ingredients, instructions, images, last cooked date)
- **Schedule entries table:** Tracks which recipes are planned for specific days

### Future Enhancements (V1.3+)

- Cloud sync for multi-device access
- User authentication
- Recipe sharing with friends

## Development Workflow

### Branching Strategy

- `main` - Production-ready code (deploys to production)
- `develop` - Integration branch (deploys to staging)
- `feature/*` - Feature branches (merge to develop)

### CI/CD Pipeline

GitHub Actions automatically:
1. Runs linting and type checking
2. Executes unit and integration tests
3. Builds the application
4. Runs E2E tests (production only)
5. Deploys to Netlify (staging or production)

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass (`npm test`)
4. Run linting (`npm run lint`)
5. Commit with descriptive messages
6. Create a pull request to `develop`

## Troubleshooting

### Development server won't start

- Ensure Node.js 20.x+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for port conflicts (default: 5173)

### Tests failing

- Clear test cache: `npm run test -- --clearCache`
- Ensure all dependencies installed: `npm install`

### Build errors

- Run type checking: `npm run type-check`
- Clear build cache: `rm -rf dist && npm run build`

## License

MIT

## Contact

For questions or feedback, please open an issue on GitHub.
