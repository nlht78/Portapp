import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSearchParams, Link } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { searchTokens } from '~/services/coingecko.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return json({ tokens: [], query: '', error: null });
  }

  try {
    const tokens = await searchTokens(query);
    return json({ tokens: tokens || [], query, error: null });
  } catch (error) {
    console.error('Error searching tokens:', error);
    return json({ tokens: [], query, error: 'Failed to search tokens' });
  }
};

export default function TokenSearch() {
  const { tokens, query, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(query);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const formatMarketCap = (rank: number) => {
    if (rank <= 0) return 'N/A';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Token Search</h1>
        <p className="text-gray-600 mt-2">Search for cryptocurrencies and tokens</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for tokens (e.g., Bitcoin, BTC, Ethereum)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </form>
      </div>

      {/* Search Results */}
      {query && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Search Results for "{query}"
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {tokens.length} tokens
            </p>
          </div>

          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : tokens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.map((token: any) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{token.symbol[0]}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{token.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">{token.symbol}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatMarketCap(token.market_cap_rank)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/token/${token.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                          <button className="text-green-600 hover:text-green-900">
                            Add to Portfolio
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
              <p className="text-gray-600">Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Searches</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Bitcoin', 'Ethereum', 'Cardano', 'Solana', 'Polkadot', 'Chainlink', 'Uniswap', 'Aave'].map((token) => (
              <button
                key={token}
                onClick={() => {
                  setSearchQuery(token);
                  setSearchParams({ q: token });
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Search by Name</h4>
            <p className="text-sm text-gray-600">Try searching for the full name of the cryptocurrency (e.g., "Bitcoin", "Ethereum")</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Search by Symbol</h4>
            <p className="text-sm text-gray-600">Use the token symbol for quick searches (e.g., "BTC", "ETH", "ADA")</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Partial Matches</h4>
            <p className="text-sm text-gray-600">You can search with partial names or symbols to find related tokens</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Case Insensitive</h4>
            <p className="text-sm text-gray-600">Search is case insensitive, so "bitcoin" and "Bitcoin" will return the same results</p>
          </div>
        </div>
      </div>
    </div>
  );
}