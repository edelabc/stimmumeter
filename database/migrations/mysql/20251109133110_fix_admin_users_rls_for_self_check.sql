/*
  # Fix Admin Users RLS for Self-Check

  1. Problem
    - Users cannot check if they themselves are admin due to restrictive RLS
    - The is_admin() function is SECURITY DEFINER but RLS still blocks
    
  2. Solution
    - Add policy allowing users to check their own admin status
    - Keep other policies restrictive (only admins can manage admins)
    
  3. Changes
    - Add policy for users to read their own admin status
*/

-- Drop old restrictive SELECT policy

-- Allow users to check if they themselves are admin
CREATE POLICY "Users can check their own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all admin users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );