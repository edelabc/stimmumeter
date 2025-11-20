/*
  # Add Location and Language Fields to Pseudonyms

  ## Overview
  This migration adds detailed location information and language preference
  to the pseudonyms table for better personalization.

  ## Changes

  ### 1. New Columns in `pseudonyms`
    - `country` (text) - Country (Land)
    - `state` (text) - State/Province (Bundesland)
    - `city` (text) - City (Ort)
    - `city_addition` (text) - City addition (Ortzusatz)
    - `street` (text) - Street name (Strasse)
    - `house_number` (text) - House number (Hausnummer)
    - `house_number_addition` (text) - House number addition (Hausnummerzusatz)
    - `language` (text) - Preferred language (Sprache)

  ## Important Notes
  1. All new fields are nullable for backward compatibility
  2. Existing pseudonyms will have NULL values for new fields
  3. These fields are optional and used for enhanced personalization
*/

-- Add location fields to pseudonyms table
DO $$
BEGIN
  -- Add country column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'country'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN country text;
    COMMENT ON COLUMN pseudonyms.country IS 'Country (Land)';
  END IF;

  -- Add state column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'state'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN state text;
    COMMENT ON COLUMN pseudonyms.state IS 'State/Province (Bundesland)';
  END IF;

  -- Add city column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'city'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN city text;
    COMMENT ON COLUMN pseudonyms.city IS 'City (Ort)';
  END IF;

  -- Add city_addition column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'city_addition'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN city_addition text;
    COMMENT ON COLUMN pseudonyms.city_addition IS 'City addition (Ortzusatz)';
  END IF;

  -- Add street column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'street'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN street text;
    COMMENT ON COLUMN pseudonyms.street IS 'Street name (Strasse)';
  END IF;

  -- Add house_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'house_number'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN house_number text;
    COMMENT ON COLUMN pseudonyms.house_number IS 'House number (Hausnummer)';
  END IF;

  -- Add house_number_addition column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'house_number_addition'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN house_number_addition text;
    COMMENT ON COLUMN pseudonyms.house_number_addition IS 'House number addition (Hausnummerzusatz)';
  END IF;

  -- Add language column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pseudonyms' AND column_name = 'language'
  ) THEN
    ALTER TABLE pseudonyms ADD COLUMN language text;
    COMMENT ON COLUMN pseudonyms.language IS 'Preferred language (Sprache)';
  END IF;
END $$;

-- Create indexes for better query performance on frequently searched fields
CREATE INDEX IF NOT EXISTS idx_pseudonyms_country ON pseudonyms(country);
CREATE INDEX IF NOT EXISTS idx_pseudonyms_city ON pseudonyms(city);
CREATE INDEX IF NOT EXISTS idx_pseudonyms_language ON pseudonyms(language);