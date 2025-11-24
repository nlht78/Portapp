import { useState, useEffect } from 'react';

interface Investor {
  name: string;
  website?: string;
  description?: string;
  logo?: string;
  investments: Array<{
    protocol: string;
    amount?: number;
    date?: string;
    round?: string;
    description?: string;
  }>;
}

interface InvestorSectionProps {
  tokenId: string;
  tokenData: any;
}

export default function InvestorSection({ tokenId, tokenData }: InvestorSectionProps) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get protocol ID from token data
        let protocolId = tokenId;
        
        // If we have a protocol name or symbol, use that
        if (tokenData?.name) {
          protocolId = tokenData.name.toLowerCase().replace(/\s+/g, '-');
        }

        const API_URL = process.env.API_URL || 'http://localhost:8080';
        const response = await fetch(`${API_URL}/api/v1/defillama/protocol/${protocolId}/investors`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch investors: ${response.status}`);
        }

        const data = await response.json();
        setInvestors(data.metadata?.investors || []);
      } catch (err: any) {
        console.error('Error fetching investors:', err);
        setError(err.message);
        // Set mock data for demonstration
        setInvestors([
          {
            name: 'Andreessen Horowitz',
            website: 'https://a16z.com',
            description: 'Venture capital firm focused on technology companies',
            logo: 'https://a16z.com/logo.png',
            investments: [
              {
                protocol: tokenId,
                amount: 2000000,
                date: '2020-03-15',
                round: 'Seed',
                description: 'Seed investment',
              },
              {
                protocol: tokenId,
                amount: 5000000,
                date: '2021-06-20',
                round: 'Series A',
                description: 'Series A investment',
              },
            ],
          },
          {
            name: 'Paradigm',
            website: 'https://paradigm.xyz',
            description: 'Investment firm focused on crypto and Web3',
            logo: 'https://paradigm.xyz/logo.png',
            investments: [
              {
                protocol: tokenId,
                amount: 1000000,
                date: '2020-03-15',
                round: 'Seed',
                description: 'Seed investment',
              },
              {
                protocol: tokenId,
                amount: 3000000,
                date: '2021-06-20',
                round: 'Series A',
                description: 'Series A investment',
              },
            ],
          },
          {
            name: 'Sequoia Capital',
            website: 'https://sequoiacap.com',
            description: 'Venture capital firm with a focus on technology',
            logo: 'https://sequoiacap.com/logo.png',
            investments: [
              {
                protocol: tokenId,
                amount: 8000000,
                date: '2021-06-20',
                round: 'Series A',
                description: 'Series A lead investment',
              },
              {
                protocol: tokenId,
                amount: 20000000,
                date: '2022-09-10',
                round: 'Series B',
                description: 'Series B investment',
              },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [tokenId, tokenData]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investors</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investors</h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-500">Unable to load investor data</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investors</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🏢</div>
          <p className="text-gray-500">No investor information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Investors</h3>
        <span className="text-sm text-gray-500">{investors.length} investors</span>
      </div>

      <div className="space-y-6">
        {investors.map((investor, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {investor.logo ? (
                  <img
                    src={investor.logo}
                    alt={investor.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center"
                  style={{ display: investor.logo ? 'none' : 'flex' }}
                >
                  <span className="text-lg font-bold text-indigo-600">
                    {investor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-900">{investor.name}</h4>
                  {investor.website && (
                    <a
                      href={investor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>

                {investor.description && (
                  <p className="text-sm text-gray-600 mt-1">{investor.description}</p>
                )}

                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Investments in {tokenData?.name || 'this protocol'}:</h5>
                  <div className="space-y-2">
                    {investor.investments.map((investment, invIndex) => (
                      <div key={invIndex} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {investment.round || 'Investment'}
                            </span>
                            {investment.date && (
                              <span className="text-xs text-gray-500">
                                {formatDate(investment.date)}
                              </span>
                            )}
                          </div>
                          {investment.description && (
                            <p className="text-xs text-gray-600 mt-1">{investment.description}</p>
                          )}
                        </div>
                        {investment.amount && (
                          <div className="text-right">
                            <span className="text-sm font-semibold text-green-600">
                              {formatAmount(investment.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Investment data is for informational purposes only and may not reflect current holdings.
          </p>
        </div>
      </div>
    </div>
  );
}
