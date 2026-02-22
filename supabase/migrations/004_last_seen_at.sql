-- Sprint 21: Add last_seen_at timestamp for household feed feature
-- Tracks when each user last opened the app so we can show "new since last login" recipes.

-- Add column with default to created_at (so existing users don't have NULL)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows: set last_seen_at to created_at so no false "new" alerts
UPDATE public.users
  SET last_seen_at = created_at
  WHERE last_seen_at IS NULL;

-- RLS: users can read household members' last_seen_at (already covered by
-- existing "Users can view household members" policy on the users table).
-- Users can update their own last_seen_at:
CREATE POLICY "Users can update own last_seen_at"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
