import { json, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { isAuthenticated } from '~/services/auth.server';
import { usePortfolio } from '~/contexts/PortfolioContext';
import PortfolioChart from '~/components/PortfolioChart';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      return json({ portfolioData: null, user: null, tokens: null, userTokens: [] });
    }

    // Fetch user tokens from API
    let userTokens: any[] = [];
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
        const data = await response.json();
        userTokens = data.metadata?.tokens || [];
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }

    // Calculate portfolio statistics
    const totalValue = userTokens.reduce((total, token) => {
      return total + (token.quantity * (token.currentPrice || 0));
    }, 0);

    const totalPurchaseValue = userTokens.reduce((total, token) => {
      return total + (token.quantity * token.purchasePrice);
    }, 0);

    const totalChange = totalPurchaseValue > 0 ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100 : 0;

    const portfolioData = {
      totalValue,
      totalChange: totalChange >= 0 ? `+${totalChange.toFixed(2)}%` : `${totalChange.toFixed(2)}%`,
      totalTokens: userTokens.length,
      tokens: userTokens.map(token => ({
        id: token.id,
        tokenId: token.tokenId,
        name: token.tokenName,
        symbol: token.tokenSymbol,
        price: token.currentPrice || 0,
        purchasePrice: token.purchasePrice,
        quantity: token.quantity,
        value: token.quantity * (token.currentPrice || 0),
        profitLoss: (token.quantity * (token.currentPrice || 0)) - (token.quantity * token.purchasePrice),
        profitLossPercentage: token.purchasePrice > 0 ? 
          (((token.currentPrice || 0) - token.purchasePrice) / token.purchasePrice) * 100 : 0
      }))
    };

    return json({ portfolioData, user: auth.user, tokens: auth.tokens, userTokens });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return json({ 
      portfolioData: null, 
      user: null, 
      tokens: null, 
      userTokens: [] 
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) { 
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const action = formData.get('action');
    
    if (action === 'delete-token') {
      const tokenId = formData.get('tokenId') as string;
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
      return { success: true, message: 'Token deleted successfully', data: result };
    }
    
    return { success: false, message: 'Invalid action' };
  } catch (error: any) {
    console.error('Error in action:', error);
    return { success: false, message: error.message || 'Failed to perform action' };
  }
};

export default function Portfolio() {
  const { portfolioData, user, tokens, userTokens } = useLoaderData<typeof loader>() as {
    portfolioData: any;
    user: any;
    tokens: any;
    userTokens: any[];
  };
  
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fetcher = useFetcher();
  const { updatePortfolioData, updateMarketPrices } = usePortfolio();

  // Lấy giá thời gian thực từ market với multi-source fallback
  const fetchMarketPrices = async () => {
    if (userTokens.length === 0) return;
    
    const startTime = Date.now();
    console.log(`🔄 [${new Date().toLocaleTimeString()}] Starting price fetch...`);
    
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
        console.log(`✅ [${new Date().toLocaleTimeString()}] Prices loaded from ${data.metadata?.source || 'unknown'} source in ${duration}ms`);
      } else {
        console.warn('Failed to fetch market prices:', response.status);
      }
    } catch (error) {
      console.error('Error fetching market prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Load market prices khi component mount
  useEffect(() => {
    if (userTokens.length > 0) {
      fetchMarketPrices();
    }
  }, [userTokens.length]);

  // Auto refresh prices mỗi 30 giây
  useEffect(() => {
    if (userTokens.length > 0) {
      const interval = setInterval(fetchMarketPrices, 30000);
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

  // Xử lý response từ fetcher
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as { success?: boolean; message?: string };
      if (data.success) {
        console.log('Action completed successfully:', data);
        window.location.reload();
      } else {
        console.error('Action failed:', data.message);
        alert(`Error: ${data.message || 'Unknown error'}`);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleAddToken = () => {
    setIsModalOpen(true);
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

  if (!portfolioData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-2">Please log in to view your portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
        <p className="text-gray-600 mt-2">Manage your token investments</p>
      </div>
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
            </div>

      {/* Portfolio Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Portfolio Overview</h3>
            <p className="text-sm text-gray-600">Current portfolio value and performance</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Total Value</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${getRealPortfolioValue().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {Object.keys(marketPrices).length > 0 && (
                <span className="text-xs text-green-600 ml-2" title="Live market value">
                  📡
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">{userTokens.length} tokens</p>
          </div>
        </div>
      </div>

      {/* Portfolio Chart with Profit Metrics */}
      <PortfolioChart 
        userTokens={userTokens}
        marketPrices={marketPrices}
        loadingPrices={loadingPrices}
      />

      {/* Portfolio Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Tokens</h3>
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
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
      </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tokens in portfolio</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first token.</p>
            <div className="mt-6">
              <button 
                onClick={handleAddToken}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
                Add Token
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Add Token Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Token to Portfolio</h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600">Token selection functionality will be implemented here</p>
                <button 
                  onClick={handleCloseModal}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Token</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this token from your portfolio? This action cannot be undone.</p>
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