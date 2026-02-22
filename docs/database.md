# Database Documentation

## Overview

Meal Organizer uses **IndexedDB** (via Dexie.js) for all persistent data storage. The database runs entirely in the browser with no server-side component.

## Database Configuration

**Database Name**: `MealOrganizerDB`
**Version**: 1
**Library**: Dexie.js 4.x

```typescript
// src/lib/database.ts
class MealOrganizerDatabase extends Dexie {
  recipes!: Table<Recipe>;
  scheduleEntries!: Table<ScheduleEntry>;

  constructor() {
    super('MealOrganizerDB');
    this.version(1).stores({
      recipes: 'id, title, lastCookedDate, createdAt',
      scheduleEntries: 'id, recipeId, [date+mealType], date',
    });
  }
}
```

## Tables

### Recipes

| Field | Type | Indexed | Description |
|---|---|---|---|
| `id` | string (UUID) | Primary Key | Unique identifier |
| `title` | string | Yes | Recipe name (searchable) |
| `ingredients` | string[] | No | Array of ingredient strings |
| `instructions` | string[] | No | Array of step strings |
| `sourceUrl` | string? | No | Original recipe URL |
| `imageUrl` | string? | No | Recipe photo URL |
| `lastCookedDate` | string? | Yes | ISO date (YYYY-MM-DD) |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | No | ISO timestamp |

### ScheduleEntries

| Field | Type | Indexed | Description |
|---|---|---|---|
| `id` | string (UUID) | Primary Key | Unique identifier |
| `recipeId` | string | Yes | Foreign key to Recipes |
| `date` | string | Compound | ISO date (YYYY-MM-DD) |
| `mealType` | 'lunch' \| 'dinner' | Compound | Meal slot type |
| `createdAt` | string | No | ISO timestamp |

**Compound Index**: `[date+mealType]` enables fast weekly schedule queries.

## Common Queries

```typescript
// Get all recipes sorted by last cooked (oldest first)
const recipes = await db.recipes.orderBy('lastCookedDate').toArray();

// Search recipes by title
const results = await db.recipes
  .where('title').startsWithIgnoreCase(query).toArray();

// Get schedule entries for a week
const entries = await db.scheduleEntries
  .where('date').between(startDate, endDate).toArray();

// Get specific meal slot
const entry = await db.scheduleEntries
  .where('[date+mealType]').equals([date, mealType]).first();
```

## Data Backup

Export/import via JSON is available in Settings. See `src/lib/exportImport.ts`.

## Storage Limits

- Typical browser limit: 50MB+ (can grow to GBs)
- Recipe with image URL: ~1-2KB per recipe
- 1000 recipes ≈ 1-2MB (well within limits)
- Images stored as URLs, not embedded data
