/*
  # Fix user profiles trigger

  1. Changes
    - Remove old trigger on auth.users
    - Use proper Supabase webhook approach
    - Simplify user profile creation
    
  2. Notes
    - Supabase handles auth.users internally
    - We'll remove the automatic profile creation
    - Profiles will be created on first app usage instead
*/

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- We'll handle user profile creation differently
-- Remove the trigger approach and let the app handle it