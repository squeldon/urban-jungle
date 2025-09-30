-- =====================================================
-- Urban Jungle - Row Level Security (RLS) Policies
-- =====================================================
-- This migration sets up RLS policies for all tables
-- =====================================================

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Listings Policies
-- =====================================================

-- Anyone can view active listings
CREATE POLICY "Public can view active listings"
  ON public.listings
  FOR SELECT
  USING (status = 'active');

-- Authenticated users can view all their own listings
CREATE POLICY "Users can view their own listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Authenticated users can create listings
CREATE POLICY "Users can create listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own listings
CREATE POLICY "Users can delete their own listings"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =====================================================
-- Drafts Policies
-- =====================================================

-- Users can only see their own drafts
CREATE POLICY "Users can view their own drafts"
  ON public.drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can create drafts
CREATE POLICY "Users can create drafts"
  ON public.drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own drafts
CREATE POLICY "Users can update their own drafts"
  ON public.drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own drafts"
  ON public.drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =====================================================
-- Listing Presets Policies
-- =====================================================

-- Users can view their own listing presets
CREATE POLICY "Users can view their own listing presets"
  ON public.listing_presets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can create listing presets
CREATE POLICY "Users can create listing presets"
  ON public.listing_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own listing presets
CREATE POLICY "Users can update their own listing presets"
  ON public.listing_presets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own listing presets
CREATE POLICY "Users can delete their own listing presets"
  ON public.listing_presets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =====================================================
-- Filter Presets Policies
-- =====================================================

-- Users can view their own filter presets
CREATE POLICY "Users can view their own filter presets"
  ON public.filter_presets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create filter presets
CREATE POLICY "Users can create filter presets"
  ON public.filter_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own filter presets
CREATE POLICY "Users can update their own filter presets"
  ON public.filter_presets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own filter presets
CREATE POLICY "Users can delete their own filter presets"
  ON public.filter_presets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- Favorites Policies
-- =====================================================

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON public.favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove their own favorites"
  ON public.favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- User Quotas Policies
-- =====================================================

-- Users can view their own quota
CREATE POLICY "Users can view their own quota"
  ON public.user_quotas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own quota (for quota tracking)
CREATE POLICY "Users can update their own quota"
  ON public.user_quotas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own quota record
CREATE POLICY "Users can insert their own quota"
  ON public.user_quotas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Listing Media Policies
-- =====================================================

-- Users can view their own media
CREATE POLICY "Users can view their own media"
  ON public.listing_media
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert media
CREATE POLICY "Users can insert media"
  ON public.listing_media
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media"
  ON public.listing_media
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
