-- =====================================================
-- Urban Jungle - Initial Schema Migration
-- =====================================================
-- This migration creates all necessary tables and policies
-- for the Urban Jungle real estate wholesale platform
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: listings
-- Main table for active property listings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2),
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'duplex', 'triplex', 'fourplex', 'land', 'commercial')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('wholesale', 'sale', 'rent')),
  
  -- Property details
  bedrooms INTEGER,
  bathrooms NUMERIC(3, 1),
  square_feet INTEGER,
  lot_size NUMERIC(10, 2),
  year_built INTEGER,
  
  -- Wholesale-specific fields
  arv NUMERIC(12, 2), -- After Repair Value
  repair_costs NUMERIC(12, 2),
  wholesale_fee NUMERIC(12, 2),
  property_condition TEXT CHECK (property_condition IN ('excellent', 'good', 'fair', 'needs-cosmetic', 'needs-full-rehab', 'tear-down')),
  occupancy_status TEXT CHECK (occupancy_status IN ('vacant', 'owner-occupied', 'tenant-occupied', 'partially-occupied')),
  monthly_rent NUMERIC(10, 2),
  
  -- Address (stored as JSONB for flexibility)
  address JSONB NOT NULL,
  -- Example: {
  --   "houseNumber": "1234",
  --   "streetName": "Main Street",
  --   "street": "1234 Main Street",
  --   "city": "Los Angeles",
  --   "state": "CA",
  --   "zipCode": "90001",
  --   "country": "USA"
  -- }
  
  -- Coordinates (for map features)
  coordinates JSONB,
  -- Example: { "lat": 34.0522, "lng": -118.2437 }
  
  -- Features and amenities (stored as arrays)
  features TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  
  -- Media (URLs to Supabase Storage)
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  media TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  
  -- Contact information
  contact_info JSONB NOT NULL,
  -- Example: {
  --   "name": "John Doe",
  --   "phone": "+1-555-0100",
  --   "email": "john@example.com",
  --   "isOwner": true,
  --   "agencyName": "ABC Realty",
  --   "isWholesaler": false
  -- }
  
  -- Deal terms
  deal_terms JSONB,
  -- Example: {
  --   "financingOptions": ["cash-only", "seller-financing"],
  --   "earnestMoneyDeposit": 5000,
  --   "proofOfFundsRequired": true,
  --   "showingInstructions": "Call 24h in advance",
  --   "appointmentRequired": true,
  --   "accessRestrictions": "Tenant occupied"
  -- }
  
  -- Comparable sales data
  comps JSONB,
  -- Example: [{
  --   "address": "1200 Main St",
  --   "salePrice": 450000,
  --   "saleDate": "2024-01-15",
  --   "squareFeet": 2000,
  --   "bedrooms": 3,
  --   "bathrooms": 2,
  --   "daysOnMarket": 30,
  --   "distanceFromSubject": 0.5,
  --   "notes": "Similar condition"
  -- }]
  
  -- Listing metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'sold', 'rented', 'withdrawn')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  views INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: drafts
-- Unpublished draft listings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  draft_name TEXT, -- Optional custom name for the draft
  
  -- All fields optional (partial listing data)
  title TEXT,
  description TEXT,
  price NUMERIC(12, 2),
  property_type TEXT CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'duplex', 'triplex', 'fourplex', 'land', 'commercial')),
  listing_type TEXT CHECK (listing_type IN ('wholesale', 'sale', 'rent')),
  
  bedrooms INTEGER,
  bathrooms NUMERIC(3, 1),
  square_feet INTEGER,
  lot_size NUMERIC(10, 2),
  year_built INTEGER,
  
  arv NUMERIC(12, 2),
  repair_costs NUMERIC(12, 2),
  wholesale_fee NUMERIC(12, 2),
  property_condition TEXT CHECK (property_condition IN ('excellent', 'good', 'fair', 'needs-cosmetic', 'needs-full-rehab', 'tear-down')),
  occupancy_status TEXT CHECK (occupancy_status IN ('vacant', 'owner-occupied', 'tenant-occupied', 'partially-occupied')),
  monthly_rent NUMERIC(10, 2),
  
  address JSONB,
  coordinates JSONB,
  
  features TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  media TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  
  contact_info JSONB,
  deal_terms JSONB,
  comps JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: listing_presets
-- Reusable templates for listing forms
-- =====================================================
CREATE TABLE IF NOT EXISTS public.listing_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL, -- Stores partial listing data
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: filter_presets
-- Saved search filters
-- =====================================================
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  filters JSONB NOT NULL, -- Stores filter configuration
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: favorites
-- User favorites (many-to-many relationship)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can only favorite a listing once
  UNIQUE(user_id, listing_id)
);

-- =====================================================
-- Table: user_quotas
-- Track storage usage and upload limits
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  monthly_uploads_count INTEGER NOT NULL DEFAULT 0,
  
  -- Quota reset tracking
  quota_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: listing_media
-- Track uploaded media files for quotas and cleanup
-- =====================================================
CREATE TABLE IF NOT EXISTS public.listing_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  storage_object_path TEXT NOT NULL, -- Path in Supabase Storage
  mime_type TEXT,
  bytes BIGINT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Media belongs to either a listing or a draft, not both
  CHECK (
    (listing_id IS NOT NULL AND draft_id IS NULL) OR
    (listing_id IS NULL AND draft_id IS NOT NULL)
  )
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Listings indexes
CREATE INDEX idx_listings_created_by ON public.listings(created_by);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_property_type ON public.listings(property_type);
CREATE INDEX idx_listings_listing_type ON public.listings(listing_type);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_created_at_desc ON public.listings(created_at DESC);
CREATE INDEX idx_listings_features_gin ON public.listings USING GIN(features);
CREATE INDEX idx_listings_amenities_gin ON public.listings USING GIN(amenities);
CREATE INDEX idx_listings_tags_gin ON public.listings USING GIN(tags);
CREATE INDEX idx_listings_address_gin ON public.listings USING GIN(address);

-- Drafts indexes
CREATE INDEX idx_drafts_created_by ON public.drafts(created_by);
CREATE INDEX idx_drafts_created_at_desc ON public.drafts(created_at DESC);

-- Presets indexes
CREATE INDEX idx_listing_presets_created_by ON public.listing_presets(created_by);
CREATE INDEX idx_filter_presets_user_id ON public.filter_presets(user_id);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON public.favorites(listing_id);
CREATE INDEX idx_favorites_created_at ON public.favorites(created_at DESC);

-- Media indexes
CREATE INDEX idx_listing_media_listing_id ON public.listing_media(listing_id);
CREATE INDEX idx_listing_media_draft_id ON public.listing_media(draft_id);
CREATE INDEX idx_listing_media_user_id ON public.listing_media(user_id);

-- User quotas indexes
CREATE INDEX idx_user_quotas_user_id ON public.user_quotas(user_id);

-- =====================================================
-- Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment favorites count when favorite is added
CREATE OR REPLACE FUNCTION increment_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET favorites_count = favorites_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement favorites count when favorite is removed
CREATE OR REPLACE FUNCTION decrement_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET favorites_count = favorites_count - 1
  WHERE id = OLD.listing_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers
-- =====================================================

-- Update updated_at on listings
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on drafts
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on listing_presets
CREATE TRIGGER update_listing_presets_updated_at
  BEFORE UPDATE ON public.listing_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on filter_presets
CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON public.filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on user_quotas
CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Maintain favorites count
CREATE TRIGGER increment_favorites_on_add
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION increment_favorites_count();

CREATE TRIGGER decrement_favorites_on_remove
  AFTER DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION decrement_favorites_count();
