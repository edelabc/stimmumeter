/*
  # Fix Admin Users RLS Policies
  
  1. Problem
    - The "Admins can view all admin users" policy has a recursive check using is_admin()
    - This can cause issues when checking admin status
  
  2. Solution
    - Simplify the SELECT policy to only check if user is checking their own status
    - Remove the redundant policy that causes recursion
  
  3. Security
    - Users can only check if THEY are admin
    - This prevents infinite recursion while maintaining security
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;

-- The "Users can check their own admin status" policy is sufficient
-- It allows: SELECT * FROM admin_users WHERE user_id = auth.uid()
-- Which is exactly what checkCurrentUserIsAdmin() needs
