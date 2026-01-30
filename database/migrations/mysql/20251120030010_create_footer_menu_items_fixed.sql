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
      - `position` (INT) - Display order
      - `is_active` (TINYINT(1)) - Visibility toggle
      - `linked_agreement_id` (uuid, FK to t_vereinbarungen) - Optional agreement link
      - `slug` (text, unique) - URL-friendly identifier for agreements
      - `category` (text) - Footer section (e.g., "legal", "company", "support")
      - `created_at` (DATETIME)
      - `updated_at` (DATETIME)

  2. Security
    - Enable RLS on footer_menu_items
    - Public can read active items
    - Only admins can modify

  3. Functions & Triggers
    - Reuse existing `generate_slug()` function
    - 

-- Add some default footer items
INSERT INTO footer_menu_items (title, url, position, category) VALUES
  ('Impressum', '/legal/impressum', 1, 'legal'),
  ('Datenschutz', '/legal/datenschutz', 2, 'legal')
ON CONFLICT DO NOTHING;

-- Add comment to table

COMMENT ON COLUMN footer_menu_items.linked_agreement_id IS 'References t_vereinbarungen.id. If set, this footer item displays the linked agreement document.';
COMMENT ON COLUMN footer_menu_items.slug IS 'URL-friendly identifier for dynamic agreement routes. Auto-generated from title when linked_agreement_id is set.';
COMMENT ON COLUMN footer_menu_items.category IS 'Footer section category for organizing items (e.g., legal, company, support).';