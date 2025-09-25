interface UserMenuProps {
  isLoggedIn: boolean;
  onUserIconClick: () => void;
  onLoginOption: () => void;
  onLogout: () => void;
}

export default function UserMenu({ isLoggedIn, onUserIconClick, onLoginOption, onLogout }: UserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      {/* User icon */}
      <div className="relative group">
        <button
          onClick={onUserIconClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path stroke="currentColor" strokeWidth="2" fill="none" d="M4 20c0-3.3137 3.134-6 7-6s7 2.6863 7 6"/>
          </svg>
        </button>
      </div>

      {/* Menu stack icon (hamburger menu) */}
      <div className="relative group">
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
          <div className="py-1">
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Log out
              </button>
            ) : (
              <button
                onClick={onLoginOption}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Log in or sign up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
