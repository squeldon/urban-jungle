-- =====================================================
-- Urban Jungle - Listing Functions
-- =====================================================
-- These functions help manage listing operations atomically
-- =====================================================

-- Function to increment listing view count atomically
CREATE OR REPLACE FUNCTION increment_listing_view_count(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings
  SET 
    views = views + 1,
    updated_at = now()
  WHERE id = listing_id;
END;
$$;

-- =====================================================
-- Grant execute permissions to authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION increment_listing_view_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_view_count(uuid) TO anon;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION increment_listing_view_count IS 'Atomically increment view count for a listing';
