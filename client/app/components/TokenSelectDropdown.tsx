import { useState, useEffect, useRef } from 'react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  image: string;
}

interface TokenSelectDropdownProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  placeholder?: string;
}

export default function TokenSelectDropdown({ 
  selectedToken, 
  onTokenSelect, 
  placeholder = "Select a token..." 
}: TokenSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load trending tokens on mount
  useEffect(() => {
    if (isOpen && tokens.length === 0) {
      loadTrendingTokens();
    }
  }, [isOpen]);

  // Filter tokens based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = tokens.filter(token =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTokens(filtered);
    } else {
      setFilteredTokens(tokens);
    }
  }, [searchQuery, tokens]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTrendingTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trending-tokens');
      if (response.ok) {
        const data = await response.json();
        const loadedTokens = data.tokens || [];
        setTokens(loadedTokens);
        console.log(`✅ Trending tokens loaded from ${data.source || 'unknown'} source`);
        
        // Fetch prices for loaded tokens
        if (loadedTokens.length > 0) {
          await fetchTokenPrices(loadedTokens);
        }
      }
    } catch (error) {
      console.error('Error loading trending tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time prices for tokens
  const fetchTokenPrices = async (tokensToPrice: Token[]) => {
    if (tokensToPrice.length === 0) return;
    
    setLoadingPrices(true);
    try {
      const tokenIds = tokensToPrice.map(token => token.id);
      
      const response = await fetch('/api/fetch-market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIds }),
      });

      if (response.ok) {
        const data = await response.json();
        const prices: Record<string, number> = {};
        
        if (data.prices) {
          Object.entries(data.prices).forEach(([tokenId, priceData]: [string, any]) => {
            prices[tokenId] = priceData.price || 0;
          });
        }
        
        setTokenPrices(prices);
        console.log(`✅ Token prices loaded from ${data.source || 'unknown'} source`);
      } else {
        console.warn('Failed to fetch token prices:', response.status);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const searchTokens = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search-tokens?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const searchResults = data.tokens || [];
        setTokens(searchResults);
        console.log(`✅ Token search completed from ${data.source || 'unknown'} source`);
        
        // Fetch prices for search results
        if (searchResults.length > 0) {
          await fetchTokenPrices(searchResults);
        }
      }
    } catch (error) {
      console.error('Error searching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Search if query is long enough
    if (query.length >= 2) {
      searchTokens(query);
    } else if (query.length === 0) {
      // Reset to trending tokens
      loadTrendingTokens();
    }
  };

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatPrice = (price: number) => {
    if (!price) return 'N/A';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return `$${marketCap.toFixed(2)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Token Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {selectedToken ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                {selectedToken.image ? (
                  <img
                    src={selectedToken.image}
                    alt={selectedToken.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {selectedToken.symbol[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedToken.name}</p>
                <p className="text-xs text-gray-500">{selectedToken.symbol.toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice(tokenPrices[selectedToken.id] || selectedToken.current_price)}
                </p>
                {loadingPrices && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                )}
                {tokenPrices[selectedToken.id] && (
                  <span className="text-xs text-green-600" title="Live price">
                    📡
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">#{selectedToken.market_cap_rank || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{placeholder}</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tokens..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Token List */}
          {!loading ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredTokens.length > 0 ? (
                <div className="py-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => handleTokenSelect(token)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {token.image ? (
                              <img
                                src={token.image}
                                alt={token.symbol}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {token.symbol[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{token.name}</p>
                            <p className="text-xs text-gray-500">{token.symbol.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(tokenPrices[token.id] || token.current_price)}
                            </p>
                            {loadingPrices && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                            )}
                            {tokenPrices[token.id] && (
                              <span className="text-xs text-green-600" title="Live price">
                                📡
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatMarketCap(token.market_cap)}
                          </p>
                          {token.price_change_percentage_24h && (
                            <p className={`text-xs ${
                              token.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {token.price_change_percentage_24h >= 0 ? '+' : ''}
                              {token.price_change_percentage_24h.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-gray-500">
                  {searchQuery ? 'No tokens found' : 'No tokens available'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
