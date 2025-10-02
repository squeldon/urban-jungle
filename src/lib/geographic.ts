// Geographic utilities for handling location search and area overlays

import { MapOverlay, SearchAreaResult, GeographicBounds, SearchResultAddress } from '@/types/map';

/**
 * Convert a search result to a map overlay
 */
export function createOverlayFromSearchResult(result: SearchAreaResult): MapOverlay | null {
  if (result.overlay) {
    return result.overlay;
  }

  // Priority order: Polygon > Rectangle (bounds) > Circle (point)
  
  // 1. Try to create polygon overlay if polygon data is available
  if (result.polygon) {
    return {
      type: 'polygon',
      id: `search-${Date.now()}`,
      name: result.name,
      coordinates: result.polygon,
      style: {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6,
      }
    };
  }
  
  // 2. Fall back to rectangle if we have bounds data
  if (result.bounds) {
    return {
      type: 'rectangle',
      id: `search-${Date.now()}`,
      name: result.name,
      bounds: [
        [result.bounds.south, result.bounds.west],
        [result.bounds.north, result.bounds.east]
      ],
      style: {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6,
      }
    };
  } 
  
  // 3. Final fallback to circle for point locations
  return {
    type: 'circle',
    id: `search-${Date.now()}`,
    name: result.name,
    center: result.center,
    radius: 100, // 100 meter radius as default
    style: {
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      weight: 2,
      opacity: 0.6,
    }
  };
}


/**
 * Calculate confidence level for search result
 */
