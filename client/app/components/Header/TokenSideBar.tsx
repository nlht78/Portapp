import { Link, useLocation } from '@remix-run/react';
import { usePortfolio } from '~/contexts/PortfolioContext';

export default function TokenSideBar() {
  const location = useLocation();
  const { portfolioData } = usePortfolio();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get change color
  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/token/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      name: 'Portfolio',
      href: '/token/portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      name: 'Search Tokens',
      href: '/token/search',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      name: 'Market Analysis',
      href: '/token/market',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Research Tools',
      href: '/token/tools',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: 'Watchlist',
      href: '/token/watchlist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="ml-2 text-lg font-semibold text-gray-900">Token Research</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.href)
                  ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Quick Stats - Real Data */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Portfolio Value</span>
              <span className="font-medium text-gray-900">
                {portfolioData.loadingPrices ? (
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                ) : (
                  formatCurrency(portfolioData.totalValue)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">24h Change</span>
              <span className={`font-medium ${getChangeColor(portfolioData.totalChangePercent)}`}>
                {portfolioData.loadingPrices ? (
                  <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                ) : (
                  formatPercentage(portfolioData.totalChangePercent)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Tokens</span>
              <span className="font-medium text-gray-900">
                {portfolioData.loadingPrices ? (
                  <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                ) : (
                  portfolioData.totalTokens
                )}
              </span>
            </div>
            {portfolioData.lastUpdate && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Last Update</span>
                <span>{portfolioData.lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
            {portfolioData.source && portfolioData.source !== 'unknown' && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Source</span>
                <span className="capitalize">{portfolioData.source}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity - Placeholder for now */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            <div className="text-sm">
              <p className="text-gray-900">Portfolio updated</p>
              <p className="text-gray-500 text-xs">
                {portfolioData.lastUpdate ? 
                  `${Math.floor((Date.now() - portfolioData.lastUpdate.getTime()) / 60000)} min ago` : 
                  'Just now'
                }
              </p>
            </div>
            <div className="text-sm">
              <p className="text-gray-900">Market prices synced</p>
              <p className="text-gray-500 text-xs">
                {portfolioData.source && portfolioData.source !== 'unknown' ? 
                  `From ${portfolioData.source}` : 
                  'Loading...'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}