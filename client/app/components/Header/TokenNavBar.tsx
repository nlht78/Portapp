import { Link, useLocation, useNavigate } from '@remix-run/react';
import { useState } from 'react';

interface TokenNavBarProps {
  user?: any;
}

export default function TokenNavBar({ user }: TokenNavBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      // Close the user menu dropdown
      setIsUserMenuOpen(false);
      
      try {
        await fetch('/token/logout', { method: 'POST' });
        navigate('/token/login', { replace: true });
      } catch (error) {
        console.error('Logout error:', error);
        // If logout fails, still navigate to login
        navigate('/token/login', { replace: true });
      }
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/token/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Token Research</span>
            </Link>
          </div>

          {/* Navigation Links - Only show when authenticated */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/token/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/token/dashboard')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/token/portfolio"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/token/portfolio')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Portfolio
              </Link>
              <Link
                to="/token/search"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/token/search')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Search Tokens
              </Link>
            </div>
          )}

          {/* User Menu or Sign In Button */}
          <div className="flex items-center">
            {user ? (
              // User Menu - when authenticated
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">U</span>
                  </div>
                  <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/token/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/token/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Sign In Button - when not authenticated
              <Link
                to="/token/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 