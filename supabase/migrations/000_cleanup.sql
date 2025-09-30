-- =====================================================
-- Cleanup Script - Run this FIRST if you need to reset
-- =====================================================
-- This will drop all existing tables to allow fresh creation
-- WARNING: This will delete all data!
-- =====================================================

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.listing_media CASCADE;
DROP TABLE IF EXISTS public.user_quotas CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.filter_presets CASCADE;
DROP TABLE IF EXISTS public.listing_presets CASCADE;
DROP TABLE IF EXISTS public.drafts CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;

-- Also drop the test table if it exists
DROP TABLE IF EXISTS public.test_connection CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_favorites_count() CASCADE;
DROP FUNCTION IF EXISTS decrement_favorites_count() CASCADE;

-- Note: Extensions are kept as they're harmless to keep
-- If you really want to remove them:
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";
