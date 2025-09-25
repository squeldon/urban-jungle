import React, { useState } from 'react';
import { CreateListingData } from '@/types/listing';
import { FormField } from '@/components/ui/FormField';
import { LocationSearchInput } from '@/components/ui/LocationSearchInput';

interface AddressSectionProps {
  formData: CreateListingData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLocationSelect?: (lat: number, lng: number, coordinates?: { lat: number; lng: number }) => void;
}

interface SelectedLocation {
  fullAddress: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
}

export function AddressSection({ formData, onChange, onLocationSelect }: AddressSectionProps) {
  // State to track if a location was selected from dropdown (making it non-editable)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [searchValue, setSearchValue] = useState('');

  // Check if we have a selected location or manual input
  const hasSelectedLocation = selectedLocation !== null;

  // Create a combined location string for manual search input
  const getLocationString = () => {
    if (hasSelectedLocation) {
      return selectedLocation.fullAddress;
    }
    const parts = [
      formData.address.streetName,
      formData.address.city,
      formData.address.state,
      formData.address.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Handle changes to the location search input (when typing)
  const handleLocationChange = (value: string) => {
    setSearchValue(value);
    
    // Clear selected location when user starts typing
    if (hasSelectedLocation) {
      setSelectedLocation(null);
    }

    // When user starts typing after a selection, clear other address fields
    // and treat this as a new search
    const addressUpdates = [
      { name: 'address.streetName', value: value },
      { name: 'address.city', value: '' },
      { name: 'address.state', value: '' },
      { name: 'address.zipCode', value: '' }
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

  // Handle location selection from dropdown
  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    // Parse the location name to extract address components
    // OpenStreetMap typically returns addresses in format: "Street, City, State ZIP, Country"
    const parts = name.split(', ');
    
    let streetName = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    if (parts.length >= 2) {
      streetName = parts[0] || '';
      city = parts[1] || '';
      
      // Try to extract state and zip from the last parts
      if (parts.length >= 3) {
        const stateZipPart = parts[2];
        const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)?/);
        if (stateZipMatch) {
          state = stateZipMatch[1] || '';
          zipCode = stateZipMatch[2] || '';
        } else {
          // If no ZIP found, assume the whole part is the state
          state = stateZipPart;
        }
      }
    }

    // Store the selected location
    const selected: SelectedLocation = {
      fullAddress: name,
      streetName,
      city,
      state,
      zipCode,
      lat,
      lng
    };
    setSelectedLocation(selected);
    setSearchValue('');

    // Update all address fields with the parsed data
    const addressUpdates = [
      { name: 'address.streetName', value: streetName },
      { name: 'address.city', value: city },
      { name: 'address.state', value: state },
      { name: 'address.zipCode', value: zipCode }
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

    // Call the parent's location select handler if provided
    onLocationSelect?.(lat, lng, { lat, lng });
  };

  // Handle clearing the selected location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchValue('');
    
    // Clear all address fields
    const addressUpdates = [
      { name: 'address.streetName', value: '' },
      { name: 'address.city', value: '' },
      { name: 'address.state', value: '' },
      { name: 'address.zipCode', value: '' }
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

    // Clear coordinates
    onLocationSelect?.(0, 0, { lat: 0, lng: 0 });
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
                      {selectedLocation.fullAddress}
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
                onLocationSelect={handleLocationSelect}
                placeholder="Enter street, city, state (e.g., Main Street, Baltimore, MD)"
                required
                showSearchButton={true}
              />
            )}
          </FormField>
        </div>
      </div>
    </div>
  );
}
