import { useState, useEffect } from 'react';

interface FundingRound {
  protocol: string;
  round: string;
  amount: number;
  date: string;
  investors: string[];
  description?: string;
  valuation?: number;
  leadInvestor?: string;
}

interface FundingSectionProps {
  tokenId: string;
  tokenData: any;
}

export default function FundingSection({ tokenId, tokenData }: FundingSectionProps) {
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundingRounds = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get protocol ID from token data
        let protocolId = tokenId;
        
        // If we have a protocol name or symbol, use that
        if (tokenData?.name) {
          protocolId = tokenData.name.toLowerCase().replace(/\s+/g, '-');
        }

        const response = await fetch(`http://localhost:8080/api/v1/defillama/protocol/${protocolId}/funding`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch funding rounds: ${response.status}`);
        }

        const data = await response.json();
        setFundingRounds(data.metadata?.fundingRounds || []);
      } catch (err: any) {
        console.error('Error fetching funding rounds:', err);
        setError(err.message);
        // Set mock data for demonstration
        setFundingRounds([
          {
            protocol: tokenId,
            round: 'Seed',
            amount: 2000000,
            date: '2020-03-15',
            investors: ['Andreessen Horowitz', 'Paradigm', 'Coinbase Ventures'],
            description: 'Seed funding round to develop the protocol',
            valuation: 20000000,
            leadInvestor: 'Andreessen Horowitz',
          },
          {
            protocol: tokenId,
            round: 'Series A',
            amount: 15000000,
            date: '2021-06-20',
            investors: ['Sequoia Capital', 'Andreessen Horowitz', 'Paradigm', 'Polychain Capital'],
            description: 'Series A funding to scale the protocol',
            valuation: 150000000,
            leadInvestor: 'Sequoia Capital',
          },
          {
            protocol: tokenId,
            round: 'Series B',
            amount: 50000000,
            date: '2022-09-10',
            investors: ['Tiger Global', 'Sequoia Capital', 'Andreessen Horowitz', 'Paradigm'],
            description: 'Series B funding for global expansion',
            valuation: 500000000,
            leadInvestor: 'Tiger Global',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFundingRounds();
  }, [tokenId, tokenData]);

  const formatAmount = (amount: number) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const formatValuation = (valuation: number) => {
    if (valuation >= 1e9) return `$${(valuation / 1e9).toFixed(1)}B`;
    if (valuation >= 1e6) return `$${(valuation / 1e6).toFixed(1)}M`;
    return `$${valuation.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoundColor = (round: string) => {
    switch (round.toLowerCase()) {
      case 'seed':
        return 'bg-green-100 text-green-800';
      case 'series a':
        return 'bg-blue-100 text-blue-800';
      case 'series b':
        return 'bg-purple-100 text-purple-800';
      case 'series c':
        return 'bg-orange-100 text-orange-800';
      case 'ipo':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoundIcon = (round: string) => {
    switch (round.toLowerCase()) {
      case 'seed':
        return '🌱';
      case 'series a':
        return '🚀';
      case 'series b':
        return '📈';
      case 'series c':
        return '💎';
      case 'ipo':
        return '🏆';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Rounds</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Rounds</h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-500">Unable to load funding data</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (fundingRounds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Rounds</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">💰</div>
          <p className="text-gray-500">No funding information available</p>
        </div>
      </div>
    );
  }

  // Calculate total funding
  const totalFunding = fundingRounds.reduce((sum, round) => sum + round.amount, 0);
  const latestValuation = fundingRounds[fundingRounds.length - 1]?.valuation;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Funding Rounds</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Raised</div>
          <div className="text-lg font-semibold text-green-600">{formatAmount(totalFunding)}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Rounds</div>
          <div className="text-2xl font-bold text-gray-900">{fundingRounds.length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Latest Valuation</div>
          <div className="text-2xl font-bold text-gray-900">
            {latestValuation ? formatValuation(latestValuation) : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Average Round Size</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatAmount(totalFunding / fundingRounds.length)}
          </div>
        </div>
      </div>

      {/* Funding Rounds Timeline */}
      <div className="space-y-4">
        {fundingRounds.map((round, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getRoundIcon(round.round)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoundColor(round.round)}`}>
                      {round.round}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(round.date)}</span>
                  </div>
                  {round.leadInvestor && (
                    <p className="text-sm text-gray-600 mt-1">
                      Lead: <span className="font-medium">{round.leadInvestor}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatAmount(round.amount)}</div>
                {round.valuation && (
                  <div className="text-sm text-gray-500">
                    Valuation: {formatValuation(round.valuation)}
                  </div>
                )}
              </div>
            </div>

            {round.description && (
              <p className="text-gray-700 mb-4">{round.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-2">Investors ({round.investors.length})</div>
                <div className="flex flex-wrap gap-2">
                  {round.investors.map((investor, invIndex) => (
                    <span
                      key={invIndex}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {investor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Funding data is for informational purposes only and may not reflect current valuations.
          </p>
        </div>
      </div>
    </div>
  );
}
