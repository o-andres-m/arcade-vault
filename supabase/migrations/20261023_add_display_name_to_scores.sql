-- Add display_name column to scores table
ALTER TABLE scores ADD COLUMN display_name TEXT;

-- Make user_id nullable
ALTER TABLE scores ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: at least one of user_id or display_name must exist
ALTER TABLE scores ADD CONSTRAINT scores_user_or_name_check
  CHECK (user_id IS NOT NULL OR display_name IS NOT NULL);

-- Create new RLS policy for guests
CREATE POLICY "Guests can insert scores with display_name"
  ON scores FOR INSERT
  WITH CHECK (
    (user_id IS NULL AND display_name IS NOT NULL AND length(display_name) >= 1)
  );
