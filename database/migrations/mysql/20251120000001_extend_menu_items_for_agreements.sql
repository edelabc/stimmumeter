/*
  # Extend Menu Items for Agreement Linking

  ## Overview
  This migration extends the menu_items table to support dynamic linking to agreements.
  Each menu item can now be linked to an agreement document, which will be displayed
  when the menu item is clicked.

  ## Changes

  1. Add `linked_agreement_id` column (uuid, nullable, FK to t_vereinbarungen)
  2. Add `slug` column (text, unique, nullable) - URL-friendly identifier
  3. Add `is_dynamic_agreement` computed column (TINYINT(1)) - true if linked_agreement_id is set
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

-- Create unique index on slug (allowing NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_slug_unique 
  ON menu_items(slug) 
  WHERE slug IS NOT NULL;

-- Create index on linked_agreement_id
CREATE INDEX IF NOT EXISTS idx_menu_items_linked_agreement 
  ON menu_items(linked_agreement_id) 
  WHERE linked_agreement_id IS NOT NULL;

-- Function to generate slug from text

-- Function to auto-generate slug when linked_agreement_id is set

-- 

-- Function to check if menu item is dynamic agreement (computed)

-- Update RLS policies to allow public access to menu items with linked agreements
-- (This is already covered by existing policies, but we ensure agreements are accessible)

-- Add comment to columns
COMMENT ON COLUMN menu_items.linked_agreement_id IS 'References t_vereinbarungen.id. If set, this menu item displays the linked agreement document.';
COMMENT ON COLUMN menu_items.slug IS 'URL-friendly identifier for dynamic agreement routes. Auto-generated from title when linked_agreement_id is set.';
COMMENT ON COLUMN menu_items.icon IS 'Optional icon identifier for the menu item (e.g., icon name from icon library).';