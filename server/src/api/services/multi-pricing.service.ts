import axios from 'axios';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
  source: 'coinpaprika' | 'messari' | 'coingecko' | 'binance';
}

export interface PricingResult {
  prices: Record<string, TokenPrice>;
  source: string;
  success: boolean;
  error?: string;
}

export class MultiPricingService {
  private static readonly COINPAPRIKA_BASE_URL = 'https://api.coinpaprika.com/v1';
  private static readonly MESSARI_BASE_URL = 'https://data.messari.io/api/v1';
  private static readonly COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
  private static readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

  // Main pricing method with fallback strategy
  static async getTokenPrices(tokenIds: string[]): Promise<PricingResult> {
    if (tokenIds.length === 0) {
      return { prices: {}, source: 'none', success: true };
    }

    // Try sources in order of preference
    const sources = [
      () => this.getCoinPaprikaPrices(tokenIds),
      () => this.getMessariPrices(tokenIds),
      () => this.getCoinGeckoPrices(tokenIds),
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn('Pricing source failed:', error);
        continue;
      }
    }

    return {
      prices: {},
      source: 'none',
      success: false,
      error: 'All pricing sources failed'
    };
  }

  // CoinPaprika API (Primary - Free, high rate limit)
  private static async getCoinPaprikaPrices(tokenIds: string[]): Promise<PricingResult> {
    try {
      // Direct mapping for common tokens
      const tokenMapping: Record<string, string> = {
        'bitcoin': 'btc-bitcoin',
        'ethereum': 'eth-ethereum',
        'cardano': 'ada-cardano',
        'polkadot': 'dot-polkadot',
        'solana': 'sol-solana',
        'chainlink': 'link-chainlink',
        'litecoin': 'ltc-litecoin',
        'bitcoin-cash': 'bch-bitcoin-cash',
        'stellar': 'xlm-stellar',
        'monero': 'xmr-monero',
        'world-liberty-financial': 'wlf-world-liberty-financial'
      };

      // Get prices for all tokens in one request
      const tickersResponse = await axios.get(`${this.COINPAPRIKA_BASE_URL}/tickers`, {
        params: {
          quotes: 'USD',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const tickers = tickersResponse.data;
      const prices: Record<string, TokenPrice> = {};

      // Map token IDs to prices
      tokenIds.forEach(tokenId => {
        const coinId = tokenMapping[tokenId.toLowerCase()] || tokenId;
        const ticker = tickers.find((t: any) => t.id === coinId);
        
        if (ticker) {
          prices[tokenId] = {
            id: tokenId,
            symbol: ticker.symbol,
            name: ticker.name,
            price: ticker.quotes.USD.price,
            change24h: ticker.quotes.USD.percent_change_24h,
            volume24h: ticker.quotes.USD.volume_24h,
            marketCap: ticker.quotes.USD.market_cap,
            lastUpdated: new Date(),
            source: 'coinpaprika'
          };
        } else {
          console.warn(`Token not found in CoinPaprika: ${tokenId} (mapped to: ${coinId})`);
        }
      });

      return {
        prices,
        source: 'coinpaprika',
        success: true
      };
    } catch (error) {
      throw new Error(`CoinPaprika API error: ${error}`);
    }
  }

  // Messari API (Fallback - Free tier)
  private static async getMessariPrices(tokenIds: string[]): Promise<PricingResult> {
    try {
      const prices: Record<string, TokenPrice> = {};
      
      // Messari requires individual requests, but we can batch them
      const promises = tokenIds.map(async (tokenId) => {
        try {
          const response = await axios.get(`${this.MESSARI_BASE_URL}/assets/${tokenId}/metrics/market-data`, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          const data = response.data.data;
          return {
            id: tokenId,
            symbol: data.symbol,
            name: data.name,
            price: data.market_data.price_usd,
            change24h: data.market_data.percent_change_usd_last_24_hours,
            volume24h: data.market_data.volume_last_24_hours,
            marketCap: data.market_data.market_cap_last_24_hours,
            lastUpdated: new Date(),
            source: 'messari' as const
          };
        } catch (error) {
          console.warn(`Messari failed for ${tokenId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result) {
          prices[result.id] = result;
        }
      });

      return {
        prices,
        source: 'messari',
        success: Object.keys(prices).length > 0
      };
    } catch (error) {
      throw new Error(`Messari API error: ${error}`);
    }
  }

  // CoinGecko API (Last resort)
  private static async getCoinGeckoPrices(tokenIds: string[]): Promise<PricingResult> {
    try {
      // Token ID mapping: coinpaprika ID -> coingecko ID
      const tokenMapping: Record<string, string> = {
        'btc-bitcoin': 'bitcoin',
        'eth-ethereum': 'ethereum',
        'ada-cardano': 'cardano',
        'dot-polkadot': 'polkadot',
        'sol-solana': 'solana',
        'link-chainlink': 'chainlink',
        'ltc-litecoin': 'litecoin',
        'bch-bitcoin-cash': 'bitcoin-cash',
        'xlm-stellar': 'stellar',
        'xmr-monero': 'monero',
      };

      // Map token IDs to CoinGecko format
      const mappedIds = tokenIds.map(id => tokenMapping[id] || id);
      const idToOriginal: Record<string, string> = {};
      tokenIds.forEach((originalId, index) => {
        idToOriginal[mappedIds[index]] = originalId;
      });

      const response = await axios.get(`${this.COINGECKO_BASE_URL}/simple/price`, {
        params: {
          ids: mappedIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const prices: Record<string, TokenPrice> = {};
      Object.entries(response.data).forEach(([geckoId, data]: [string, any]) => {
        const originalId = idToOriginal[geckoId] || geckoId;
        prices[originalId] = {
          id: originalId,
          symbol: originalId.toUpperCase(),
          name: originalId,
          price: data.usd || 0,
          change24h: data.usd_24h_change || 0,
          volume24h: data.usd_24h_vol || 0,
          marketCap: data.usd_market_cap || 0,
          lastUpdated: new Date(),
          source: 'coingecko'
        };
      });

      return {
        prices,
        source: 'coingecko',
        success: true
      };
    } catch (error) {
      throw new Error(`CoinGecko API error: ${error}`);
    }
  }

  // Get single token price with fallback
  static async getTokenPrice(tokenId: string): Promise<TokenPrice | null> {
    const result = await this.getTokenPrices([tokenId]);
    return result.prices[tokenId] || null;
  }

  // Get trending tokens from multiple sources
  static async getTrendingTokens(): Promise<TokenPrice[]> {
    try {
      // Try CoinPaprika first - get top coins by market cap
      const response = await axios.get(`${this.COINPAPRIKA_BASE_URL}/tickers`, {
        params: {
          quotes: 'USD',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const tickers = response.data;
      // Sort by market cap and take top 20
      const topTickers = tickers
        .filter((ticker: any) => ticker.quotes?.USD?.market_cap > 0)
        .sort((a: any, b: any) => b.quotes.USD.market_cap - a.quotes.USD.market_cap)
        .slice(0, 20);

      return topTickers.map((ticker: any) => ({
        id: ticker.id,
        symbol: ticker.symbol,
        name: ticker.name,
        price: ticker.quotes?.USD?.price || 0,
        change24h: ticker.quotes?.USD?.percent_change_24h || 0,
        volume24h: ticker.quotes?.USD?.volume_24h || 0,
        marketCap: ticker.quotes?.USD?.market_cap || 0,
        lastUpdated: new Date(),
        source: 'coinpaprika'
      }));
    } catch (error) {
      console.warn('Trending tokens failed:', error);
      return [];
    }
  }

  // Search tokens across multiple sources
  static async searchTokens(query: string): Promise<any[]> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(`${this.COINPAPRIKA_BASE_URL}/search`, {
          params: { 
            q: query,
            c: 'currencies', // Only search currencies
            limit: 20 // Limit results
          },
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const results = response.data;
        const currencies = results.currencies || [];

        // Format to match CoinGecko structure for compatibility
        const formattedResults = currencies.map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol?.toUpperCase(),
          market_cap_rank: coin.rank,
          thumb: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
          large: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
          // Additional CoinPaprika specific data
          is_active: coin.is_active,
          type: coin.type,
          source: 'coinpaprika'
        }));

        return formattedResults;

      } catch (error) {
        lastError = error;
        console.warn(`❌ CoinPaprika search attempt ${attempt} failed for "${query}":`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    console.error(`🚫 CoinPaprika search failed after ${maxRetries} attempts for "${query}":`, lastError);
    throw new Error(`CoinPaprika search failed: ${lastError?.message || 'Unknown error'}`);
  }

  // Enhanced search with price data
  static async searchTokensWithPrices(query: string): Promise<any[]> {
    try {
      const searchResults = await this.searchTokens(query);
      
      if (searchResults.length === 0) {
        return [];
      }

      // Get prices for top 10 results
      const topResults = searchResults.slice(0, 10);
      const tokenIds = topResults.map(token => token.id);
      
      try {
        const priceResult = await this.getTokenPrices(tokenIds);
        
        // Merge search results with price data
        return topResults.map(token => ({
          ...token,
          current_price: priceResult.prices[token.id]?.price || 0,
          price_change_percentage_24h: priceResult.prices[token.id]?.change24h || 0,
          market_cap: priceResult.prices[token.id]?.marketCap || 0,
          total_volume: priceResult.prices[token.id]?.volume24h || 0,
        }));
      } catch (priceError) {
        console.warn('Failed to fetch prices for search results:', priceError);
        return searchResults; // Return without price data
      }
    } catch (error) {
      console.error('Enhanced search failed:', error);
      throw error;
    }
  }
}
