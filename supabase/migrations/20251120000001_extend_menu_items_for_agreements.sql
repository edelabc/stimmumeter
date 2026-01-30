/*
  # Extend Menu Items for Agreement Linking

  ## Overview
  This migration extends the menu_items table to support dynamic linking to agreements.
  Each menu item can now be linked to an agreement document, which will be displayed
  when the menu item is clicked.

  ## Changes

  1. Add `linked_agreement_id` column (uuid, nullable, FK to t_vereinbarungen)
  2. Add `slug` column (text, unique, nullable) - URL-friendly identifier
  3. Add `is_dynamic_agreement` computed column (boolean) - true if linked_agreement_id is set
  4. Add function to auto-generate slug from title
  5. Add trigger to auto-generate slug when linked_agreement_id is set
  6. Add unique constraint on slug
  7. Add index on slug for fast lookups

  ## Slug Generation
  - Automatically generated from menu title when linked_agreement_id is set
  - Format: lowercase, replace umlauts, remove special chars, use hyphens
  - Conflict resolution: append -1, -2, etc. if slug exists
  - Example: "AGB & Datenschutz" -> "agb-datenschutz"
*/

-- Add new columns to menu_items
DO $$
BEGIN
  -- Add linked_agreement_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'linked_agreement_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN linked_agreement_id uuid REFERENCES t_vereinbarungen(id) ON DELETE SET NULL;
  END IF;

  -- Add slug column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'slug'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN slug text;
  END IF;

  -- Add icon column (optional, for future use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'icon'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN icon text;
  END IF;
END $$;

-- Create unique index on slug (allowing NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_slug_unique 
  ON menu_items(slug) 
  WHERE slug IS NOT NULL;

-- Create index on linked_agreement_id
CREATE INDEX IF NOT EXISTS idx_menu_items_linked_agreement 
  ON menu_items(linked_agreement_id) 
  WHERE linked_agreement_id IS NOT NULL;

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text text, exclude_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  slug_text text;
  counter integer := 0;
  final_slug text;
BEGIN
  -- Convert to lowercase and replace umlauts
  slug_text := lower(input_text);
  slug_text := replace(slug_text, 'ä', 'ae');
  slug_text := replace(slug_text, 'ö', 'oe');
  slug_text := replace(slug_text, 'ü', 'ue');
  slug_text := replace(slug_text, 'ß', 'ss');
  
  -- Remove special characters, keep only alphanumeric and spaces
  slug_text := regexp_replace(slug_text, '[^a-z0-9\s]', '', 'g');
  
  -- Replace spaces and multiple hyphens with single hyphen
  slug_text := regexp_replace(slug_text, '\s+', '-', 'g');
  slug_text := regexp_replace(slug_text, '-+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  slug_text := trim(both '-' from slug_text);
  
  -- Ensure slug is not empty
  IF slug_text = '' THEN
    slug_text := 'menu-item';
  END IF;
  
  -- Check for conflicts and append counter if needed
  final_slug := slug_text;
  WHILE EXISTS (
    SELECT 1 FROM menu_items 
    WHERE slug = final_slug 
    AND (exclude_id IS NULL OR id != exclude_id)
  ) LOOP
    counter := counter + 1;
    final_slug := slug_text || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug when linked_agreement_id is set
CREATE OR REPLACE FUNCTION auto_generate_menu_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if linked_agreement_id is set and slug is empty
  IF NEW.linked_agreement_id IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  
  -- If linked_agreement_id is removed, clear slug
  IF NEW.linked_agreement_id IS NULL THEN
    NEW.slug := NULL;
  END IF;
  
  -- If title changed and linked_agreement_id is set, regenerate slug
  IF TG_OP = 'UPDATE' AND NEW.linked_agreement_id IS NOT NULL AND OLD.title != NEW.title THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS trigger_auto_generate_menu_slug ON menu_items;
CREATE TRIGGER trigger_auto_generate_menu_slug
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_menu_slug();

-- Function to check if menu item is dynamic agreement (computed)
CREATE OR REPLACE FUNCTION is_dynamic_agreement(menu_item_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM menu_items
    WHERE id = menu_item_id
    AND linked_agreement_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow public access to menu items with linked agreements
-- (This is already covered by existing policies, but we ensure agreements are accessible)

-- Add comment to columns
COMMENT ON COLUMN menu_items.linked_agreement_id IS 'References t_vereinbarungen.id. If set, this menu item displays the linked agreement document.';
COMMENT ON COLUMN menu_items.slug IS 'URL-friendly identifier for dynamic agreement routes. Auto-generated from title when linked_agreement_id is set.';
COMMENT ON COLUMN menu_items.icon IS 'Optional icon identifier for the menu item (e.g., icon name from icon library).';

