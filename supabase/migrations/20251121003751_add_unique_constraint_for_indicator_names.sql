/*
  # Add Unique Constraint for Indicator Names
  
  ## Overview
  This migration adds unique constraints to ensure that:
  1. Standard indicators (user_id IS NULL) have unique names
  2. User-specific indicators have unique names per user
  
  ## Changes
  - Create partial unique index for standard indicators (user_id IS NULL)
  - Create unique index for user-specific indicators (name, user_id)
  
  ## Notes
  - PostgreSQL treats NULL values specially in unique constraints
  - Multiple NULL values are allowed in a regular UNIQUE constraint
  - Partial indexes allow us to handle NULL values correctly
*/

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_mood_indicators_name_unique_standard;
DROP INDEX IF EXISTS idx_mood_indicators_name_user_unique;

-- Create partial unique index for standard indicators (user_id IS NULL)
-- This ensures that standard indicator names are unique
CREATE UNIQUE INDEX idx_mood_indicators_name_unique_standard
ON mood_indicators (LOWER(TRIM(name)))
WHERE user_id IS NULL;

-- Create unique index for user-specific indicators (name, user_id)
-- This ensures that each user can only have one indicator with a given name
CREATE UNIQUE INDEX idx_mood_indicators_name_user_unique
ON mood_indicators (LOWER(TRIM(name)), user_id)
WHERE user_id IS NOT NULL;

