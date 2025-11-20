/*
  # Add Personal Data Fields to Pseudonyms

  1. Changes
    - Add `age` column to pseudonyms table (integer, optional)
    - Add `gender` column to pseudonyms table (text, optional)
    - Add `weight` column to pseudonyms table (decimal, optional, in kg)
    - Add `height` column to pseudonyms table (decimal, optional, in cm)
    - Add `occupation` column to pseudonyms table (text, optional)
  
  2. Purpose
    - Enable storing personal data for pseudonyms to improve AI-based analysis
    - All fields are optional to maintain flexibility
    - Data can be extended in future as needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'age'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'gender'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'weight'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN weight numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'height'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN height numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'occupation'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN occupation text;
  END IF;
END $$;