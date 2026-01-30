/*
  # Create Indicator Categories System
  
  ## Overview
  This migration creates a category system for mood indicators with 3 standard categories
  based on psychological research (valence: positive, neutral, negative).
  
  ## New Tables
  - `indicator_categories`: Stores categories with name and description
  - Adds `category_id` to `mood_indicators` table
  
  ## Standard Categories
  1. Positive Stimmung (VALENZ POSITIV)
  2. Neutrale / Ambivalente Stimmung (VALENZ NEUTRAL / GEMISCHT)
  3. Negative Stimmung (VALENZ NEGATIV)
*/

-- Create indicator_categories table
CREATE TABLE IF NOT EXISTS indicator_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE indicator_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for indicator_categories
-- Everyone can read categories (they are public)
CREATE POLICY "Anyone can read categories"
  ON indicator_categories FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
  ON indicator_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON indicator_categories FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON indicator_categories FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add category_id to mood_indicators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_indicators' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE mood_indicators 
    ADD COLUMN category_id uuid REFERENCES indicator_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mood_indicators_category_id 
ON mood_indicators(category_id);

-- Insert the 3 standard categories
INSERT INTO indicator_categories (name, description) VALUES
  (
    'Positive Stimmung (VALENZ POSITIV)',
    'Emotionen, die Wohlbefinden, Freude, Energie oder soziale Offenheit ausdrücken.'
  ),
  (
    'Neutrale / Ambivalente Stimmung (VALENZ NEUTRAL / GEMISCHT)',
    'Zustände, die weder klar positiv noch klar negativ sind – z. B. rational, ruhig, konzentriert, wissbegierig, ausgeglichen, ernst.'
  ),
  (
    'Negative Stimmung (VALENZ NEGATIV)',
    'Emotionen, die Stress, Angst, Ablehnung, Müdigkeit, Rückzug oder Gereiztheit zeigen.'
  )
ON CONFLICT (name) DO NOTHING;

