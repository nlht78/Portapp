import { json, LoaderFunctionArgs, redirect, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import AddTokenModal from '~/components/AddTokenModal';
import { isAuthenticated } from '~/services/auth.server';
import { getUserTokensWithStats, createUserToken } from '~/services/userToken.server';
import { IUserTokenCreateData } from '~/interfaces/userToken.interface';
import { usePortfolio } from '~/contexts/PortfolioContext';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Get user from authentication
    const auth = await isAuthenticated(request);
    if (!auth) {
      return redirect('/token/login');
    }

    // Fetch trending tokens from CoinGecko API
    const response = await fetch(`http://localhost:8080/api/v1/coingecko/trending`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let trendingTokens = [];
    if (response.ok) {
      const data = await response.json();
      trendingTokens = data.metadata.tokens || [];
    }

    // Fetch user tokens
    let userTokens = [];
    try {
      const response = await fetch('http://localhost:8080/api/v1/user-tokens/with-stats', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.tokens.accessToken}`,
          'x-client-id': auth.user.id,
          'x-api-key': process.env.API_APIKEY || '',
        },
      });

      if (response.ok) {
        const userTokensData = await response.json();
        userTokens = userTokensData.metadata.tokens || [];
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }

    // Mock data for other dashboard sections
    const dashboardData = {
      totalTokens: userTokens.length,
      portfolioValue: 45678.90, // Will be updated by client-side calculation
      trendingTokens,
      recentTokens: [
        { name: 'New Token 1', symbol: 'NT1', marketCap: '$1.2M', volume: '$500K' },
        { name: 'New Token 2', symbol: 'NT2', marketCap: '$890K', volume: '$200K' },
        { name: 'New Token 3', symbol: 'NT3', marketCap: '$2.1M', volume: '$800K' },
      ]
    };

    return json({ dashboardData, user: auth.user, tokens: auth.tokens, userTokens });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return json({ 
      dashboardData: {
        totalTokens: 1250,
        portfolioValue: 45678.90,
        trendingTokens: [],
        recentTokens: []
      },
      user: null,
      tokens: null,
      userTokens: []
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/token/login');
  }

  try {
    const formData = await request.formData();
    const action = formData.get('action');

    if (action === 'add-token') {
      const tokenData: IUserTokenCreateData = {
        tokenId: formData.get('tokenId') as string,
        tokenName: formData.get('tokenName') as string,
        tokenSymbol: formData.get('tokenSymbol') as string,
        quantity: parseFloat(formData.get('quantity') as string),
        purchasePrice: parseFloat(formData.get('purchasePrice') as string),
        currentPrice: parseFloat(formData.get('currentPrice') as string),
        notes: formData.get('notes') as string,
      };

      // Gọi API để thêm token
      const response = await fetch('http://localhost:8080/api/v1/user-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.tokens.accessToken}`,
          'x-client-id': auth.user.id,
          'x-api-key': process.env.API_APIKEY || '',
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Token added successfully',
        data: result,
      };
    }

    if (action === 'delete-token') {
      const tokenId = formData.get('tokenId') as string;

      // Gọi API để xóa token
      const response = await fetch(`http://localhost:8080/api/v1/user-tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.tokens.accessToken}`,
          'x-client-id': auth.user.id,
          'x-api-key': process.env.API_APIKEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Token deleted successfully',
        data: result,
      };
    }

    return {
      success: false,
      message: 'Invalid action',
    };
  } catch (error: any) {
    console.error('Error in action:', error);
    return {
      success: false,
      message: error.message || 'Failed to add token',
    };
  }
};

