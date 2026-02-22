-- Create the recipe-photos storage bucket for user-uploaded recipe images.
-- Bucket is public so photo URLs can be rendered without auth tokens.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-photos',
  'recipe-photos',
  true,
  5242880,  -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos to their household folder
CREATE POLICY "Authenticated users can upload recipe photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-photos');

-- Allow authenticated users to update/overwrite their photos
CREATE POLICY "Authenticated users can update recipe photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipe-photos');

-- Allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete recipe photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-photos');

-- Anyone can view photos (bucket is public, but policy is still needed)
CREATE POLICY "Anyone can view recipe photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'recipe-photos');
