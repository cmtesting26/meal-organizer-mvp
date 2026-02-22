# Deployment Documentation

## Overview

Meal Organizer is a static site deployed to **Netlify**. The CI/CD pipeline runs via GitHub Actions on every push to `main`.

## Environments

| Environment | Branch | URL | Purpose |
|---|---|---|---|
| Production | `main` | `https://meal-organizer-mvp.netlify.app` | Live app |
| Staging | `develop` | Preview deploys | Pre-production testing |
| Local | — | `http://localhost:5173` | Development |

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

Triggered on push to `main` and pull requests:

1. **Checkout** code
2. **Install** dependencies (`npm ci`)
3. **Lint** (`npm run lint`)
4. **Test** (`npm run test -- --run`)
5. **Build** (`npm run build`)

### Netlify Auto-Deploy

Netlify connects to the GitHub repo and auto-deploys:
- Push to `main` → Production deploy
- Pull requests → Preview deploy

**Build Settings** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

## Local Development

```bash
git clone https://github.com/cmtesting26/meal-organizer-mvp.git
cd meal-organizer-mvp
npm install
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build to dist/
npm run test         # Run unit tests
npm run lint         # Run ESLint
```

## Rollback Procedure

1. **Netlify Dashboard**: Go to Deploys → click any previous deploy → "Publish deploy"
2. **Git Revert**: `git revert HEAD` → push to `main` → auto-deploys

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_CORS_PROXY_URL` | Optional | CORS proxy URL for recipe import |

Set in `.env.local` for local development. In production, configure via Netlify dashboard.

## Security Headers

Configured in `netlify.toml`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: default-src 'self' ...`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Post-Deployment Checks

- [ ] App loads at production URL
- [ ] Can search recipes
- [ ] Can add recipe to schedule
- [ ] Can export data
- [ ] No console errors
