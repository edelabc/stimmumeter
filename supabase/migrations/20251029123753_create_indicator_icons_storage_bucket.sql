/*
  # Create storage bucket for indicator icons

  1. New Storage Bucket
    - Create `indicator-icons` bucket for storing mood indicator icons
    - Public bucket so icons can be displayed without authentication
  
  2. Security
    - Allow authenticated users to upload icons
    - Allow public read access to display icons
    - File size limit: 2MB per file
    - Allowed file types: image/jpeg, image/png, image/svg+xml
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('indicator-icons', 'indicator-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload indicator icons" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update indicator icons" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete indicator icons" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to indicator icons" ON storage.objects;
END $$;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload indicator icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'indicator-icons');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update indicator icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'indicator-icons');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete indicator icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'indicator-icons');

-- Allow public read access
CREATE POLICY "Public read access to indicator icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'indicator-icons');