export function calculateConfidence(osmResult: any, searchQuery: string): number {
  const queryLower = searchQuery.toLowerCase();
  const labelLower = osmResult.display_name?.toLowerCase() || '';
  const importance = parseFloat(osmResult.importance) || 0;
  
  // Base confidence from OSM importance
  let confidence = importance;
  
  // Boost confidence for exact matches
  if (labelLower.includes(queryLower)) {
    confidence += 0.3;
  }
  
  // Boost confidence for complete address matches
  if (osmResult.house_number) {
    confidence += 0.2;
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Extract bounds from OSM result if available
 */
export function extractBounds(osmResult: any): GeographicBounds | undefined {
  if (osmResult.boundingbox && osmResult.boundingbox.length === 4) {
    const [south, north, west, east] = osmResult.boundingbox.map(parseFloat);
    return { north, south, east, west };
  }
  return undefined;
}

/**
 * Extract polygon coordinates from OSM result if available
 */
export function extractPolygon(osmResult: any): [number, number][] | undefined {
  // Check if the OSM result includes polygon/geojson data
  if (osmResult.geojson) {
    const geojson = osmResult.geojson;
    
    if (geojson.type === 'Polygon' && geojson.coordinates?.[0]) {
      // Convert from [lng, lat] to [lat, lng] format for Leaflet
      return geojson.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
    }
    
    if (geojson.type === 'MultiPolygon' && geojson.coordinates?.[0]?.[0]) {
      // For MultiPolygon, use the first (usually largest) polygon
      return geojson.coordinates[0][0].map(([lng, lat]: [number, number]) => [lat, lng]);
    }
  }
  
  return undefined;
}

/**
 * Convert OSM search result to SearchAreaResult
 */
export function normalizeAddressFromSearchResult(osmResult: any): SearchResultAddress {
  const address = osmResult?.address || {};

  const pickFirst = (...keys: string[]) => {
    for (const key of keys) {
      if (address[key]) {
        return address[key];
      }
    }
    return undefined;
  };

  const houseNumber = address.house_number || address.house;
  const streetName = pickFirst(
    'road',
    'footway',
    'pedestrian',
    'path',
    'street',
    'residential',
    'highway'
  );
  const street = [houseNumber, streetName].filter(Boolean).join(' ').trim() || undefined;

  const neighbourhood = pickFirst(
    'neighbourhood',
    'suburb',
    'quarter',
    'city_district',
    'residential'
  );

  const city = pickFirst(
    'city',
    'town',
    'village',
    'municipality',
    'hamlet',
    'locality'
  );

  const county = pickFirst('county', 'state_district', 'region');
  const state = pickFirst('state', 'province', 'region', 'state_district');
  const stateCode = address.state_code as string | undefined;
  const zipCode = address.postcode as string | undefined;
  const country = address.country as string | undefined;
  const countryCode = typeof address.country_code === 'string'
    ? address.country_code.toUpperCase()
    : undefined;

  return {
    houseNumber: houseNumber || undefined,
    street,
    streetName: streetName || undefined,
    neighbourhood,
    city: city || county || undefined,
    county: county || undefined,
    state: state || undefined,
    stateCode,
    zipCode,
    country,
    countryCode,
    raw: address,
  };
}

export function convertOSMToSearchAreaResult(osmResult: any, searchQuery: string): SearchAreaResult {
  const confidence = calculateConfidence(osmResult, searchQuery);
  const bounds = extractBounds(osmResult);
  const polygon = extractPolygon(osmResult);
  const address = normalizeAddressFromSearchResult(osmResult);
  
  const result: SearchAreaResult = {
    name: osmResult.name || searchQuery,
    displayName: osmResult.display_name,
    center: [parseFloat(osmResult.lat), parseFloat(osmResult.lon)],
    bounds,
    polygon,
    confidence,
    address,
    raw: osmResult,
  };
  
  // Create overlay based on the result
  const overlay = createOverlayFromSearchResult(result);
  if (overlay) {
    result.overlay = overlay;
  }
  
  return result;
}

/**
 * Create a simple overlay for a point location (fallback)
 */
export function createPointOverlay(
  lat: number, 
  lng: number, 
  name: string, 
  options: {
    radius?: number;
  } = {}
): MapOverlay {
  return {
    type: 'circle',
    id: `point-${Date.now()}`,
    name,
    center: [lat, lng],
    radius: options.radius || 100,
    style: {
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      weight: 2,
      opacity: 0.6,
    }
  };
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

/**
 * Convert meters to kilometers
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @param unit Preferred unit ('mi' or 'km')
 * @returns Formatted string like "2.5 mi" or "4.0 km"
 */
export function formatDistance(meters: number, unit: 'mi' | 'km' = 'mi'): string {
  if (unit === 'mi') {
    const miles = metersToMiles(meters);
    if (miles < 0.1) {
      return `${Math.round(meters)} m`;
    }
    return `${miles.toFixed(1)} mi`;
  } else {
    const km = metersToKilometers(meters);
    if (km < 0.1) {
      return `${Math.round(meters)} m`;
    }
    return `${km.toFixed(1)} km`;
  }
}

/**
 * Calculate approximate bounding box from center point and radius
 * Useful for initial map bounds before PostGIS query
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusMeters Radius in meters
 * @returns Bounding box { north, south, east, west }
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusMeters: number
): GeographicBounds {
  // Approximate degrees per meter (varies by latitude)
  const latDegreesPerMeter = 1 / 111320;
  const lngDegreesPerMeter = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  
  const latOffset = radiusMeters * latDegreesPerMeter;
  const lngOffset = radiusMeters * lngDegreesPerMeter;
  
  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Calculate appropriate zoom level for map based on geographic bounds
 * @param bounds Geographic bounds (north, south, east, west)
 * @param mapWidthPx Map width in pixels (default: 800)
 * @param mapHeightPx Map height in pixels (default: 600)
 * @returns Zoom level between 1 (world view) and 18 (street level)
 */
export function calculateZoomLevel(
  bounds: GeographicBounds,
  mapWidthPx: number = 800,
  mapHeightPx: number = 600
): number {
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;

  // Avoid division by zero
  if (latDiff === 0 && lngDiff === 0) {
    return 15; // Default zoom for point locations
  }

  // Calculate the zoom level based on the larger dimension
  const maxDiff = Math.max(latDiff, lngDiff);

  // Estimate zoom level using empirical formula
  // This is an approximation - Leaflet zoom levels are logarithmic
  let zoom = Math.floor(Math.log2(360 / maxDiff));

  // Adjust for map size - smaller maps need higher zoom for same area
  const mapSize = Math.min(mapWidthPx, mapHeightPx);
  if (mapSize < 400) {
    zoom -= 1; // Smaller maps need to zoom in more
  } else if (mapSize > 1200) {
    zoom += 1; // Larger maps can show more area at same zoom
  }

  // Clamp zoom level to reasonable bounds
  return Math.max(1, Math.min(18, zoom));
}