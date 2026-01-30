/*
  # Fix Admin Menu Visibility

  1. Problem
    - The is_admin function was not being called correctly in the RLS policy
    - Need to ensure admin users can see admin menu items
    
  2. Solution
    - Recreate the RLS policy with proper TINYINT(1) evaluation
    - Ensure the function is called with the correct auth.uid()
*/

-- Drop existing policy

-- Recreate the policy with better logic
CREATE POLICY "Users can view menu items based on role"
  ON menu_items FOR SELECT
  USING (
    is_active = true 
    AND (
      -- Public items visible to everyone
      required_role = 'public'
      -- User items visible to authenticated users
      OR (required_role = 'user' AND auth.uid() IS NOT NULL)
      -- Admin items visible to admins only
      OR (required_role = 'admin' AND auth.uid() IS NOT NULL AND is_admin(auth.uid()))
    )
  );