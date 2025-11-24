/*
  # Add Preferred Language Field to User Profiles

  1. Changes
    - Add preferred_language field to user_profiles table
    - Stores user's preferred language (e.g., Deutsch, English, etc.)
  
  2. Security
    - No RLS changes needed - existing policies cover new field
*/

-- Add preferred_language field to user_profiles