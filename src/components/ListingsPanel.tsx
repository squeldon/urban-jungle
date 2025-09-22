'use client'
import { useState, useEffect } from 'react';

interface ListingsPanelProps {
  isMapOpen: boolean;
  squareSize: number;
  headerHeight: number;
}

export default function ListingsPanel({ isMapOpen, squareSize, headerHeight }: ListingsPanelProps) {
  const [columns, setColumns] = useState(3);
  
  // Generate 20 blank squares
  const squares = Array.from({ length: 20 }, (_, index) => index + 1);

  // Calculate how many columns can fit based on available width
  useEffect(() => {
    const calculateColumns = () => {
      // Get the available width
      const availableWidth = isMapOpen ? window.innerWidth * 0.6 : window.innerWidth;
      
      // Account for padding and margins (48px total padding + some buffer)
      const padding = 96; // 48px left + 48px right padding from p-6
      const gap = 8; // 0.5rem gap between items
      
      const usableWidth = availableWidth - padding;
      
      // Calculate how many squares can fit
      // Formula: (n * squareSize) + ((n - 1) * gap) <= usableWidth
      // Solving for n: n <= (usableWidth + gap) / (squareSize + gap)
      const maxColumns = Math.floor((usableWidth + gap) / (squareSize + gap));
      
      // Ensure at least 1 column and reasonable maximum
      const finalColumns = Math.max(1, Math.min(maxColumns, 12));
      setColumns(finalColumns);
    };

    calculateColumns();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [isMapOpen, squareSize]);

  // Generate CSS class for the calculated number of columns
  const getGridCols = () => {
    const colsMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };
    
    return colsMap[columns] || 'grid-cols-3';
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Content container - width adjusts based on map state */}
      <div 
        className={`${isMapOpen ? 'w-[60vw]' : 'w-full'} transition-all duration-300`}
        style={{
          paddingTop: `${headerHeight - 15}px`, // Dynamic padding based on header height + spacing
        }}
      >
        <div className="p-6">
          <div className="mb-2">
            <p className="text-gray-600 dark:text-gray-400">
              {squares.length} properties found
            </p>
          </div>

          {/* Grid of listing squares */}
          <div className={`grid justify-items-center ${getGridCols()} pr-3`} style={{ gap: '0.5rem' }}>
            {squares.map((index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer flex items-center justify-center group"
                style={{
                  width: `${squareSize}px`,
                  height: `${squareSize}px`,
                }}
              >
                <div className="text-center text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  <div className="text-xs font-medium mb-1">Property {index}</div>
                  <div className="text-xs opacity-75">Placeholder</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
