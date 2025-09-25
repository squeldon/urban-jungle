'use client'
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut, getAuth } from 'firebase/auth';
import firebase_app from '@/firebase/config';
import { useFilters } from '@/hooks/useFilters';
import Header from '@/components/header/Header';
import FilterPopup from '@/components/filters/FilterPopup';
import AuthPopup from '@/components/auth/AuthPopup';
import MainPanel from '@/components/MainPanel';

export default function Home() {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [squareSize, setSquareSize] = useState(265); // Default medium square size
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  const { user } = useAuthContext() as { user: any };
  const router = useRouter();
  
  // Use the custom filter hook
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    getActiveFilters,
    resetAllFilters,
    getListingFilters,
    replaceFilters,
  } = useFilters();

  // Check authentication status on component mount and user changes
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setShowAuthPopup(false);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      setShowAuthPopup(true);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(firebase_app);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginOption = () => {
    setShowAuthPopup(true);
  };

  const toggleMapPanel = () => {
    setShowMapPanel(!showMapPanel);
  };

  const toggleFilterPopup = () => {
    setShowFilterPopup(!showFilterPopup);
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setMapCenter([lat, lng]);
    // Auto-open map panel when location is selected
    if (!showMapPanel) {
      setShowMapPanel(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        showFilterPopup={showFilterPopup}
        showMapPanel={showMapPanel}
        activeFilters={getActiveFilters()}
        filters={filters}
        squareSize={squareSize}
        onUserIconClick={handleUserIconClick}
        onLoginOption={handleLoginOption}
        onToggleFilter={toggleFilterPopup}
        onToggleMap={toggleMapPanel}
        onClearFilter={clearFilter}
        onUpdateFilter={updateFilter}
        onToggleArrayFilter={toggleArrayFilter}
        onLogout={handleLogout}
        onSquareSizeChange={setSquareSize}
        onLocationSelect={handleLocationSelect}
      />

      <AuthPopup 
        isOpen={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)} 
      />

      <FilterPopup
        isOpen={showFilterPopup}
        filters={filters}
        onClose={toggleFilterPopup}
        onUpdateFilter={updateFilter}
        onToggleArrayFilter={toggleArrayFilter}
        onResetFilters={resetAllFilters}
        onReplaceFilters={replaceFilters}
      />

      {/* Main content area below header */}
      <main className="flex-1">
        <MainPanel 
          showMapPanel={showMapPanel}
          activeFiltersCount={getActiveFilters().length}
          squareSize={squareSize}
          filters={getListingFilters()}
          mapCenter={mapCenter}
        />
      </main>
    </div>
  )
}
