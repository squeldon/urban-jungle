// Geographic utilities for handling location search and area overlays

import { MapOverlay, SearchAreaResult, GeographicBounds } from '@/types/map';

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
export function convertOSMToSearchAreaResult(osmResult: any, searchQuery: string): SearchAreaResult {
  const confidence = calculateConfidence(osmResult, searchQuery);
  const bounds = extractBounds(osmResult);
  const polygon = extractPolygon(osmResult);
  
  const result: SearchAreaResult = {
    name: osmResult.name || searchQuery,
    displayName: osmResult.display_name,
    center: [parseFloat(osmResult.lat), parseFloat(osmResult.lon)],
    bounds,
    polygon,
    confidence,
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
    