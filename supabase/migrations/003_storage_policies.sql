-- =====================================================
-- Urban Jungle - Storage Bucket Policies
-- =====================================================
-- These policies control access to the 'listings' storage bucket
-- =====================================================

-- Policy 1: Public can view all files in the listings bucket
CREATE POLICY "Public can view listing media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'listings');

-- Policy 2: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload their own media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Authenticated users can update their own files
CREATE POLICY "Users can update their own media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Authenticated users can delete their own files
CREATE POLICY "Users can delete their own media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- Notes:
-- =====================================================
-- File path structure: listings/{user_id}/{listing_id}/{filename}
-- Example: listings/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/image1.jpg
--
-- (storage.foldername(name))[1] extracts the first folder in the path (user_id)
-- auth.uid() returns the authenticated user's UUID
-- This ensures users can only manage files in their own folder
