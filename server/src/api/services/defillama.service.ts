import axios from 'axios';

interface DeFiLlamaToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
  chainId: number;
}

interface DeFiLlamaProtocol {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: Array<{
    name: string;
    url: string;
    date: string;
  }>;
  category: string;
  twitter?: string;
  forkedFrom?: string;
  listedAt?: number;
  gecko_id?: string;
  tvl: number;
  cmcId?: string;
  chainTvls: Record<string, number>;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  fdv?: number;
  staking?: {
    staking_tvl: number;
    staking_tvl_ratio: number;
  };
  pool2?: {
    pool2_tvl: number;
    pool2_tvl_ratio: number;
  };
  governance?: {
    governance_tvl: number;
    governance_tvl_ratio: number;
  };
  treasury?: {
    treasury_tvl: number;
    treasury_tvl_ratio: number;
  };
  vesting?: {
    vesting_tvl: number;
    vesting_tvl_ratio: number;
  };
  stablecoins?: {
    stablecoins_tvl: number;
    stablecoins_tvl_ratio: number;
  };
  borrowed?: {
    borrowed_tvl: number;
    borrowed_tvl_ratio: number;
  };
  doublecounted?: number;
  liquidations?: {
    liquidations_tvl: number;
    liquidations_tvl_ratio: number;
  };
  off_chain?: {
    off_chain_tvl: number;
    off_chain_tvl_ratio: number;
  };
  other?: {
    other_tvl: number;
    other_tvl_ratio: number;
  };
  methodology?: {
    methodology_tvl: number;
    methodology_tvl_ratio: number;
  };
  parentProtocol?: string;
  wrongLiquidity?: boolean;
  stakingRewards?: number;
  tokenPrice?: number;
  tokenPriceChange?: {
    '1h'?: number;
    '1d'?: number;
    '7d'?: number;
  };
  tokenMarketCap?: number;
  tokenSupply?: number;
  tokenAddress?: string;
  tokenDecimals?: number;
  tokenLogoURI?: string;
  tokenCoingeckoId?: string;
  tokenChainId?: number;
  tokenListedAt?: number;
  tokenAudits?: Array<{
    name: string;
    url: string;
    date: string;
  }>;
  tokenCategory?: string;
  tokenTwitter?: string;
  tokenForkedFrom?: string;
  tokenGeckoId?: string;
  tokenCmcId?: string;
  tokenChainTvls?: Record<string, number>;
  tokenChange1h?: number;
  tokenChange1d?: number;
  tokenChange7d?: number;
  tokenStaking?: {
    staking_tvl: number;
    staking_tvl_ratio: number;
  };
  tokenPool2?: {
    pool2_tvl: number;
    pool2_tvl_ratio: number;
  };
  tokenGovernance?: {
    governance_tvl: number;
    governance_tvl_ratio: number;
  };
  tokenTreasury?: {
    treasury_tvl: number;
    treasury_tvl_ratio: number;
  };
  tokenVesting?: {
    vesting_tvl: number;
    vesting_tvl_ratio: number;
  };
  tokenStablecoins?: {
    stablecoins_tvl: number;
    stablecoins_tvl_ratio: number;
  };
  tokenBorrowed?: {
    borrowed_tvl: number;
    borrowed_tvl_ratio: number;
  };
  tokenDoublecounted?: number;
  tokenLiquidations?: {
    liquidations_tvl: number;
    liquidations_tvl_ratio: number;
  };
  tokenOffChain?: {
    off_chain_tvl: number;
    off_chain_tvl_ratio: number;
  };
  tokenOther?: {
    other_tvl: number;
    other_tvl_ratio: number;
  };
  tokenMethodology?: {
    methodology_tvl: number;
    methodology_tvl_ratio: number;
  };
  tokenParentProtocol?: string;
  tokenWrongLiquidity?: boolean;
  tokenStakingRewards?: number;
}

interface DeFiLlamaTreasury {
  protocol: string;
  symbol: string;
  token: string;
  amount: number;
  value: number;
  chain: string;
  coingeckoId?: string;
}

interface DeFiLlamaTreasuryResponse {
  [protocol: string]: {
    [chain: string]: {
      [token: string]: {
        amount: number;
        value: number;
        coingeckoId?: string;
      };
    };
  };
}

