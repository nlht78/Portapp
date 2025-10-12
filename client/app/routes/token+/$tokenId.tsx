import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link, useNavigation, useRevalidator } from '@remix-run/react';
import { useEffect, useState } from 'react';
import PriceChart from '~/components/PriceChart';
import TokenHolders from '~/components/TokenHolders';
import ProjectOverview from '~/components/ProjectOverview';
import AIResearch from '~/components/AIResearch';
import InvestorSection from '~/components/InvestorSection';
import FundingSection from '~/components/FundingSection';
import TokenDetailSkeleton, { TokenLoadingState } from '~/components/TokenDetailSkeleton';
import { TokenErrorBoundary } from '~/components/ErrorBoundary';
import { getTokenDetails } from '~/services/coingecko.server';
import { getMultiPrices } from '~/services/multiPricing.server';

// Helper function to fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const tokenId = params.tokenId;

  if (!tokenId) {
    throw new Response('Token ID is required', { status: 400 });
  }

  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch token data for ${tokenId}`);
      
      // Fetch token data from multi-source API with timeout
      const response = await fetchWithTimeout(
        `http://localhost:8080/api/v1/coingecko/tokens/${tokenId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
        attempt === 1 ? 10000 : 20000 // First attempt: 10s, retry: 20s
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Response('Token not found', { status: 404 });
        }
        throw new Error(`API responded with status: ${response.status}`);
      }

      const tokenData = await getTokenDetails(tokenId);
      
      console.log(`Successfully fetched token data for ${tokenId} on attempt ${attempt}`);
      return json({ tokenData });

    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed for ${tokenId}:`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  // All attempts failed
  console.error(`All ${maxRetries} attempts failed for ${tokenId}:`, lastError);
  
  if (lastError?.name === 'AbortError') {
    throw new Response('Request timeout - API is taking too long to respond', { status: 408 });
  }
  
  throw new Response(
    lastError?.message || 'Failed to fetch token data after multiple attempts', 
    { status: 500 }
  );
};

export default function TokenDetail() {
  const { tokenData } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [loadingStage, setLoadingStage] = useState<'initial' | 'fallback' | 'timeout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [realTimePrice, setRealTimePrice] = useState<number | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [calculatorAmount, setCalculatorAmount] = useState<string>('1');

  // Handle navigation loading states
  useEffect(() => {
    if (navigation.state === 'loading') {
      setLoadingStage('initial');
      setError(null);
      
      // Show fallback message after 5 seconds
      const fallbackTimer = setTimeout(() => {
        setLoadingStage('fallback');
      }, 5000);
      
      // Show timeout message after 15 seconds
      const timeoutTimer = setTimeout(() => {
        setLoadingStage('timeout');
      }, 15000);
      
      return () => {
        clearTimeout(fallbackTimer);
        clearTimeout(timeoutTimer);
      };
    } else {
      setLoadingStage(null);
    }
  }, [navigation.state]);

  // Handle revalidation loading
  useEffect(() => {
    if (revalidator.state === 'loading') {
      setLoadingStage('initial');
      setError(null);
    } else {
      setLoadingStage(null);
    }
  }, [revalidator.state]);

  // Fetch real-time pricing data
  useEffect(() => {
    const fetchRealTimePrices = async () => {
      try {
        const [tokenPriceData, btcPriceData] = await Promise.all([
          fetch('/api/fetch-market-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenIds: [tokenData.id || 'bitcoin'] }),
          }).then(res => res.json()),
          fetch('/api/fetch-market-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenIds: ['bitcoin'] }),
          }).then(res => res.json())
        ]);

        const price = tokenPriceData.prices?.[tokenData.id || 'bitcoin'];
        if (price) {
          setRealTimePrice(price.price);
        }

        const btcPrice = btcPriceData.prices?.bitcoin;
        if (btcPrice) {
          setBtcPrice(btcPrice.price);
        }
      } catch (error) {
        console.warn('Failed to fetch real-time prices:', error);
      }
    };

    if (tokenData?.id) {
      fetchRealTimePrices();
      // Refresh every 30 seconds
      const interval = setInterval(fetchRealTimePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [tokenData?.id]);

  // Show loading state
  if (navigation.state === 'loading' || revalidator.state === 'loading') {
    return (
      <TokenLoadingState 
        stage={loadingStage || 'initial'}
        message={error || undefined}
        onRetry={() => revalidator.revalidate()}
      />
    );
  }

  // Validate tokenData
  if (!tokenData) {
    return (
      <TokenLoadingState 
        stage="error"
        message="The requested token could not be found in our pricing sources."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatDetailedNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatBtcEquivalent = (usdValue: number | null | undefined) => {
    if (!usdValue || !btcPrice) return '';
    const btcEquivalent = usdValue / btcPrice;
    return `BTC ${btcEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A';
    if (price < 0.01) return `$${price.toFixed(8)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatSupply = (supply: number | null | undefined) => {
    if (!supply) return 'N/A';
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`;
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(2)}K`;
    return supply.toLocaleString();
  };

  const truncateDescription = (description: string, maxLength: number = 300) => {
    if (!description || description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const getCurrentPrice = () => realTimePrice || tokenData.currentPrice || 0;
  const getCalculatedUSD = () => {
    const amount = parseFloat(calculatorAmount) || 0;
    return amount * getCurrentPrice();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={tokenData.image?.large || ''} 
              alt={tokenData.name || 'Token'}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const nextElement = target.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }}
            />
            <div 
              className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center hidden"
              style={{ display: 'none' }}
            >
              <span className="text-xl font-bold text-orange-600">{(tokenData.symbol || 'T')[0]}</span>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">{tokenData.name || 'Unknown Token'}</h1>
              <p className="text-gray-600">{tokenData.symbol || 'UNKNOWN'}</p>
              {/* Data source indicator */}
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">Data source: </span>
                <span className="text-xs font-medium text-indigo-600 ml-1">
                  {tokenData.source || 'Multi-Source'}
                </span>
                <span className="text-xs text-green-600 ml-2" title="Live data">
                  📡
                </span>
                {tokenData.attemptCount && tokenData.attemptCount > 1 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2" title="Required retry">
                    Retry {tokenData.attemptCount - 1}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(getCurrentPrice())}
              </p>
              {realTimePrice && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full" title="Live price">
                  📡 LIVE
                </span>
              )}
            </div>
            <p className={`text-lg font-medium ${(tokenData.priceChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(tokenData.priceChange24h || 0) >= 0 ? '+' : ''}{(tokenData.priceChange24h || 0).toFixed(2)}%
            </p>
            {/* Last update time */}
            {tokenData.lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {new Date(tokenData.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart 
        tokenId={tokenData.id || ''}
        tokenName={tokenData.name || 'Unknown Token'}
        currentPrice={tokenData.currentPrice || 0}
      />

      {/* Token Calculator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Token Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount of {tokenData.symbol || 'TOKEN'}
            </label>
            <input
              type="number"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter amount"
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              USD Value
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-lg font-semibold text-gray-900">
                  ${getCalculatedUSD().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {realTimePrice && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full" title="Real-time calculation">
                  📡
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Price: {formatPrice(getCurrentPrice())} per {tokenData.symbol || 'TOKEN'}
            </p>
          </div>
        </div>
      </div>

      {/* Token Holders */}
      {(tokenData.platforms?.ethereum || tokenData.platforms?.binancecoin) && (
        <TokenHolders 
          tokenAddress={tokenData.platforms?.ethereum || tokenData.platforms?.binancecoin || ''}
          tokenSymbol={tokenData.symbol || 'TOKEN'}
          decimals={tokenData.detailPlatforms?.ethereum?.decimalPlace || tokenData.detailPlatforms?.binancecoin?.decimalPlace || 18}
          blockchain={tokenData.platforms?.ethereum ? 'ethereum' : 'bsc'}
        />
      )}

      {/* Transaction History Link */}
      {(tokenData.platforms?.ethereum || tokenData.platforms?.binancecoin) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
              <p className="text-sm text-gray-500 mt-1">
                View large transactions (&gt;$100k USD) for this token
              </p>
            </div>
            <Link
              to={`/token/history/${tokenData.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Transactions
            </Link>
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Data Source:</span> {tokenData.source || 'Multi-Source System'} 
              {tokenData.source?.includes('Fallback') && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Fallback Mode
                </span>
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Last updated: {tokenData.lastUpdate ? new Date(tokenData.lastUpdate).toLocaleString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Market Cap</p>
          <p className="text-xl font-semibold text-gray-900">{formatNumber(tokenData.marketCap)}</p>
          <div className="mt-1 space-y-1">
            <p className="text-xs text-gray-500">{formatDetailedNumber(tokenData.marketCap)}</p>
            {btcPrice && tokenData.marketCap && (
              <p className="text-xs text-orange-600 font-medium">{formatBtcEquivalent(tokenData.marketCap)}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">24h Volume</p>
          <p className="text-xl font-semibold text-gray-900">{formatNumber(tokenData.volume24h)}</p>
          <div className="mt-1 space-y-1">
            <p className="text-xs text-gray-500">{formatDetailedNumber(tokenData.volume24h)}</p>
            {btcPrice && tokenData.volume24h && (
              <p className="text-xs text-orange-600 font-medium">{formatBtcEquivalent(tokenData.volume24h)}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">All Time High</p>
          <p className="text-xl font-semibold text-gray-900">
            {tokenData.allTimeHigh ? formatPrice(tokenData.allTimeHigh.price) : 'N/A'}
          </p>
          <div className="mt-1 space-y-1">
            {tokenData.allTimeHigh?.date && (
              <p className="text-xs text-gray-500">
                {new Date(tokenData.allTimeHigh.date).toLocaleDateString()}
              </p>
            )}
            {tokenData.allTimeHigh?.changePercentage && (
              <p className="text-xs text-red-600">
                {tokenData.allTimeHigh.changePercentage.toFixed(1)}% from ATH
              </p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Circulating Supply</p>
          <p className="text-xl font-semibold text-gray-900">{formatSupply(tokenData.circulatingSupply)}</p>
          <div className="mt-1">
            <p className="text-xs text-gray-500">
              {tokenData.maxSupply ? `${formatSupply(tokenData.maxSupply)} max` : 'No max supply'}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Description</h3>
          {tokenData.description && tokenData.description.length > 300 && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
            >
              {isDescriptionExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
        
        {tokenData.description ? (
          <div 
            className="text-gray-700 prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: isDescriptionExpanded 
                ? tokenData.description 
                : truncateDescription(tokenData.description, 300)
            }}
          />
        ) : (
          <div className="text-gray-500 italic text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No description available for this token
          </div>
        )}
      </div>

      {/* Exchanges */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available on Exchanges</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(tokenData.exchanges || []).slice(0, 10).map((exchange: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{exchange.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{exchange.pair}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatPrice(exchange.price)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatNumber(exchange.volume)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      exchange.trustScore === 'green' ? 'bg-green-100 text-green-800' :
                      exchange.trustScore === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {exchange.trustScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a 
                      href={exchange.tradeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Trade
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tokenData.socialLinks?.homepage && tokenData.socialLinks.homepage.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600">Website</p>
              <a 
                href={tokenData.socialLinks.homepage[0]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Visit Website
              </a>
            </div>
          )}
          {tokenData.socialLinks?.twitter && (
            <div>
              <p className="text-sm font-medium text-gray-600">Twitter</p>
              <a 
                href={`https://twitter.com/${tokenData.socialLinks.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                @{tokenData.socialLinks.twitter}
              </a>
            </div>
          )}
          {tokenData.socialLinks?.telegram && (
            <div>
              <p className="text-sm font-medium text-gray-600">Telegram</p>
              <a 
                href={`https://t.me/${tokenData.socialLinks.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Join Channel
              </a>
            </div>
          )}
          {tokenData.socialLinks?.reddit && (
            <div>
              <p className="text-sm font-medium text-gray-600">Reddit</p>
              <a 
                href={tokenData.socialLinks.reddit} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Visit Subreddit
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Community Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Community Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Twitter Followers</p>
            <p className="text-2xl font-semibold text-gray-900">
              {(tokenData.communityStats.twitterFollowers || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Reddit Subscribers</p>
            <p className="text-2xl font-semibold text-gray-900">
              {(tokenData.communityStats.redditSubscribers || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Telegram Members</p>
            <p className="text-2xl font-semibold text-gray-900">
              {(tokenData.communityStats.telegramMembers || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* AI Research Assistant */}
      <AIResearch tokenId={tokenData.id || ''} tokenData={tokenData} />

      {/* Project Overview */}
      <ProjectOverview tokenId={tokenData.id || ''} tokenData={tokenData} />

      {/* Investors Section */}
      <InvestorSection tokenId={tokenData.id || ''} tokenData={tokenData} />

      {/* Funding Rounds Section */}
      <FundingSection tokenId={tokenData.id || ''} tokenData={tokenData} />

      {/* Platforms */}
      {tokenData.platforms && Object.keys(tokenData.platforms).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tokenData.platforms).map(([platform, contractAddress]) => (
              <div key={platform} className="border rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 capitalize">{platform}</p>
                <p className="text-xs text-gray-500 font-mono break-all">{String(contractAddress)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add to Portfolio
          </button>
          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Research More
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            View on CoinGecko
          </button>
        </div>
      </div>
    </div>
  );
}

// Export error boundary
export const ErrorBoundary = TokenErrorBoundary;