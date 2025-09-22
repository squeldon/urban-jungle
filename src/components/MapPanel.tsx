'use client'
import { useState } from 'react';

interface MapPanelProps {
  isOpen: boolean;
  hasActiveFilters?: boolean;
  headerHeight: number;
}

export default function MapPanel({ isOpen, hasActiveFilters = false, headerHeight }: MapPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Map Panel */}
      <div
        className={`
          fixed z-40 transition-all duration-300 ease-in-out
          ${isFullscreen
            ? 'right-4 bottom-4 w-[calc(100vw-2rem)]'
            : 'right-6 bottom-6 w-[calc(40vw-1.5rem)] lg:w-[calc(40vw-1.5rem)]'
          }
        `}
        style={{
          top: `${headerHeight + 16}px`, // 16px for spacing from header
          height: `calc(100vh - ${headerHeight + 16}px - 1.5rem)`,
        }}
      >
        <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Map Container */}
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
            {/* Placeholder for map - will show actual map later */}
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-sm font-medium">Map Panel</p>
              <p className="text-xs mt-1 opacity-75">Map will be implemented here</p>
            </div>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={handleFullscreenToggle}
            className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-lg shadow-md transition-colors z-10"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isFullscreen ? (
                // Exit fullscreen icon
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 15V19.5M15 15H19.5M15 15L20.5 20.5M9 15V19.5M9 15H4.5M9 15L3.5 20.5M15 9V4.5M15 9H19.5M15 9L20.5 3.5"
                />
              ) : (
                // Enter fullscreen icon
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>

        </div>
      </div>

      {/* Overlay for fullscreen mode */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={handleFullscreenToggle}
        />
      )}
    </>
  );
}
