/*
  # Fix Menu Item URL Generation for Agreement Links

  ## Overview
  This migration fixes the automatic URL generation for menu items linked to agreements.
  When a menu item is linked to an agreement, the URL should be automatically set to
  `/agreement/{slug}` based on the generated slug.

  ## Changes
  1. Update the `auto_generate_menu_slug()` trigger function to also set the URL field
  2. When `linked_agreement_id` is set, automatically set URL to `/agreement/{slug}`
  3. When `linked_agreement_id` is removed, URL remains as set by user

  ## Notes
  - This ensures consistency between slug and URL
  - Users can still manually override the URL if needed
  - Existing menu items will need to be re-saved to get the correct URL
*/

-- Update the trigger function to also set the URL
CREATE OR REPLACE FUNCTION auto_generate_menu_slug()
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing menu items that have linked_agreement_id but incorrect URL
UPDATE menu_items
SET url = '/agreement/' || slug
WHERE linked_agreement_id IS NOT NULL
  AND slug IS NOT NULL
  AND url != '/agreement/' || slug;

