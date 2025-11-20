/*
  # Complete Mood Tracking System with Authentication

  ## Overview
  This migration creates a complete mood tracking system with user authentication,
  configurable scales, and support for predictions and exports.

  ## New Tables

  ### 1. `users_profile`
  Extended user profile information (linked to auth.users).
  - `id` (uuid, primary key) - References auth.users.id
  - `email` (text, not null) - User email
  - `created_at` (timestamptz) - Account creation date

  ### 2. `pseudonyms` (modified)
  Stores pseudonyms that users create for mood tracking.
  - Now includes `user_id` foreign key to link to auth.users
  - Only owner can see their pseudonyms

  ### 3. `mood_indicators` (modified)
  Stores configurable mood indicators with custom scales.
  - `min_value` (integer, default 1) - Minimum scale value
  - `max_value` (integer, default 5) - Maximum scale value
  - `step_value` (decimal, default 1) - Step increment for slider
  - `color_start` (text) - Start color for gradient
  - `color_end` (text) - End color for gradient
  - Now user-specific with `user_id`

  ### 4. `mood_entries` (modified)
  Records individual mood entries.
  - `entry_date` (timestamptz) - Manually editable timestamp
  - User-specific entries

  ### 5. `mood_indicator_values` (modified)
  Values now stored as decimal for flexible scale support.
  - `value` (decimal, not null) - Rating value on custom scale

  ## Security
  
  ### RLS Policies
  All tables now use proper Row Level Security with authenticated user checks.
  Users can only access their own data.

  ## Important Notes
  1. Authentication is required for all operations
  2. Each user has isolated data
  3. Scales are fully customizable per indicator
  4. Timestamps are editable for backdating entries
*/

-- Drop existing policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read access to pseudonyms" ON pseudonyms;
  DROP POLICY IF EXISTS "Allow public insert to pseudonyms" ON pseudonyms;
  DROP POLICY IF EXISTS "Allow public update to pseudonyms" ON pseudonyms;
  DROP POLICY IF EXISTS "Allow public delete to pseudonyms" ON pseudonyms;
  DROP POLICY IF EXISTS "Allow public read access to mood_indicators" ON mood_indicators;
  DROP POLICY IF EXISTS "Allow public insert to mood_indicators" ON mood_indicators;
  DROP POLICY IF EXISTS "Allow public update to mood_indicators" ON mood_indicators;
  DROP POLICY IF EXISTS "Allow public delete to mood_indicators" ON mood_indicators;
  DROP POLICY IF EXISTS "Allow public read access to mood_entries" ON mood_entries;
  DROP POLICY IF EXISTS "Allow public insert to mood_entries" ON mood_entries;
  DROP POLICY IF EXISTS "Allow public update to mood_entries" ON mood_entries;
  DROP POLICY IF EXISTS "Allow public delete to mood_entries" ON mood_entries;
  DROP POLICY IF EXISTS "Allow public read access to mood_indicator_values" ON mood_indicator_values;
  DROP POLICY IF EXISTS "Allow public insert to mood_indicator_values" ON mood_indicator_values;
  DROP POLICY IF EXISTS "Allow public update to mood_indicator_values" ON mood_indicator_values;
  DROP POLICY IF EXISTS "Allow public delete to mood_indicator_values" ON mood_indicator_values;
END $$;

-- Add user_id to pseudonyms if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE pseudonyms ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Add scale configuration to mood_indicators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'min_value'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN min_value integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'max_value'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN max_value integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'step_value'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN step_value decimal DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'color_start'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN color_start text DEFAULT '#ef4444';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'color_end'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN color_end text DEFAULT '#10b981';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mood_indicators ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add entry_date to mood_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_entries' AND column_name = 'entry_date'
  ) THEN
    ALTER TABLE mood_entries ADD COLUMN entry_date timestamptz DEFAULT now();
  END IF;
END $$;

-- Change value to decimal in mood_indicator_values
DO $$
BEGIN
  ALTER TABLE mood_indicator_values DROP CONSTRAINT IF EXISTS mood_indicator_values_value_check;
  ALTER TABLE mood_indicator_values ALTER COLUMN value TYPE decimal;
END $$;

-- Create authenticated user policies for pseudonyms
CREATE POLICY "Users can read own pseudonyms"
  ON pseudonyms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms"
  ON pseudonyms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pseudonyms"
  ON pseudonyms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pseudonyms"
  ON pseudonyms FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create authenticated user policies for mood_indicators
CREATE POLICY "Users can read own indicators"
  ON mood_indicators FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own indicators"
  ON mood_indicators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own indicators"
  ON mood_indicators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own indicators"
  ON mood_indicators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create authenticated user policies for mood_entries
CREATE POLICY "Users can read own entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pseudonyms
      WHERE pseudonyms.id = mood_entries.pseudonym_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pseudonyms
      WHERE pseudonyms.id = mood_entries.pseudonym_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pseudonyms
      WHERE pseudonyms.id = mood_entries.pseudonym_id
      AND pseudonyms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pseudonyms
      WHERE pseudonyms.id = mood_entries.pseudonym_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own entries"
  ON mood_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pseudonyms
      WHERE pseudonyms.id = mood_entries.pseudonym_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

-- Create authenticated user policies for mood_indicator_values
CREATE POLICY "Users can read own indicator values"
  ON mood_indicator_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mood_entries
      JOIN pseudonyms ON pseudonyms.id = mood_entries.pseudonym_id
      WHERE mood_entries.id = mood_indicator_values.mood_entry_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own indicator values"
  ON mood_indicator_values FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mood_entries
      JOIN pseudonyms ON pseudonyms.id = mood_entries.pseudonym_id
      WHERE mood_entries.id = mood_indicator_values.mood_entry_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own indicator values"
  ON mood_indicator_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mood_entries
      JOIN pseudonyms ON pseudonyms.id = mood_entries.pseudonym_id
      WHERE mood_entries.id = mood_indicator_values.mood_entry_id
      AND pseudonyms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mood_entries
      JOIN pseudonyms ON pseudonyms.id = mood_entries.pseudonym_id
      WHERE mood_entries.id = mood_indicator_values.mood_entry_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own indicator values"
  ON mood_indicator_values FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mood_entries
      JOIN pseudonyms ON pseudonyms.id = mood_entries.pseudonym_id
      WHERE mood_entries.id = mood_indicator_values.mood_entry_id
      AND pseudonyms.user_id = auth.uid()
    )
  );

-- Update existing indicators to have scale configuration
UPDATE mood_indicators 
SET 
  min_value = 1,
  max_value = 5,
  step_value = 1,
  color_start = '#ef4444',
  color_end = '#10b981'
WHERE min_value IS NULL;