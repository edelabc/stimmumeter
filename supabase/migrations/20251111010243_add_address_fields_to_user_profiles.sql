/*
  # Add Address Fields to User Profiles

  1. Changes
    - Add comprehensive address fields to user_profiles table
    - Fields: location_label, street, house_number, house_number_addition, postal_code, city, city_addition, state, country
    - Add is_blocked field for user blocking functionality
  
  2. Security
    - No RLS changes needed - existing policies cover new fields
*/

-- Add address fields to user_profiles
DO $$ 
BEGIN
  -- Location label
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'location_label'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN location_label text;
  END IF;

  -- Street
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'street'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN street text;
  END IF;

  -- House number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'house_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN house_number text;
  END IF;

  -- House number addition
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'house_number_addition'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN house_number_addition text;
  END IF;

  -- Postal code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code text;
  END IF;

  -- City
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;

  -- City addition
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'city_addition'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city_addition text;
  END IF;

  -- State
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN state text;
  END IF;

  -- Country
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text;
  END IF;

  -- Is blocked field for user blocking functionality
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
END $$;
