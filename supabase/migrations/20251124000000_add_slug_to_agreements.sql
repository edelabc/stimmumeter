/*
  # Add Slug Field to Agreements Table

  ## Overview
  This migration adds a `slug` field to the `t_vereinbarungen` table and implements
  automatic slug generation when an agreement status is set to "Unterzeichnet".

  ## Changes

  1. Add `slug` column to `t_vereinbarungen`
  2. Create function to generate slug from agreement title
  3. Create trigger to auto-generate slug when status changes to "Unterzeichnet"
  4. Add unique index on slug
*/

-- Add slug column to t_vereinbarungen
ALTER TABLE t_vereinbarungen 
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug (allowing NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vereinbarungen_slug_unique 
  ON t_vereinbarungen(slug) 
  WHERE slug IS NOT NULL;

-- Create function to generate slug from agreement title
CREATE OR REPLACE FUNCTION generate_agreement_slug(agreement_title text, agreement_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(agreement_title);
  base_slug := replace(base_slug, 'ä', 'ae');
  base_slug := replace(base_slug, 'ö', 'oe');
  base_slug := replace(base_slug, 'ü', 'ue');
  base_slug := replace(base_slug, 'ß', 'ss');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'vereinbarung-' || substring(agreement_id::text from 1 for 8);
  END IF;
  
  -- Check for uniqueness and append counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM t_vereinbarungen WHERE slug = final_slug AND id != agreement_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate slug
CREATE OR REPLACE FUNCTION auto_generate_agreement_slug()
RETURNS TRIGGER AS $$
DECLARE
  agreement_title text;
BEGIN
  -- Only generate slug if status is "Unterzeichnet" and slug is empty
  IF NEW.status = 'Unterzeichnet' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    -- Get title from related titel
    SELECT titel INTO agreement_title
    FROM t_vereinbarungstitel
    WHERE id = NEW.titel_id;
    
    -- Generate slug if title exists
    IF agreement_title IS NOT NULL THEN
      NEW.slug := generate_agreement_slug(agreement_title, NEW.id);
    END IF;
  END IF;
  
  -- If status changes away from "Unterzeichnet", keep slug but don't generate new one
  -- (slug remains for historical reference)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_agreement_slug ON t_vereinbarungen;
CREATE TRIGGER trigger_auto_generate_agreement_slug
  BEFORE INSERT OR UPDATE ON t_vereinbarungen
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_agreement_slug();

-- Update existing "Unterzeichnet" agreements to have slugs
DO $$
DECLARE
  agreement_record RECORD;
  agreement_title text;
BEGIN
  FOR agreement_record IN 
    SELECT v.id, v.titel_id, v.status
    FROM t_vereinbarungen v
    WHERE v.status = 'Unterzeichnet' AND (v.slug IS NULL OR v.slug = '')
  LOOP
    SELECT titel INTO agreement_title
    FROM t_vereinbarungstitel
    WHERE id = agreement_record.titel_id;
    
    IF agreement_title IS NOT NULL THEN
      UPDATE t_vereinbarungen
      SET slug = generate_agreement_slug(agreement_title, agreement_record.id)
      WHERE id = agreement_record.id;
    END IF;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN t_vereinbarungen.slug IS 'URL-friendly identifier for agreement. Auto-generated when status is set to "Unterzeichnet".';


