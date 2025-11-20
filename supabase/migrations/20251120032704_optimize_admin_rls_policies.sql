/*
  # Optimize Admin RLS Policies

  ## Overview
  Optimize RLS policies for admin-controlled tables

  ## Changes
  - menu_items
  - footer_menu_items
  - legal_pages
  - site_settings
  - footer_settings
  - admin_users
  - ai_provider_settings
*/

-- MENU_ITEMS
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
CREATE POLICY "Admins can insert menu items" ON menu_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
CREATE POLICY "Admins can update menu items" ON menu_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;
CREATE POLICY "Admins can delete menu items" ON menu_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can view menu items based on role" ON menu_items;
CREATE POLICY "Users can view menu items based on role" ON menu_items FOR SELECT TO authenticated
  USING (
    required_role = 'public' 
    OR (required_role = 'user' AND (select auth.uid()) IS NOT NULL)
    OR (required_role = 'admin' AND EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  );

-- FOOTER_MENU_ITEMS
DROP POLICY IF EXISTS "Admins can insert footer menu items" ON footer_menu_items;
CREATE POLICY "Admins can insert footer menu items" ON footer_menu_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update footer menu items" ON footer_menu_items;
CREATE POLICY "Admins can update footer menu items" ON footer_menu_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete footer menu items" ON footer_menu_items;
CREATE POLICY "Admins can delete footer menu items" ON footer_menu_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- LEGAL_PAGES
DROP POLICY IF EXISTS "Admins can view all legal pages" ON legal_pages;
CREATE POLICY "Admins can view all legal pages" ON legal_pages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert legal pages" ON legal_pages;
CREATE POLICY "Admins can insert legal pages" ON legal_pages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update legal pages" ON legal_pages;
CREATE POLICY "Admins can update legal pages" ON legal_pages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete legal pages" ON legal_pages;
CREATE POLICY "Admins can delete legal pages" ON legal_pages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
CREATE POLICY "Admins can insert site settings" ON site_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
CREATE POLICY "Admins can update site settings" ON site_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- FOOTER_SETTINGS
DROP POLICY IF EXISTS "Admins can insert footer settings" ON footer_settings;
CREATE POLICY "Admins can insert footer settings" ON footer_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can update footer settings" ON footer_settings;
CREATE POLICY "Admins can update footer settings" ON footer_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- ADMIN_USERS
DROP POLICY IF EXISTS "Users can check their own admin status" ON admin_users;
CREATE POLICY "Users can check their own admin status" ON admin_users FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
CREATE POLICY "Admins can insert admin users" ON admin_users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete admin users" ON admin_users;
CREATE POLICY "Admins can delete admin users" ON admin_users FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

-- AI_PROVIDER_SETTINGS
DROP POLICY IF EXISTS "Admin users can view AI provider settings" ON ai_provider_settings;
CREATE POLICY "Admin users can view AI provider settings" ON ai_provider_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admin users can update AI provider settings" ON ai_provider_settings;
CREATE POLICY "Admin users can update AI provider settings" ON ai_provider_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = (select auth.uid())));

