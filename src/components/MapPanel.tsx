'use client'

interface MapPanelProps {
  isOpen: boolean;
}

export default function MapPanel({ isOpen }: MapPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-0 w-1/2 h-[calc(100vh-5rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-30">
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Map will be integrated here
      </div>
    </div>
  );
}
