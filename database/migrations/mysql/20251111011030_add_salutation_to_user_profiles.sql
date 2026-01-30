/*
  # Add Salutation Field to User Profiles

  1. Changes
    - Add salutation field to user_profiles table
    - Values: 'Herr', 'Frau', 'Divers'
  
  2. Security
    - No RLS changes needed - existing policies cover new field
*/

-- Add salutation field to user_profiles