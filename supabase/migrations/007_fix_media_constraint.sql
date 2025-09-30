-- =====================================================
-- Migration: Fix listing_media constraint to allow temporary uploads
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.listing_media 
  DROP CONSTRAINT IF EXISTS listing_media_check;

-- Add a new constraint that allows both to be NULL (for temporary uploads)
-- but ensures they are not BOTH non-null at the same time
ALTER TABLE public.listing_media
  ADD CONSTRAINT listing_media_check CHECK (
    -- Allow all NULL (temporary uploads)
    (listing_id IS NULL AND draft_id IS NULL) OR
    -- Allow listing only
    (listing_id IS NOT NULL AND draft_id IS NULL) OR
    -- Allow draft only
    (listing_id IS NULL AND draft_id IS NOT NULL)
  );

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT listing_media_check ON public.listing_media IS 
  'Ensures media belongs to at most one of: listing, draft, or temporary (neither)';
