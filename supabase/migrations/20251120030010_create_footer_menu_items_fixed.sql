/*
  # Create Footer Menu Items System

  ## Overview
  This migration creates a dedicated system for managing footer menu items separately
  from header menu items. Footer items can also be linked to agreements, just like
  header menu items.

  ## Changes

  1. New Tables
    - `footer_menu_items` - Stores footer navigation links
      - `id` (uuid, primary key)
      - `title` (text) - Display name
      - `url` (text) - Link URL
      - `position` (integer) - Display order
      - `is_active` (boolean) - Visibility toggle
      - `linked_agreement_id` (uuid, FK to t_vereinbarungen) - Optional agreement link
      - `slug` (text, unique) - URL-friendly identifier for agreements
      - `category` (text) - Footer section (e.g., "legal", "company", "support")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on footer_menu_items
    - Public can read active items
    - Only admins can modify

  3. Functions & Triggers
    - Reuse existing `generate_slug()` function
    - Create trigger for auto-generating slug for footer items
    - Auto-update URL when linked to agreement

  ## Notes
  - Footer items are separate from header items for better organization
  - Same agreement linking mechanism as header menu items
  - Supports categorization for multi-column footer layouts
*/

-- Create footer_menu_items table
CREATE TABLE IF NOT EXISTS footer_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL DEFAULT '/',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  linked_agreement_id uuid REFERENCES t_vereinbarungen(id) ON DELETE SET NULL,
  slug text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_footer_menu_items_slug_unique 
  ON footer_menu_items(slug) 
  WHERE slug IS NOT NULL;

-- Create index on linked_agreement_id
CREATE INDEX IF NOT EXISTS idx_footer_menu_items_linked_agreement 
  ON footer_menu_items(linked_agreement_id) 
  WHERE linked_agreement_id IS NOT NULL;

-- Create index on category and position for efficient queries
CREATE INDEX IF NOT EXISTS idx_footer_menu_items_category_position 
  ON footer_menu_items(category, position);

-- Enable RLS
ALTER TABLE footer_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read active footer menu items
CREATE POLICY "Public can read active footer menu items"
  ON footer_menu_items FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can read all footer menu items
CREATE POLICY "Authenticated users can read all footer menu items"
  ON footer_menu_items FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert footer menu items
CREATE POLICY "Admins can insert footer menu items"
  ON footer_menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Only admins can update footer menu items
CREATE POLICY "Admins can update footer menu items"
  ON footer_menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Only admins can delete footer menu items
CREATE POLICY "Admins can delete footer menu items"
  ON footer_menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Create trigger function for auto-generating slug for footer items
CREATE OR REPLACE FUNCTION auto_generate_footer_menu_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if linked_agreement_id is set and slug is empty
  IF NEW.linked_agreement_id IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
    NEW.url := '/agreement/' || NEW.slug;
  END IF;
  
  -- If linked_agreement_id is removed, clear slug but keep URL
  IF NEW.linked_agreement_id IS NULL AND OLD.linked_agreement_id IS NOT NULL THEN
    NEW.slug := NULL;
  END IF;
  
  -- If title changed and linked_agreement_id is set, regenerate slug and URL
  IF TG_OP = 'UPDATE' AND NEW.linked_agreement_id IS NOT NULL AND OLD.title != NEW.title THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
    NEW.url := '/agreement/' || NEW.slug;
  END IF;
  
  -- If slug changed manually and linked_agreement_id is set, update URL
  IF TG_OP = 'UPDATE' AND NEW.linked_agreement_id IS NOT NULL AND 
     (OLD.slug IS NULL OR NEW.slug != OLD.slug) AND NEW.slug IS NOT NULL THEN
    NEW.url := '/agreement/' || NEW.slug;
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS trigger_auto_generate_footer_menu_slug ON footer_menu_items;
CREATE TRIGGER trigger_auto_generate_footer_menu_slug
  BEFORE INSERT OR UPDATE ON footer_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_footer_menu_slug();

-- Add some default footer items
INSERT INTO footer_menu_items (title, url, position, category) VALUES
  ('Impressum', '/legal/impressum', 1, 'legal'),
  ('Datenschutz', '/legal/datenschutz', 2, 'legal')
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE footer_menu_items IS 'Footer navigation menu items with optional agreement linking';
COMMENT ON COLUMN footer_menu_items.linked_agreement_id IS 'References t_vereinbarungen.id. If set, this footer item displays the linked agreement document.';
COMMENT ON COLUMN footer_menu_items.slug IS 'URL-friendly identifier for dynamic agreement routes. Auto-generated from title when linked_agreement_id is set.';
COMMENT ON COLUMN footer_menu_items.category IS 'Footer section category for organizing items (e.g., legal, company, support).';

