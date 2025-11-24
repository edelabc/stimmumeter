/*
  # Add Admin Permissions for Standard Indicators
  
  ## Overview
  This migration adds RLS policies to allow admin users to manage standard indicators
  (indicators with user_id = NULL). Regular users can only manage their own indicators.
  
  ## Changes
  - Add policies for INSERT, UPDATE, DELETE on mood_indicators for admins
  - Admins can create, update, and delete standard indicators (user_id IS NULL)
  - Regular users can still only manage their own indicators (user_id = auth.uid())
  
  ## Security
  - Uses is_admin() function to check admin status
  - Standard indicators (user_id IS NULL) can only be managed by admins
  - User-specific indicators remain protected by existing policies
*/

-- Ensure is_admin function exists (it should from previous migrations)

-- Drop existing INSERT policy and recreate with admin support

CREATE POLICY "Users can insert own indicators" ON mood_indicators FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR (user_id IS NULL AND is_admin((select auth.uid())))
  );

-- Drop existing UPDATE policy and recreate with admin support

CREATE POLICY "Users can update own indicators" ON mood_indicators FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (user_id IS NULL AND is_admin((select auth.uid())))
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR (user_id IS NULL AND is_admin((select auth.uid())))
  );

-- Drop existing DELETE policy and recreate with admin support

CREATE POLICY "Users can delete own indicators" ON mood_indicators FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (user_id IS NULL AND is_admin((select auth.uid())))
  );