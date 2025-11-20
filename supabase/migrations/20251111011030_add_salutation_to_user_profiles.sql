/*
  # Add Salutation Field to User Profiles

  1. Changes
    - Add salutation field to user_profiles table
    - Values: 'Herr', 'Frau', 'Divers'
  
  2. Security
    - No RLS changes needed - existing policies cover new field
*/

-- Add salutation field to user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'salutation'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN salutation text;
  END IF;
END $$;