export default function Dashboard() {
  const { dashboardData, user, tokens, userTokens } = useLoaderData<typeof loader>() as {
    dashboardData: any;
    user: any;
    tokens: any;
    userTokens: any[];
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const fetcher = useFetcher();
  const { updatePortfolioData, updateMarketPrices } = usePortfolio();

  // Xử lý response từ fetcher
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as { success?: boolean; message?: string };
      if (data.success) {
        console.log('Action completed successfully:', data);
        // Refresh page để cập nhật danh sách token
        window.location.reload();
      } else {
        console.error('Action failed:', data.message);
        alert(`Error: ${data.message || 'Unknown error'}`);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleAddToken = () => {
    console.log('handleAddToken called');
    setIsModalOpen(true);
    console.log('Modal should be open now');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  const handleDeleteToken = (tokenId: string) => {
    setDeleteTokenId(tokenId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTokenId) {
      const formData = new FormData();
      formData.append('action', 'delete-token');
      formData.append('tokenId', deleteTokenId);
      
      fetcher.submit(formData, { method: 'post' });
    }
    setShowDeleteModal(false);
    setDeleteTokenId(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTokenId(null);
  };

  // Handle add token from trending
  const handleAddFromTrending = (trendingToken: any) => {
    // Pre-fill token data from trending token
    const tokenData = {
      tokenId: trendingToken.id,
      tokenName: trendingToken.name,
      tokenSymbol: trendingToken.symbol,
      quantity: 1, // Default quantity
      purchasePrice: trendingToken.current_price || 0,
      currentPrice: trendingToken.current_price || 0,
      notes: `Added from trending tokens`
    };
    
    setSelectedToken(tokenData);
    setIsModalOpen(true);
  };

  // Lấy giá thời gian thực từ market với multi-source fallback
  const fetchMarketPrices = async () => {
    if (userTokens.length === 0) return;
    
    const startTime = Date.now();
    console.log(`🔄 [${new Date().toLocaleTimeString()}] Dashboard: Starting price fetch...`);
    
    setLoadingPrices(true);
    try {
      const tokenIds = userTokens.map(token => token.tokenId).join(',');
      
      const response = await fetch(`http://localhost:8080/api/v1/multi-pricing/prices?ids=${tokenIds}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const prices: Record<string, number> = {};
        
        if (data.metadata && data.metadata.prices) {
          Object.entries(data.metadata.prices).forEach(([tokenId, priceData]: [string, any]) => {
            prices[tokenId] = priceData.price || 0;
          });
        }
        
        setMarketPrices(prices);
        updateMarketPrices(prices, data.metadata?.source || 'unknown');
        const duration = Date.now() - startTime;
        console.log(`✅ [${new Date().toLocaleTimeString()}] Dashboard: Prices loaded from ${data.metadata?.source || 'unknown'} source in ${duration}ms`);
      } else {
        console.warn('Failed to fetch market prices:', response.status);
      }
    } catch (error) {
      console.error('Error fetching market prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Load market prices khi component mount hoặc userTokens thay đổi
  useEffect(() => {
    if (userTokens.length > 0) {
      fetchMarketPrices();
    }
  }, [userTokens.length]);

  // Auto refresh prices mỗi 30 giây
  useEffect(() => {
    if (userTokens.length > 0) {
      const interval = setInterval(fetchMarketPrices, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [userTokens.length]);

  // Update portfolio data when userTokens or marketPrices change
  useEffect(() => {
    if (userTokens.length > 0) {
      const totalValue = userTokens.reduce((total, token) => {
        const currentPrice = marketPrices[token.tokenId] || token.currentPrice || 0;
        return total + (token.quantity * currentPrice);
      }, 0);

      const totalPurchaseValue = userTokens.reduce((total, token) => {
        return total + (token.quantity * token.purchasePrice);
      }, 0);

      const totalChange = totalValue - totalPurchaseValue;
      const totalChangePercent = totalPurchaseValue > 0 ? (totalChange / totalPurchaseValue) * 100 : 0;

      updatePortfolioData({
        totalValue,
        totalChange,
        totalChangePercent,
        totalTokens: userTokens.length,
        loadingPrices
      });
    }
  }, [userTokens.length, Object.keys(marketPrices).length, loadingPrices]); // Chỉ depend vào length và loadingPrices

  // Tính toán giá trị hiển thị
  const getDisplayPrice = (token: any) => {
    const marketPrice = marketPrices[token.tokenId];
    return marketPrice || token.currentPrice || 0;
  };

  // Tính tổng lợi nhuận của portfolio
  const getTotalProfit = () => {
    return userTokens.reduce((total, token) => {
      const currentPrice = getDisplayPrice(token);
      const totalValue = token.quantity * currentPrice;
      const totalPurchaseValue = token.quantity * token.purchasePrice;
      return total + (totalValue - totalPurchaseValue);
    }, 0);
  };

  // Tính phần trăm lợi nhuận của portfolio
  const getTotalProfitPercentage = () => {
    const totalPurchaseValue = userTokens.reduce((total, token) => {
      return total + (token.quantity * token.purchasePrice);
    }, 0);
    
    if (totalPurchaseValue === 0) return 0;
    
    const totalProfit = getTotalProfit();
    return (totalProfit / totalPurchaseValue) * 100;
  };

  const getTotalValue = (token: any) => {
    const currentPrice = getDisplayPrice(token);
    return token.quantity * currentPrice;
  };

  const getProfitLoss = (token: any) => {
    const currentPrice = getDisplayPrice(token);
    const totalValue = getTotalValue(token);
    const purchaseValue = token.quantity * token.purchasePrice;
    return totalValue - purchaseValue;
  };

  const getProfitLossPercentage = (token: any) => {
    const purchaseValue = token.quantity * token.purchasePrice;
    const profitLoss = getProfitLoss(token);
    return purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;
  };

  // Tính portfolio value thực tế
  const getRealPortfolioValue = () => {
    return userTokens.reduce((total, token) => {
      const currentPrice = getDisplayPrice(token);
      return total + (token.quantity * currentPrice);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Token Research Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your token research platform</p>
      </div>

      {/* User Portfolio Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Portfolio</h2>
          <div className="flex space-x-3">
            <button 
              onClick={fetchMarketPrices}
              disabled={loadingPrices}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loadingPrices ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>Refresh Prices</span>
            </button>
            <button 
              onClick={handleAddToken}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Token
            </button>
          </div>
        </div>

        {userTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userTokens.map((token: any) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{token.tokenSymbol[0]}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{token.tokenName}</p>
                          <p className="text-sm text-gray-500">{token.tokenSymbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{token.quantity.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">${token.purchasePrice.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          ${getDisplayPrice(token).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                        {loadingPrices && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                        )}
                        {marketPrices[token.tokenId] && (
                          <span className="text-xs text-green-600" title="Live market price">
                            📡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ${getTotalValue(token).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        getProfitLoss(token) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${getProfitLoss(token).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({getProfitLossPercentage(token).toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button 
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens in your portfolio</h3>
            <p className="text-gray-600 mb-4">Start building your portfolio by adding your first token</p>
            <button 
              onClick={handleAddToken}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Your First Token
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${getRealPortfolioValue().toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {Object.keys(marketPrices).length > 0 && (
                  <span className="text-xs text-green-600 ml-2" title="Live market value">
                    📡
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className={`text-2xl font-semibold ${
                getTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${getTotalProfit().toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {Object.keys(marketPrices).length > 0 && (
                  <span className="text-xs text-green-600 ml-2" title="Live profit calculation">
                    📡
                  </span>
                )}
              </p>
              <p className={`text-xs ${
                getTotalProfitPercentage() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {getTotalProfitPercentage() >= 0 ? '+' : ''}{getTotalProfitPercentage().toFixed(2)}% from purchase
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tokens */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Trending Tokens</h3>
          <p className="text-sm text-gray-600 mt-1">Most popular tokens in the last 24 hours</p>
        </div>
        <div className="p-6">
          {dashboardData.trendingTokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.trendingTokens.slice(0, 6).map((token: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{token.symbol[0]}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{token.name}</p>
                        <p className="text-xs text-gray-500">{token.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Rank #{token.market_cap_rank}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <a 
                      href={`/token/${token.id}`}
                      className="flex-1 text-center text-xs bg-indigo-100 text-indigo-700 py-1 rounded hover:bg-indigo-200"
                    >
                      Research
                    </a>
                    <button 
                      onClick={() => handleAddFromTrending(token)}
                      className="flex-1 text-center text-xs bg-green-100 text-green-700 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No trending tokens available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tokens - Real Portfolio Data */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recently Added Tokens</h3>
            <span className="text-sm text-gray-500">{userTokens.length} tokens in portfolio</span>
          </div>
        </div>
        {userTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userTokens.slice(0, 5).map((token: any, index: number) => (
                  <tr key={token.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{token.tokenSymbol?.[0] || '?'}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{token.tokenName}</p>
                          <p className="text-xs text-gray-500">{token.tokenSymbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{token.quantity.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">${token.purchasePrice.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          ${getDisplayPrice(token).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                        {loadingPrices && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                        )}
                        {marketPrices[token.tokenId] && (
                          <span className="text-xs text-green-600" title="Live market price">
                            📡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        getProfitLoss(token) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${getProfitLoss(token).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({getProfitLossPercentage(token).toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {userTokens.length > 5 && (
              <div className="px-6 py-3 bg-gray-50 text-center">
                <p className="text-sm text-gray-600">
                  Showing 5 of {userTokens.length} tokens. 
                  <a href="/token/portfolio" className="text-indigo-600 hover:text-indigo-900 ml-1">
                    View all tokens
                  </a>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens in your portfolio</h3>
            <p className="text-gray-600 mb-4">Start building your portfolio by adding your first token</p>
            <button 
              onClick={handleAddToken}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Your First Token
            </button>
          </div>
        )}
      </div>

      {/* Add Token Modal */}
      <AddTokenModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={user}
        tokens={tokens}
        preFilledToken={selectedToken}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Token</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this token from your portfolio? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}