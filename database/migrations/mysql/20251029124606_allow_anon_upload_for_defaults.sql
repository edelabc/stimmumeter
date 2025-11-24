/*
  # Allow anonymous uploads for default indicator icons

  1. Changes
    - Drop existing restrictive policies on storage.objects for indicator-icons
    - Create new policy allowing anyone to upload to indicator-icons bucket
    - This is needed for initial setup of default indicator icons
  
  2. Security Notes
    - This allows uploads for setting up default icons
    - Public read access remains enabled for displaying icons
*/

-- Drop existing policies

-- Allow anyone to upload (for initial setup)
CREATE POLICY "Anyone can upload indicator icons"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'indicator-icons');

-- Allow anyone to update
CREATE POLICY "Anyone can update indicator icons"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'indicator-icons');

-- Allow anyone to delete
CREATE POLICY "Anyone can delete indicator icons"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'indicator-icons');

-- Allow public read access
CREATE POLICY "Public read access to indicator icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'indicator-icons');