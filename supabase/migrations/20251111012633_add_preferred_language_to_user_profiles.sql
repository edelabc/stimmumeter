/*
  # Add Preferred Language Field to User Profiles

  1. Changes
    - Add preferred_language field to user_profiles table
    - Stores user's preferred language (e.g., Deutsch, English, etc.)
  
  2. Security
    - No RLS changes needed - existing policies cover new field
*/

-- Add preferred_language field to user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferred_language text;
  END IF;
END $$;
