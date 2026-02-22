/**
 * Recipe Types for Fork and Spoon MVP
 * 
 * This file defines the TypeScript interfaces used throughout the app
 * for recipe data structures.
 */

/**
 * ParsedRecipe - Result from recipe parser
 * 
 * This is what the recipe parser returns after extracting data
 * from a recipe URL. It may have partial data if parsing failed.
 */
export interface ParsedRecipe {
  /** Recipe title/name */
  title: string;
  
  /** List of ingredients (e.g., "400g spaghetti", "2 eggs") */
  ingredients: string[];
  
  /** Step-by-step cooking instructions */
  instructions: string[];
  
  /** URL to recipe image (optional) */
  imageUrl?: string;
  
  /** Original source URL where recipe was found */
  sourceUrl: string;
  
  /** Whether parsing was successful (even partial success = true) */
  success: boolean;
  
  /** Error message if parsing failed */
  error?: string;

  /** Tags for the recipe (optional) */
  tags?: string[];
}

/**
 * Recipe - Stored recipe in IndexedDB
 * 
 * This is the full recipe object as stored in the database.
 * Extends ParsedRecipe with additional metadata.
 */
export interface Recipe {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Recipe title/name */
  title: string;
  
  /** List of ingredients */
  ingredients: string[];
  
  /** Step-by-step cooking instructions */
  instructions: string[];
  
  /** URL to recipe image (optional) */
  imageUrl?: string;
  
  /** Original source URL (optional) */
  sourceUrl?: string;
  
  /** ISO date string of when last cooked (optional) */
  lastCookedDate?: string;
  
  /** ISO timestamp of when recipe was created */
  createdAt: string;
  
  /** ISO timestamp of when recipe was last updated */
  updatedAt: string;

  /** Freeform tags for recipe organization (e.g., ["Italian", "quick", "vegetarian"]) */
  tags?: string[];
}

/**
 * RecipeIngredient - Structured ingredient data (Sprint 12)
 *
 * Parsed from raw ingredient strings into structured {quantity, unit, name}.
 * Stored in IndexedDB recipeIngredients table for recipe scaling.
 */
export interface RecipeIngredient {
  /** Unique identifier (UUID) */
  id: string;
  /** Recipe ID (foreign key to Recipe) */
  recipeId: string;
  /** Numeric quantity (null for "to taste" items) */
  quantity: number | null;
  /** Max quantity for ranges (e.g., "2-3" → 3) */
  quantityMax?: number | null;
  /** Normalised unit (e.g., "cup", "g", "tbsp") */
  unit: string;
  /** Ingredient name */
  name: string;
  /** Original unparsed string */
  rawText: string;
  /** Sort order within the recipe */
  sortOrder: number;
}

/**
 * ScheduleEntry - Meal planned on schedule
 * 
 * Links a recipe to a specific date and meal type (lunch/dinner).
 */
export interface ScheduleEntry {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Recipe ID (foreign key to Recipe) */
  recipeId: string;
  
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  
  /** Meal type */
  mealType: 'lunch' | 'dinner';
  
  /** ISO timestamp of when entry was created */
  createdAt: string;
}
