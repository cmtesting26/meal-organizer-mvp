-- =============================================================================
-- Sprint 9: Initial Supabase Schema — Meal Organizer V1.2
-- =============================================================================
-- Creates household-scoped data model with Row-Level Security.
-- Run this in the Supabase SQL Editor or via supabase db push.
-- =============================================================================

-- ─── HOUSEHOLDS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.households IS 'Top-level entity. All data belongs to a household.';

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_household ON public.users(household_id);

COMMENT ON TABLE public.users IS 'Maps auth users to households. Many-to-one.';

-- ─── RECIPES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  source_url TEXT,
  image_url TEXT,
  last_cooked_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_household ON public.recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_last_cooked ON public.recipes(last_cooked_date);

COMMENT ON TABLE public.recipes IS 'Recipes scoped to a household.';

-- ─── SCHEDULE ENTRIES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_household ON public.schedule_entries(household_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON public.schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_date_meal ON public.schedule_entries(date, meal_type);

COMMENT ON TABLE public.schedule_entries IS 'Weekly meal schedule entries scoped to a household.';

-- ─── TAGS ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_household ON public.tags(household_id);

COMMENT ON TABLE public.tags IS 'Freeform tags scoped to a household.';


-- =============================================================================
-- ROW-LEVEL SECURITY (S9-03)
-- =============================================================================
-- Policy: users can only access data belonging to their household.
-- The helper subquery gets the current user's household_id.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ─── HOUSEHOLDS ──────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own household"
  ON public.households
  FOR SELECT
  USING (
    id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own household"
  ON public.households
  FOR UPDATE
  USING (
    id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- Insert is handled by the create_household function (service role or explicit policy)
CREATE POLICY "Allow insert for authenticated users"
  ON public.households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can view users"
  ON public.users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid());

-- ─── RECIPES ─────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view household recipes"
  ON public.recipes
  FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert household recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update household recipes"
  ON public.recipes
  FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete household recipes"
  ON public.recipes
  FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- ─── SCHEDULE ENTRIES ────────────────────────────────────────────────────────

CREATE POLICY "Users can view household schedule"
  ON public.schedule_entries
  FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert household schedule"
  ON public.schedule_entries
  FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update household schedule"
  ON public.schedule_entries
  FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete household schedule"
  ON public.schedule_entries
  FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

-- ─── TAGS ────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view household tags"
  ON public.tags
  FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert household tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update household tags"
  ON public.tags
  FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete household tags"
  ON public.tags
  FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM public.users WHERE id = auth.uid())
  );


-- =============================================================================
-- DATABASE FUNCTIONS (S9-05 — Edge Function helpers)
-- =============================================================================

-- ─── CREATE HOUSEHOLD ────────────────────────────────────────────────────────
-- Called on first signup: creates household + links user to it

CREATE OR REPLACE FUNCTION public.create_household(
  household_name TEXT,
  user_display_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
  new_invite_code TEXT;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already belongs to a household
  IF EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  -- Generate a 6-character invite code
  new_invite_code := upper(substr(md5(random()::text), 1, 6));

  -- Create household
  INSERT INTO public.households (name, invite_code)
  VALUES (household_name, new_invite_code)
  RETURNING id INTO new_household_id;

  -- Get email from auth.users
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;

  -- Create user record linked to household
  INSERT INTO public.users (id, household_id, display_name, email)
  VALUES (current_user_id, new_household_id, user_display_name, current_user_email);

  RETURN json_build_object(
    'household_id', new_household_id,
    'invite_code', new_invite_code
  );
END;
$$;

-- ─── JOIN HOUSEHOLD ──────────────────────────────────────────────────────────
-- Called when second user joins via invite code

CREATE OR REPLACE FUNCTION public.join_household(
  invite_code_input TEXT,
  user_display_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_household_id UUID;
  target_household_name TEXT;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already belongs to a household
  IF EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  -- Find household by invite code (case-insensitive)
  SELECT id, name INTO target_household_id, target_household_name
  FROM public.households
  WHERE invite_code = upper(trim(invite_code_input));

  IF target_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Get email from auth.users
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;

  -- Link user to household
  INSERT INTO public.users (id, household_id, display_name, email)
  VALUES (current_user_id, target_household_id, user_display_name, current_user_email);

  RETURN json_build_object(
    'household_id', target_household_id,
    'household_name', target_household_name
  );
END;
$$;

-- ─── GENERATE INVITE ─────────────────────────────────────────────────────────
-- Generates a new invite code for an existing household

CREATE OR REPLACE FUNCTION public.generate_invite(
  household_id_input UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invite_code TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user belongs to this household
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = current_user_id AND household_id = household_id_input
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  -- Generate new 6-character invite code
  new_invite_code := upper(substr(md5(random()::text), 1, 6));

  -- Update household
  UPDATE public.households
  SET invite_code = new_invite_code
  WHERE id = household_id_input;

  RETURN json_build_object('invite_code', new_invite_code);
END;
$$;


-- =============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
