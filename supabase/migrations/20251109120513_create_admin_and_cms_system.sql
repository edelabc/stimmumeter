/*
  # Admin & CMS System

  1. New Tables
    - `admin_users`
      - Links users to admin role
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `menu_items`
      - Stores customizable menu items
      - `id` (uuid, primary key)
      - `title` (text)
      - `url` (text)
      - `position` (integer for ordering)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `footer_settings`
      - Stores footer configuration
      - `id` (uuid, primary key, single row)
      - `content` (jsonb for flexible footer data)
      - `updated_at` (timestamp)
    
    - `legal_pages`
      - Stores legal content (Impressum, DSGVO, etc)
      - `id` (uuid, primary key)
      - `page_type` (text: impressum, dsgvo, cookies, datenschutz)
      - `title` (text)
      - `content` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `site_settings`
      - General site settings
      - `id` (uuid, primary key, single row)
      - `site_name` (text)
      - `site_description` (text)
      - `meta_keywords` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Admin users can manage all content
    - Public users can read active menu items and legal pages
    - Only authenticated users in admin_users table can modify data
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active menu items"
  ON menu_items FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Footer settings table
CREATE TABLE IF NOT EXISTS footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view footer settings"
  ON footer_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can update footer settings"
  ON footer_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert footer settings"
  ON footer_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Legal pages table
CREATE TABLE IF NOT EXISTS legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text UNIQUE NOT NULL CHECK (page_type IN ('impressum', 'dsgvo', 'cookies', 'datenschutz')),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active legal pages"
  ON legal_pages FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all legal pages"
  ON legal_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert legal pages"
  ON legal_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update legal pages"
  ON legal_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete legal pages"
  ON legal_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'Stimmungs-Tracker',
  site_description text DEFAULT 'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden',
  meta_keywords text DEFAULT 'Stimmung, Tracker, Mental Health, Wohlbefinden',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Insert default data
INSERT INTO site_settings (site_name, site_description, meta_keywords)
VALUES (
  'Stimmungs-Tracker',
  'Verfolge deine Stimmung und finde Muster in deinem emotionalen Wohlbefinden',
  'Stimmung, Tracker, Mental Health, Wohlbefinden'
) ON CONFLICT DO NOTHING;

INSERT INTO footer_settings (content)
VALUES ('{"text": "© 2025 Stimmungs-Tracker. Alle Rechte vorbehalten.", "links": []}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO legal_pages (page_type, title, content)
VALUES 
  ('impressum', 'Impressum', 'Bitte füge hier deine Impressumsinformationen ein.'),
  ('dsgvo', 'DSGVO', 'Informationen zur DSGVO und Datenschutz-Grundverordnung.'),
  ('cookies', 'Cookie-Richtlinie', 'Informationen zur Verwendung von Cookies.'),
  ('datenschutz', 'Datenschutzbestimmungen', 'Detaillierte Datenschutzbestimmungen.')
ON CONFLICT (page_type) DO NOTHING;

INSERT INTO menu_items (title, url, position)
VALUES 
  ('Home', '/', 1),
  ('App', '/app', 2),
  ('Über uns', '/about', 3)
ON CONFLICT DO NOTHING;