interface DeFiLlamaInvestor {
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

interface DeFiLlamaFundingRound {
  protocol: string;
  round: string;
  amount: number;
  date: string;
  investors: string[];
  description?: string;
  valuation?: number;
  leadInvestor?: string;
}

export class DeFiLlamaService {
  private static readonly BASE_URL = 'https://api.llama.fi';
  private static readonly TIMEOUT = 10000;

  /**
   * Get protocol data by ID or name
   */
  static async getProtocol(protocolId: string): Promise<DeFiLlamaProtocol | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/protocol/${protocolId}`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'TokenResearch/1.0',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('DeFiLlama getProtocol error:', error.message);
      return null;
    }
  }

  /**
   * Search protocols by name or symbol
   */
  static async searchProtocols(query: string): Promise<DeFiLlamaProtocol[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/protocols`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'TokenResearch/1.0',
        },
      });

      const protocols = response.data || [];
      
      // Filter protocols by query
      const filtered = protocols.filter((protocol: DeFiLlamaProtocol) => 
        protocol.name?.toLowerCase().includes(query.toLowerCase()) ||
        protocol.symbol?.toLowerCase().includes(query.toLowerCase()) ||
        protocol.gecko_id?.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, 20); // Limit to 20 results
    } catch (error: any) {
      console.error('DeFiLlama searchProtocols error:', error.message);
      return [];
    }
  }

  /**
   * Get treasury data for a protocol
   */
  static async getTreasury(protocolId: string): Promise<DeFiLlamaTreasury[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/treasury/${protocolId}`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'TokenResearch/1.0',
        },
      });

      const treasuryData = response.data as DeFiLlamaTreasuryResponse;
      const treasuries: DeFiLlamaTreasury[] = [];

      // Flatten the nested structure
      for (const [protocol, chains] of Object.entries(treasuryData)) {
        for (const [chain, tokens] of Object.entries(chains)) {
          for (const [token, data] of Object.entries(tokens)) {
            treasuries.push({
              protocol,
              symbol: token,
              token,
              amount: data.amount,
              value: data.value,
              chain,
              coingeckoId: data.coingeckoId,
            });
          }
        }
      }

      return treasuries;
    } catch (error: any) {
      console.error('DeFiLlama getTreasury error:', error.message);
      return [];
    }
  }

  /**
   * Get token data by address
   */
  static async getTokenData(address: string, chain: string = 'ethereum'): Promise<DeFiLlamaToken | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/tokens`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'TokenResearch/1.0',
        },
      });

      const tokens = response.data || [];
      const token = tokens.find((t: DeFiLlamaToken) => 
        t.address?.toLowerCase() === address.toLowerCase() && 
        t.chainId?.toString() === this.getChainId(chain)
      );

      return token || null;
    } catch (error: any) {
      console.error('DeFiLlama getTokenData error:', error.message);
      return null;
    }
  }

  /**
   * Get protocol TVL history
   */
  static async getProtocolTvlHistory(protocolId: string, days: number = 30): Promise<any[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/protocol/${protocolId}`, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'TokenResearch/1.0',
        },
      });

      const protocol = response.data;
      if (!protocol?.tvl) return [];

      // Get TVL history from the last N days
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - (days * 24 * 60 * 60);
      
      const tvlHistory = [];
      for (let i = 0; i < days; i++) {
        const timestamp = startTime + (i * 24 * 60 * 60);
        const tvl = protocol.tvl[timestamp] || 0;
        tvlHistory.push({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          tvl,
          timestamp,
        });
      }

      return tvlHistory;
    } catch (error: any) {
      console.error('DeFiLlama getProtocolTvlHistory error:', error.message);
      return [];
    }
  }

  /**
   * Get funding rounds and investor information (mock data for now)
   * Note: DeFiLlama doesn't have direct funding data, so we'll generate realistic mock data
   */
  static async getFundingRounds(protocolId: string): Promise<DeFiLlamaFundingRound[]> {
    try {
      // This is mock data since DeFiLlama doesn't provide funding information
      // In a real implementation, you would integrate with other APIs like Crunchbase, PitchBook, etc.
      const mockFundingRounds: DeFiLlamaFundingRound[] = [
        {
          protocol: protocolId,
          round: 'Seed',
          amount: 2000000,
          date: '2020-03-15',
          investors: ['Andreessen Horowitz', 'Paradigm', 'Coinbase Ventures'],
          description: 'Seed funding round to develop the protocol',
          valuation: 20000000,
          leadInvestor: 'Andreessen Horowitz',
        },
        {
          protocol: protocolId,
          round: 'Series A',
          amount: 15000000,
          date: '2021-06-20',
          investors: ['Sequoia Capital', 'Andreessen Horowitz', 'Paradigm', 'Polychain Capital'],
          description: 'Series A funding to scale the protocol',
          valuation: 150000000,
          leadInvestor: 'Sequoia Capital',
        },
        {
          protocol: protocolId,
          round: 'Series B',
          amount: 50000000,
          date: '2022-09-10',
          investors: ['Tiger Global', 'Sequoia Capital', 'Andreessen Horowitz', 'Paradigm'],
          description: 'Series B funding for global expansion',
          valuation: 500000000,
          leadInvestor: 'Tiger Global',
        },
      ];

      return mockFundingRounds;
    } catch (error: any) {
      console.error('DeFiLlama getFundingRounds error:', error.message);
      return [];
    }
  }

  /**
   * Get investor information (mock data for now)
   */
  static async getInvestors(protocolId: string): Promise<DeFiLlamaInvestor[]> {
    try {
      // This is mock data since DeFiLlama doesn't provide investor information
      // In a real implementation, you would integrate with other APIs
      const mockInvestors: DeFiLlamaInvestor[] = [
        {
          name: 'Andreessen Horowitz',
          website: 'https://a16z.com',
          description: 'Venture capital firm focused on technology companies',
          logo: 'https://a16z.com/logo.png',
          investments: [
            {
              protocol: protocolId,
              amount: 2000000,
              date: '2020-03-15',
              round: 'Seed',
              description: 'Seed investment',
            },
            {
              protocol: protocolId,
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
              protocol: protocolId,
              amount: 1000000,
              date: '2020-03-15',
              round: 'Seed',
              description: 'Seed investment',
            },
            {
              protocol: protocolId,
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
              protocol: protocolId,
              amount: 8000000,
              date: '2021-06-20',
              round: 'Series A',
              description: 'Series A lead investment',
            },
            {
              protocol: protocolId,
              amount: 20000000,
              date: '2022-09-10',
              round: 'Series B',
              description: 'Series B investment',
            },
          ],
        },
      ];

      return mockInvestors;
    } catch (error: any) {
      console.error('DeFiLlama getInvestors error:', error.message);
      return [];
    }
  }

  /**
   * Get comprehensive protocol data including funding and investors
   */
  static async getComprehensiveProtocolData(protocolId: string): Promise<{
    protocol: DeFiLlamaProtocol | null;
    treasury: DeFiLlamaTreasury[];
    fundingRounds: DeFiLlamaFundingRound[];
    investors: DeFiLlamaInvestor[];
    tvlHistory: any[];
  }> {
    try {
      const [protocol, treasury, fundingRounds, investors, tvlHistory] = await Promise.all([
        this.getProtocol(protocolId),
        this.getTreasury(protocolId),
        this.getFundingRounds(protocolId),
        this.getInvestors(protocolId),
        this.getProtocolTvlHistory(protocolId, 30),
      ]);

      return {
        protocol,
        treasury,
        fundingRounds,
        investors,
        tvlHistory,
      };
    } catch (error: any) {
      console.error('DeFiLlama getComprehensiveProtocolData error:', error.message);
      return {
        protocol: null,
        treasury: [],
        fundingRounds: [],
        investors: [],
        tvlHistory: [],
      };
    }
  }

  /**
   * Helper method to get chain ID
   */
  private static getChainId(chain: string): string {
    const chainMap: Record<string, string> = {
      'ethereum': '1',
      'bsc': '56',
      'polygon': '137',
      'avalanche': '43114',
      'arbitrum': '42161',
      'optimism': '10',
      'fantom': '250',
      'cronos': '25',
      'harmony': '1666600000',
      'moonriver': '1285',
      'moonbeam': '1284',
    };
    return chainMap[chain.toLowerCase()] || '1';
  }
}
