import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { useState, useEffect } from 'react';

interface Transaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  gasPrice: number;
  gasUsed: number;
  blockNumber: number;
  confirmations: number;
  status: 'success' | 'failed';
  method?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface LoaderData {
  tokenId: string;
  tokenData: any;
  transactions: Transaction[];
  pagination: PaginationInfo;
  total: number;
  blockchain: string;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { tokenId } = params;
  
  if (!tokenId) {
    throw new Response('Token ID is required', { status: 400 });
  }

  try {
    // Get token data first
    const tokenResponse = await fetch(`http://localhost:8080/api/v1/coingecko/tokens/${tokenId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!tokenResponse.ok) {
      throw new Response('Failed to fetch token data', { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();

    // Get transaction history
    const tokenAddress = tokenData.metadata.platforms?.ethereum || tokenData.metadata.platforms?.binancecoin;
    const blockchain = tokenData.metadata.platforms?.ethereum ? 'ethereum' : 'bsc';

    if (!tokenAddress) {
      return json({
        tokenId,
        tokenData: tokenData.metadata,
        transactions: [],
        pagination: null,
        total: 0,
        blockchain: '',
      });
    }

    const url = new URL(`http://localhost:8080/api/v1/transaction-history/${tokenAddress}/large-transactions`);
    url.searchParams.set('blockchain', blockchain);
    url.searchParams.set('limit', '20');
    url.searchParams.set('page', '1');
    url.searchParams.set('minValueUsd', '100000');

    const txResponse = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!txResponse.ok) {
      throw new Response('Failed to fetch transaction data', { status: txResponse.status });
    }

    const txData = await txResponse.json();

    return json({
      tokenId,
      tokenData: tokenData.metadata,
      transactions: txData.metadata.transactions || [],
      pagination: txData.metadata.pagination || null,
      total: txData.metadata.total || 0,
      blockchain: txData.metadata.blockchain || '',
    });
  } catch (error) {
    console.error('Error loading transaction history:', error);
    throw new Response('Failed to load transaction history', { status: 500 });
  }
};

export default function TokenHistory() {
  const { tokenId, tokenData, transactions, pagination, total, blockchain } = useLoaderData<LoaderData>();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentTransactions, setCurrentTransactions] = useState(transactions);

  const fetchTransactions = async (page: number = 1) => {
    if (!tokenData.platforms?.ethereum && !tokenData.platforms?.binancecoin) return;
    
    setLoading(true);
    try {
      const tokenAddress = tokenData.platforms?.ethereum || tokenData.platforms?.binancecoin;
      const url = new URL(`http://localhost:8080/api/v1/transaction-history/${tokenAddress}/large-transactions`);
      url.searchParams.set('blockchain', blockchain);
      url.searchParams.set('limit', '20');
      url.searchParams.set('page', page.toString());
      url.searchParams.set('minValueUsd', '100000');

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setCurrentTransactions(data.metadata.transactions || []);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const formatValueUsd = (valueUsd: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueUsd);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getExplorerUrl = (hash: string) => {
    switch (blockchain) {
      case 'bsc':
        return `https://bscscan.com/tx/${hash}`;
      case 'ethereum':
      default:
        return `https://etherscan.io/tx/${hash}`;
    }
  };

  const getAddressExplorerUrl = (address: string) => {
    switch (blockchain) {
      case 'bsc':
        return `https://bscscan.com/address/${address}`;
      case 'ethereum':
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (pagination.hasPrev) {
      pages.push(
        <button
          key="prev"
          onClick={() => fetchTransactions(currentPage - 1)}
          disabled={loading}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchTransactions(i)}
          disabled={loading}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50`}
        >
          {i}
        </button>
      );
    }

    if (pagination.hasNext) {
      pages.push(
        <button
          key="next"
          onClick={() => fetchTransactions(currentPage + 1)}
          disabled={loading}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {pagination.totalPages}
        </div>
        <div className="flex space-x-1">{pages}</div>
      </div>
    );
  };

  if (!tokenData.platforms?.ethereum && !tokenData.platforms?.binancecoin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Transaction History Not Available</h2>
            <p className="text-gray-500 mb-4">
              This token doesn't have a contract address on supported blockchains.
            </p>
            <Link
              to={`/token/${tokenId}`}
              className="text-indigo-600 hover:text-indigo-900"
            >
              ← Back to Token Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {tokenData.name} ({tokenData.symbol}) Transaction History
            </h1>
            <p className="mt-2 text-gray-600">
              Large transactions (&gt;$100k USD) on {blockchain === 'bsc' ? 'Binance Smart Chain' : 'Ethereum'}
            </p>
          </div>
          <Link
            to={`/token/${tokenId}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Token Details
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Total Transactions</h3>
            <p className="text-3xl font-bold text-indigo-600">{total.toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Current Price</h3>
            <p className="text-3xl font-bold text-green-600">
              ${tokenData.currentPrice?.toFixed(6) || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Market Cap</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${(tokenData.marketCap || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Large Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing transactions with value &gt;$100,000 USD
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading transactions...</p>
          </div>
        ) : currentTransactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No large transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value (USD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {formatAddress(tx.hash)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(tx.timestamp)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={getAddressExplorerUrl(tx.from)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-indigo-600 hover:text-indigo-900"
                      >
                        {formatAddress(tx.from)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={getAddressExplorerUrl(tx.to)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-indigo-600 hover:text-indigo-900"
                      >
                        {formatAddress(tx.to)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatValue(tx.value)} {tokenData.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatValueUsd(tx.valueUsd)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {renderPagination()}
      </div>
    </div>
  );
} 