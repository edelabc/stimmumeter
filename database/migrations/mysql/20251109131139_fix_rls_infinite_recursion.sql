/*
  # Fix RLS Infinite Recursion

  1. Problem
    - The menu_items policies create infinite recursion by checking admin_users
    - admin_users policies also check admin_users creating a loop
    
  2. Solution
    - Simplify policies to avoid recursion
    - Use direct auth.uid() checks instead of subqueries where possible
    - Separate policies for admin management vs public access
    
  3. Changes
    - Drop all existing policies on menu_items
    - Create new simplified policies
    - Ensure no circular dependencies
*/

-- Drop all existing menu_items policies

-- Create function to check if user is admin (no recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS TINYINT(1) AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- New policies for menu_items (no recursion)
CREATE POLICY "Anyone can view active menu items"
  ON menu_items FOR SELECT
  USING (
    is_active = true AND (
      required_role = 'public'
      OR (required_role = 'user' AND auth.uid() IS NOT NULL)
      OR (required_role = 'admin' AND is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));