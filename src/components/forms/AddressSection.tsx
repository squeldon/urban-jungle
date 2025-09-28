import React, { useState } from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';
import { LocationSearchInput, BaseMap } from '@/components/ui';
import { MapOverlay, SearchAreaResult } from '@/types/map';
import { createOverlayFromSearchResult, normalizeAddressFromSearchResult } from '@/lib/geographic';

interface AddressSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLocationSelect?: (area: SearchAreaResult | null) => void;
}

export function AddressSection({ formData, onChange, onLocationSelect }: AddressSectionProps) {
  // State to track if a location was selected from dropdown (making it non-editable)
  const [selectedArea, setSelectedArea] = useState<SearchAreaResult | null>(null);
  const [searchValue, setSearchValue] = useState('');
  
  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapOverlays, setMapOverlays] = useState<MapOverlay[]>([]);

  // Check if we have a selected location or manual input
  const hasSelectedLocation = selectedArea !== null;

  // Create a combined location string for manual search input
  const getLocationString = () => {
    if (hasSelectedLocation) {
      return selectedArea?.displayName || selectedArea?.name || '';
    }

    // Location field should NOT include house number - that's separate
    const parts = [
      formData.address.streetName || formData.address.street,
      formData.address.city,
      formData.address.state,
      formData.address.zipCode,
    ].filter(Boolean);

    return parts.join(', ');
  };

  // Handle changes to the location search input (when typing)
  const handleLocationChange = (value: string) => {
    setSearchValue(value);
    
    // Clear selected location when user starts typing
    if (hasSelectedLocation) {
      setSelectedArea(null);
    }

    // Clear any existing map overlays when starting a new search
    setMapOverlays([]);
    setMapCenter(null);

    // When user starts typing after a selection, clear other address fields
    // and treat this as a new search (but don't touch house number)
    const addressUpdates = [
      { name: 'address.streetName', value },
      { name: 'address.street', value },
      { name: 'address.city', value: '' },
      { name: 'address.state', value: '' },
      { name: 'address.zipCode', value: '' },
    ];

    addressUpdates.forEach(update => {
      const syntheticEvent = {
        target: {
          name: update.name,
          value: update.value,
          type: 'text'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    });
  };

  // Handle area selection from search (priority over simple location)
  const handleAreaSelect = (area: SearchAreaResult) => {
    const overlay = createOverlayFromSearchResult(area);
    setMapOverlays(overlay ? [overlay] : []);
    setMapCenter(area.center);

    const normalizedAddress = normalizeAddressFromSearchResult(area.raw);
    const houseNumber = normalizedAddress.houseNumber || '';
    const streetName = normalizedAddress.streetName || normalizedAddress.street || '';
    const street = normalizedAddress.street || [houseNumber, streetName].filter(Boolean).join(' ');
    const city = normalizedAddress.city || normalizedAddress.neighbourhood || normalizedAddress.county || '';
    const state = normalizedAddress.state || normalizedAddress.stateCode || '';
    const zipCode = normalizedAddress.zipCode || '';
    const country = normalizedAddress.country || formData.address.country || 'US';

    setSelectedArea(area);
    setSearchValue('');

    const addressUpdates = [
      { name: 'address.houseNumber', value: houseNumber },
      { name: 'address.streetName', value: streetName },
      { name: 'address.street', value: street },
      { name: 'address.city', value: city },
      { name: 'address.state', value: state },
      { name: 'address.zipCode', value: zipCode },
      { name: 'address.country', value: country }
    ];

    addressUpdates.forEach(update => {
      const syntheticEvent = {
        target: {
          name: update.name,
          value: update.value || '',
          type: 'text'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    });

    onLocationSelect?.(area);
  };

  // Handle clearing the selected location/area
  const handleClearLocation = () => {
    setSelectedArea(null);
    setSearchValue('');
    
    // Clear location-related address fields (but leave house number alone)
    const addressUpdates = [
      { name: 'address.streetName', value: '' },
      { name: 'address.street', value: '' },
      { name: 'address.city', value: '' },
      { name: 'address.state', value: '' },
      { name: 'address.zipCode', value: '' },
    ];

    addressUpdates.forEach(update => {
      const syntheticEvent = {
        target: {
          name: update.name,
          value: update.value,
          type: 'text'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    });

    // Clear map center and all overlays (both area and point overlays)
    setMapCenter(null);
    setMapOverlays([]);

    // Clear coordinates
    onLocationSelect?.(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField label="House Number">
          <input
            type="text"
            name="address.houseNumber"
            value={formData.address.houseNumber || ''}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="12XX"
          />
        </FormField>

        <div className="md:col-span-3">
          <FormField label="Location" required>
            {hasSelectedLocation ? (
              // Show selected location as a non-editable chip
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium truncate max-w-xs">
                      {selectedArea?.displayName || selectedArea?.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Remove selected location"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              // Show search input when no location is selected
              <LocationSearchInput
                value={searchValue || getLocationString()}
                onChange={handleLocationChange}
                onAreaSelect={handleAreaSelect}
                placeholder="Enter street, city, state (e.g., Main Street, Baltimore, MD)"
                required
                showSearchButton={true}
              />
            )}
          </FormField>
        </div>
      </div>
      
      {/* Map Section - Takes up about 1/3 of viewport */}
      {(mapCenter || mapOverlays.length > 0) && (
        <div className="mt-6">
          <div className="h-[33vh] min-h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <BaseMap
              center={mapCenter || [40.7128, -74.0060]}
              zoom={mapCenter ? 15 : 13}
              overlays={mapOverlays}
              className="w-full h-full"
              showScale={false}
              showAttribution={true}
              showDisclaimer={true}
              zoomControl={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
