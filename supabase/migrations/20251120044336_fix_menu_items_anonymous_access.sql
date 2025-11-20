/*
  # Fix Menu Items Access for Anonymous Users

  1. Changes
    - Add policy to allow anonymous users to view public menu items
    - This enables the hamburger menu to work on all pages, including for non-logged-in users
  
  2. Security
    - Only SELECT access is granted
    - Only items marked as active can be viewed
    - No write access for anonymous users
*/

-- Drop the existing SELECT policy and recreate with anon access
DROP POLICY IF EXISTS "Users can view menu items based on role" ON menu_items;

-- Create new policy that allows both authenticated and anonymous users to view active menu items
CREATE POLICY "Everyone can view active menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (
      required_role = 'public'
      OR (required_role = 'user' AND auth.uid() IS NOT NULL)
      OR (required_role = 'admin' AND EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
      ))
    )
  );

