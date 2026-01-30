/*
  # Fix Mood Indicators RLS Policy - Allow Default Indicators

  ## Problem
  The RLS policy for mood_indicators only allowed reading own indicators (user_id = auth.uid()).
  Default indicators with user_id = NULL were blocked.

  ## Solution
  Update the SELECT policy to allow:
  - Own indicators (user_id = auth.uid())
  - Default indicators (user_id IS NULL)
*/

-- Drop and recreate the SELECT policy to allow default indicators
DROP POLICY IF EXISTS "Users can read own indicators" ON mood_indicators;
CREATE POLICY "Users can read own indicators" ON mood_indicators FOR SELECT TO authenticated
  USING (
    user_id IS NULL 
    OR user_id = (select auth.uid())
  );

