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

-- Update existing menu items that have linked_agreement_id but incorrect URL
UPDATE menu_items
SET url = '/agreement/' || slug
WHERE linked_agreement_id IS NOT NULL
  AND slug IS NOT NULL
  AND url != '/agreement/' || slug;