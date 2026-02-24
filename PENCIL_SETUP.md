# Pencil Setup Guide — Fork & Spoon

## Overview

This guide walks you through setting up [Pencil](https://pencil.dev) for the Fork & Spoon meal organizer app so you can visually iterate on designs and sync changes back to code.

## Tech Stack Reference

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | React 18 + TypeScript                   |
| Styling      | Tailwind CSS 3.4 + CSS custom properties |
| UI Library   | Radix UI + shadcn/ui components          |
| Icons        | Lucide React                             |
| Build        | Vite 5                                   |
| Design Tokens| `src/styles/tokens.css` (--fs-* namespace) |

## Step 1: Install Pencil

Choose one:

- **VS Code / Cursor**: Install the "Pencil" extension from the marketplace
- **Desktop app**: Download from [pencil.dev](https://www.pencil.dev/)
- **Claude Code**: Pencil supports MCP integration natively

## Step 2: Create the Design File

A `design.pen` file has been added to the project root. Open it in your IDE — it will launch the Pencil canvas.

```
meal-organizer-mvp/
├── src/
├── design.pen        ← Open this in your IDE
├── package.json
└── ...
```

## Step 3: Import Existing Components

Open the Pencil AI prompt (`Cmd/Ctrl + K`) and use these commands to import your existing app into the design canvas:

### Import key screens
```
Recreate the main app screens from src/pages and src/App.tsx in Pencil
```

### Import core components
```
Import these components from my codebase into the design:
- src/components/layout/BottomNav.tsx
- src/components/common/WarmHeader.tsx
- src/components/recipes/RecipeCard.tsx
- src/components/recipes/RecipeLibrary.tsx
- src/components/schedule/WeeklySchedule.tsx
- src/components/schedule/DayCard.tsx
- src/components/brand/ForkAndSpoonLogo.tsx
```

### Import the design system
```
Import the design system from src/styles/tokens.css into Pencil variables
```

### Import from Tailwind config
```
Import the design system from our Tailwind config at tailwind.config.js
```

## Step 4: Design Token Mapping

Fork & Spoon uses a comprehensive token system in `src/styles/tokens.css`. Here's a quick reference for Pencil:

### Brand Colors (Light Theme)
| Token                | Value    | Usage                    |
|----------------------|----------|--------------------------|
| `--fs-accent`        | #D97706  | Primary brand amber      |
| `--fs-accent-hover`  | #B45309  | Hover state              |
| `--fs-accent-light`  | #FEF3C7  | Light amber backgrounds  |
| `--fs-bg-base`       | #FFFFFF  | Page background          |
| `--fs-bg-surface`    | #FFFFFF  | Card backgrounds         |
| `--fs-bg-elevated`   | #F5F5F4  | Elevated sections        |
| `--fs-text-primary`  | #1C1917  | Main text                |
| `--fs-text-secondary`| #44403C  | Secondary text           |
| `--fs-text-muted`    | #78716C  | Muted text               |

### Brand Colors (Dark Theme)
| Token                | Value    | Usage                    |
|----------------------|----------|--------------------------|
| `--fs-accent`        | #FBBF24  | Primary brand amber      |
| `--fs-bg-base`       | #1C1917  | Page background          |
| `--fs-bg-surface`    | #292524  | Card backgrounds         |
| `--fs-text-primary`  | #FAFAF9  | Main text                |

### Status Colors
| Token          | Value   | Usage    |
|----------------|---------|----------|
| `--fs-success` | #16A34A | Success  |
| `--fs-error`   | #DC2626 | Error    |
| `--fs-warning` | #D97706 | Warning  |
| `--fs-info`    | #2563EB | Info     |

## Step 5: Component Architecture

Key components to design around:

### Pages / Screens
1. **Recipe Library** — Main list view with search, filters, tags, sort
2. **Recipe Detail** — Full recipe view with ingredients, steps, cooking mode
3. **Weekly Schedule** — 7-day meal plan with drag-and-drop slots
4. **Settings** — Account, theme toggle, data management
5. **Help/FAQ** — Support page

### Shared Components
- `WarmHeader` — Amber-tinted section header
- `BottomNav` — 4-tab bottom navigation (Recipes, Schedule, Settings, Help)
- `RecipeCard` — Recipe list item with photo, tags, recency badge
- `TagFilterChips` — Horizontal scrolling tag filters
- `TextTabs` — Text-based tab switcher
- `SplashScreen` — Animated brand splash

### UI Primitives (shadcn/ui)
- Button, Card, Dialog, Sheet, Input, Label, Textarea, Badge, Alert

## Step 6: Bi-directional Workflow

### Design → Code
After making visual changes in Pencil, sync back:
```
Update the React components to match the Pencil designs
Apply the new color scheme to both design and code
Generate React + Tailwind code for this new component
```

### Code → Design
After coding changes, update the design:
```
Recreate the updated RecipeCard from src/components/recipes/RecipeCard.tsx
Sync the current codebase state into the Pencil design
```

## Step 7: Version Control

The `design.pen` file is a text-based format that works with Git:

```bash
git add design.pen
git commit -m "chore: add Pencil design file for Fork & Spoon"
git push origin main
```

You can branch, merge, and diff design files just like code!

## Useful AI Prompts for Pencil

Here are some prompts to get started improving Fork & Spoon's designs:

```
Redesign the RecipeCard to be more visually appealing with larger photos
Create a new onboarding flow with 3 illustrated screens
Design a grocery list feature based on the weekly schedule
Improve the empty state illustrations for the recipe library
Create dark mode variants for all screens
Design a sharing/social feature for recipes
```
