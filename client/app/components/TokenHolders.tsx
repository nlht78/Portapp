import React, { useState, useEffect } from 'react';

interface TokenHolder {
  address: string;
  balance: number;
  share: number;
  rank?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TokenHoldersProps {
  tokenAddress: string;
  tokenSymbol?: string;
  decimals?: number;
  blockchain?: string;
}

export default function TokenHolders({ tokenAddress, tokenSymbol = 'TOKEN', decimals = 18, blockchain }: TokenHoldersProps) {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHolders, setTotalHolders] = useState(0);
  const [detectedBlockchain, setDetectedBlockchain] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchTokenHolders = async (page: number = 1) => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.API_URL || 'http://localhost:8080';
      const url = new URL(`${API_URL}/api/v1/token-holders/${tokenAddress}/holders`);
      url.searchParams.set('limit', '30');
      url.searchParams.set('page', page.toString());
      if (blockchain) {
        url.searchParams.set('blockchain', blockchain);
      }

       const response = await fetch(url.toString(), {
         headers: {
           'Content-Type': 'application/json',
         },
       });

      if (!response.ok) {
        throw new Error(`Failed to fetch token holders: ${response.status}`);
      }

             const data = await response.json();
       setHolders(data.metadata.holders || []);
       setTotalHolders(data.metadata.total || 0);
       setDetectedBlockchain(data.metadata.blockchain || '');
       setCurrentPage(page);
       setPagination(data.metadata.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load token holders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenHolders(1);
  }, [tokenAddress]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    const adjustedBalance = balance / Math.pow(10, decimals);
    if (adjustedBalance >= 1e9) {
      return `${(adjustedBalance / 1e9).toFixed(2)}B`;
    }
    if (adjustedBalance >= 1e6) {
      return `${(adjustedBalance / 1e6).toFixed(2)}M`;
    }
    if (adjustedBalance >= 1e3) {
      return `${(adjustedBalance / 1e3).toFixed(2)}K`;
    }
    return adjustedBalance.toFixed(2);
  };

  const formatShare = (share: number) => {
    return `${share.toFixed(2)}%`;
  };

  const getExplorerUrl = (address: string) => {
    switch (detectedBlockchain) {
      case 'bsc':
        return `https://bscscan.com/address/${address}`;
      case 'ethereum':
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  const getBlockchainName = () => {
    switch (detectedBlockchain) {
      case 'bsc':
        return 'Binance Smart Chain';
      case 'ethereum':
        return 'Ethereum';
      default:
        return 'Blockchain';
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchTokenHolders(newPage);
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

    // Previous button
    if (pagination.hasPrev) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (pagination.hasNext) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Token Holders</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Token Holders</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
                         <button
               onClick={() => fetchTokenHolders(1)}
               className="text-indigo-600 hover:text-indigo-900"
             >
               Try again
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenAddress) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Token Holders</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Token address not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Top Token Holders</h3>
        {totalHolders > 0 && (
          <span className="text-sm text-gray-500">
            Total: {totalHolders.toLocaleString()} holders
          </span>
        )}
      </div>
      
      {holders.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No holders data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                             {holders.map((holder) => (
                 <tr key={holder.address} className="hover:bg-gray-50">
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className="text-sm font-medium text-gray-900">
                       #{holder.rank || 'N/A'}
                     </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {formatAddress(holder.address)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatBalance(holder.balance)} {tokenSymbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatShare(holder.share)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                         <a
                       href={getExplorerUrl(holder.address)}
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
       
       <div className="mt-4 text-xs text-gray-500">
         <p>Data provided by {getBlockchainName()} API</p>
         <p>Click "View" to see address details on {getBlockchainName()} Explorer</p>
       </div>
    </div>
  );
} 