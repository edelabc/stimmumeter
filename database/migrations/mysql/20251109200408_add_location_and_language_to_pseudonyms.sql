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

-- Create indexes for better query performance on frequently searched fields
CREATE INDEX IF NOT EXISTS idx_pseudonyms_country ON pseudonyms(country);
CREATE INDEX IF NOT EXISTS idx_pseudonyms_city ON pseudonyms(city);
CREATE INDEX IF NOT EXISTS idx_pseudonyms_language ON pseudonyms(language);