-- Migration 003: Add recipe_ingredients table for structured ingredient parsing (Sprint 12 / V1.3)
--
-- Stores parsed ingredients as structured data {quantity, unit, name}
-- to support recipe scaling. Keeps raw_text as fallback.
-- Household-scoped via recipe FK (recipes.household_id enforced by RLS).

-- ─── Table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  quantity NUMERIC,
  quantity_max NUMERIC,
  unit TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
  ON recipe_ingredients(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_sort_order
  ON recipe_ingredients(recipe_id, sort_order);

-- ─── RLS Policies ─────────────────────────────────────────────────────────
-- Access scoped to household through recipe FK → recipes.household_id

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access to ingredients of their household's recipes
CREATE POLICY "Users can access own household recipe ingredients"
  ON recipe_ingredients FOR ALL
  USING (
    recipe_id IN (
      SELECT r.id FROM recipes r
      WHERE r.household_id = (
        SELECT u.household_id FROM users u WHERE u.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    recipe_id IN (
      SELECT r.id FROM recipes r
      WHERE r.household_id = (
        SELECT u.household_id FROM users u WHERE u.id = auth.uid()
      )
    )
  );

-- Anonymous users: read-only access to ingredients of shared recipes
CREATE POLICY "Anyone can read shared recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT r.id FROM recipes r WHERE r.shared = true
    )
  );

-- ─── Add default_servings column to recipes table ─────────────────────────

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS default_servings INTEGER DEFAULT 4;
