/*
  # Add icon support to mood indicators

  1. Changes
    - Add `icon_url` column to `mood_indicators` table to store uploaded icon images
    - Column accepts text (URL to stored image) and is nullable for backward compatibility
  
  2. Notes
    - Existing indicators will have NULL icon_url (no icon)
    - New indicators can optionally include an icon
    - Icons will be stored in Supabase Storage
*/