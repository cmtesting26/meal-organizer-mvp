# Architecture Documentation

## System Overview

Meal Organizer is a **client-side Single Page Application (SPA)** with a local-first data architecture. There is no backend server — all data is stored in the browser's IndexedDB.

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│              Browser (Client)            │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │   React SPA   │  │  Service Worker │  │
│  │   (Vite)      │  │  (future PWA)  │  │
│  └──────┬───────┘  └────────────────┘  │
│         │                               │
│  ┌──────▼───────┐  ┌────────────────┐  │
│  │  React Router │  │  State (Hooks) │  │
│  │  (6 routes)   │  │  Context       │  │
│  └──────┬───────┘  └───────┬────────┘  │
│         │                   │           │
│  ┌──────▼───────────────────▼────────┐  │
│  │         Dexie.js (ORM)            │  │
│  │  ┌─────────┐  ┌────────────────┐  │  │
│  │  │ Recipes │  │ ScheduleEntries│  │  │
│  │  └─────────┘  └────────────────┘  │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │          IndexedDB                 │  │
│  │    (Persistent Local Storage)      │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘

External (for recipe import only):
  Browser → CORS Proxy → Recipe Website
```

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Industry standard, great AI agent support |
| Build Tool | Vite 5 | Fast dev server, optimized builds |
| Styling | Tailwind CSS + shadcn/ui | Rapid prototyping, accessible components |
| Database | IndexedDB via Dexie.js | Large capacity, indexed queries, offline |
| Routing | React Router v7 | Standard SPA routing |
| Date Handling | date-fns | Lightweight, tree-shakeable |
| Testing | Vitest + Playwright | Fast unit tests + E2E |
| Hosting | Netlify | Free tier, auto-deploy, CDN |

## Data Flow

### Recipe Import
1. User pastes URL → `recipeParser.ts` fetches page
2. Parser tries schema.org JSON-LD extraction (`schemaParser.ts`)
3. Falls back to heuristic HTML parsing (`heuristicParser.ts`)
4. Pre-filled form shown for review → User saves
5. Recipe stored in IndexedDB via `recipeService.ts`

### Weekly Schedule
1. User taps empty meal slot → Recipe picker opens
2. User selects recipe → `scheduleService.ts` creates entry
3. Recipe's `lastCookedDate` auto-updates to scheduled date
4. Schedule view refreshes from IndexedDB

### Search
1. User types query → `useRecipes` hook filters in-memory
2. Matches against title and ingredients array
3. Results rendered instantly (<100ms)

## Key Design Decisions

- **No backend**: Eliminates hosting costs, deployment complexity, auth
- **IndexedDB over localStorage**: 50MB+ capacity vs 5MB limit
- **Dexie.js**: Clean API, TypeScript support, simplifies IndexedDB
- **Code splitting**: Lazy-loaded routes reduce initial bundle size
- **Mobile-first**: Touch-optimized UI with responsive breakpoints
