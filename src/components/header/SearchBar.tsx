'use client'
import { useState } from 'react';
import { LocationSearchInput } from '@/components/ui/LocationSearchInput';
import { SearchAreaResult } from '@/types/map';

interface SearchBarProps {
  // onLocationSelect: (lat: number, lng: number, name: string) => void;
  onAreaSelect?: (area: SearchAreaResult) => void;
}

export default function SearchBar({ onAreaSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <LocationSearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      // onLocationSelect={onLocationSelect}
      onAreaSelect={onAreaSelect}
      placeholder="Search location"
      className="flex-1"
      showSearchButton={true}
    />
  );
}
