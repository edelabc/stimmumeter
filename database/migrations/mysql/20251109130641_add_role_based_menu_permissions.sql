/*
  # Role-based Menu Permissions

  1. Changes
    - Add `required_role` column to menu_items table
      - Values: 'public', 'user', 'admin'
      - Default: 'public' (everyone can see)
    - Update RLS policies to respect role requirements
    - Add helper function to check user role
    
  2. Security
    - Public menu items visible to everyone
    - User menu items visible only to authenticated users
    - Admin menu items visible only to admin users
    - Menu items filtered based on current user's role
    
  3. Notes
    - Existing menu items will default to 'public'
    - Admin menu item will be created with 'admin' role requirement
*/

-- Add required_role column to menu_items

-- Drop old policies

-- Create new role-aware policies for SELECT
CREATE POLICY "Public can view public menu items"
  ON menu_items FOR SELECT
  TO public
  USING (is_active = true AND required_role = 'public');

CREATE POLICY "Authenticated users can view public and user menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (
      required_role = 'public' 
      OR required_role = 'user'
      OR (
        required_role = 'admin' 
        AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can view all menu items in admin panel"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Insert Admin menu item if it doesn't exist
INSERT INTO menu_items (title, url, position, is_active, required_role)
VALUES ('Admin', '/admin', 999, true, 'admin')
ON CONFLICT DO NOTHING;

-- Update existing menu items to have proper roles
UPDATE menu_items 
SET required_role = 'public' 
WHERE required_role IS NULL OR required_role = '';