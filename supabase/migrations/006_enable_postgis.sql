-- =====================================================
-- Urban Jungle - PostGIS Geospatial Indexing
-- =====================================================
-- This migration enables PostGIS and adds geospatial
-- indexing for efficient location-based queries
-- =====================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- Add Geography Column to Listings
-- =====================================================
-- Using GEOGRAPHY type for real-world coordinates
-- (automatically handles Earth's curvature for accurate distances)

-- Add geography column for point locations
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Populate location column from existing coordinates JSONB
UPDATE public.listings
SET location = ST_SetSRID(
  ST_MakePoint(
    (coordinates->>'lng')::float,
    (coordinates->>'lat')::float
  ),
  4326
)::geography
WHERE coordinates IS NOT NULL
  AND coordinates->>'lat' IS NOT NULL
  AND coordinates->>'lng' IS NOT NULL;

-- =====================================================
-- Add Geography Column to Drafts
-- =====================================================

ALTER TABLE public.drafts
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Populate location column from existing coordinates JSONB
UPDATE public.drafts
SET location = ST_SetSRID(
  ST_MakePoint(
    (coordinates->>'lng')::float,
    (coordinates->>'lat')::float
  ),
  4326
)::geography
WHERE coordinates IS NOT NULL
  AND coordinates->>'lat' IS NOT NULL
  AND coordinates->>'lng' IS NOT NULL;

-- =====================================================
-- Create Spatial Indexes
-- =====================================================
-- GIST indexes for efficient spatial queries

CREATE INDEX IF NOT EXISTS idx_listings_location_gist 
ON public.listings 
USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_drafts_location_gist 
ON public.drafts 
USING GIST (location);

-- =====================================================
-- Trigger Function: Sync Location from Coordinates
-- =====================================================
-- Automatically update geography column when coordinates change

CREATE OR REPLACE FUNCTION sync_location_from_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if coordinates are provided and valid
  IF NEW.coordinates IS NOT NULL 
     AND NEW.coordinates->>'lat' IS NOT NULL 
     AND NEW.coordinates->>'lng' IS NOT NULL THEN
    
    NEW.location := ST_SetSRID(
      ST_MakePoint(
        (NEW.coordinates->>'lng')::float,
        (NEW.coordinates->>'lat')::float
      ),
      4326
    )::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Apply Triggers
-- =====================================================

-- Trigger for listings
DROP TRIGGER IF EXISTS sync_listings_location ON public.listings;
CREATE TRIGGER sync_listings_location
  BEFORE INSERT OR UPDATE OF coordinates ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_from_coordinates();

-- Trigger for drafts
DROP TRIGGER IF EXISTS sync_drafts_location ON public.drafts;
CREATE TRIGGER sync_drafts_location
  BEFORE INSERT OR UPDATE OF coordinates ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_from_coordinates();

-- =====================================================
-- Spatial Query Functions
-- =====================================================

-- Function: Get listings within radius (in meters)
CREATE OR REPLACE FUNCTION get_listings_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters FLOAT,
  filter_status TEXT[] DEFAULT ARRAY['active', 'pending', 'sold', 'rented']
)
RETURNS TABLE (
  id UUID,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    ST_Distance(
      l.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    )::FLOAT as distance_meters
  FROM public.listings l
  WHERE l.location IS NOT NULL
    AND l.status = ANY(filter_status)
    AND ST_DWithin(
      l.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get nearest listings to a point
CREATE OR REPLACE FUNCTION get_nearest_listings(
  center_lat FLOAT,
  center_lng FLOAT,
  max_results INTEGER DEFAULT 20,
  max_distance_meters FLOAT DEFAULT 50000, -- 50km default
  filter_status TEXT[] DEFAULT ARRAY['active', 'pending', 'sold', 'rented']
)
RETURNS TABLE (
  id UUID,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    ST_Distance(
      l.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    )::FLOAT as distance_meters
  FROM public.listings l
  WHERE l.location IS NOT NULL
    AND l.status = ANY(filter_status)
    AND ST_DWithin(
      l.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      max_distance_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lng1 FLOAT,
  lat2 FLOAT,
  lng2 FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get listings within bounding box
CREATE OR REPLACE FUNCTION get_listings_within_bounds(
  north FLOAT,
  south FLOAT,
  east FLOAT,
  west FLOAT,
  filter_status TEXT[] DEFAULT ARRAY['active', 'pending', 'sold', 'rented']
)
RETURNS TABLE (
  id UUID
) AS $$
DECLARE
  bbox_geom GEOMETRY;
BEGIN
  -- Create bounding box geometry
  -- Handle cases where bbox crosses antimeridian
  IF west <= east THEN
    bbox_geom := ST_MakeEnvelope(west, south, east, north, 4326);
  ELSE
    -- Crosses antimeridian - create multipolygon
    bbox_geom := ST_Union(
      ST_MakeEnvelope(west, south, 180, north, 4326),
      ST_MakeEnvelope(-180, south, east, north, 4326)
    );
  END IF;
  
  RETURN QUERY
  SELECT l.id
  FROM public.listings l
  WHERE l.location IS NOT NULL
    AND l.status = ANY(filter_status)
    AND ST_Intersects(l.location::geometry, bbox_geom);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get listings within polygon
CREATE OR REPLACE FUNCTION get_listings_within_polygon(
  polygon_coords JSONB, -- Array of [lat, lng] coordinates
  filter_status TEXT[] DEFAULT ARRAY['active', 'pending', 'sold', 'rented']
)
RETURNS TABLE (
  id UUID
) AS $$
DECLARE
  polygon_geom GEOMETRY;
  coord JSONB;
  points TEXT[];
  point_str TEXT;
BEGIN
  -- Build WKT POLYGON string from coordinates
  -- JSONB array format: [[lat1, lng1], [lat2, lng2], ...]
  points := ARRAY[]::TEXT[];
  
  FOR coord IN SELECT * FROM jsonb_array_elements(polygon_coords)
  LOOP
    -- Convert [lat, lng] to "lng lat" (WKT format)
    point_str := (coord->>1) || ' ' || (coord->>0);
    points := array_append(points, point_str);
  END LOOP;
  
  -- Ensure polygon is closed (first point = last point)
  IF points[1] != points[array_length(points, 1)] THEN
    points := array_append(points, points[1]);
  END IF;
  
  -- Create polygon geometry from WKT
  polygon_geom := ST_GeomFromText(
    'POLYGON((' || array_to_string(points, ',') || '))',
    4326
  );
  
  RETURN QUERY
  SELECT l.id
  FROM public.listings l
  WHERE l.location IS NOT NULL
    AND l.status = ANY(filter_status)
    AND ST_Intersects(l.location::geometry, polygon_geom);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if point is within bounding box
CREATE OR REPLACE FUNCTION is_within_bounds(
  point_lat FLOAT,
  point_lng FLOAT,
  north FLOAT,
  south FLOAT,
  east FLOAT,
  west FLOAT
)
RETURNS BOOLEAN AS $$
DECLARE
  point_geog GEOGRAPHY;
  bbox_geog GEOGRAPHY;
BEGIN
  -- Create point geography
  point_geog := ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326)::geography;
  
  -- Create bounding box geography
  -- Handle cases where bbox crosses antimeridian
  IF west <= east THEN
    bbox_geog := ST_MakeEnvelope(west, south, east, north, 4326)::geography;
  ELSE
    -- Crosses antimeridian - use polygon instead
    bbox_geog := ST_MakePolygon(
      ST_MakeLine(ARRAY[
        ST_MakePoint(west, south),
        ST_MakePoint(180, south),
        ST_MakePoint(180, north),
        ST_MakePoint(west, north),
        ST_MakePoint(west, south)
      ])
    )::geography;
  END IF;
  
  RETURN ST_Intersects(point_geog, bbox_geog);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Computed Distance Column Helper
-- =====================================================
-- This function can be used in queries to add distance to results

CREATE OR REPLACE FUNCTION listing_distance_from_point(
  listing_location GEOGRAPHY,
  center_lat FLOAT,
  center_lng FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  IF listing_location IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN ST_Distance(
    listing_location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON COLUMN public.listings.location IS 
  'PostGIS geography column for efficient spatial queries. Automatically synced from coordinates JSONB.';

COMMENT ON COLUMN public.drafts.location IS 
  'PostGIS geography column for efficient spatial queries. Automatically synced from coordinates JSONB.';

COMMENT ON FUNCTION get_listings_within_radius IS 
  'Returns listing IDs and distances within specified radius (in meters) from a center point. Results ordered by distance.';

COMMENT ON FUNCTION get_nearest_listings IS 
  'Returns the nearest listings (up to max_results) within max_distance_meters from a center point.';

COMMENT ON FUNCTION calculate_distance IS 
  'Calculates the distance in meters between two lat/lng coordinate pairs using PostGIS geography.';

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_listings_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearest_listings TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION get_listings_within_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION get_listings_within_polygon TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION listing_distance_from_point TO authenticated;
