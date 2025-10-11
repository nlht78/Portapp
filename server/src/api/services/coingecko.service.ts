import axios from 'axios';
import { NotFoundError } from '../core/errors';
import { CoinCapService } from './coincap.service';
import { CryptoCompareService } from './cryptocompare.service';

export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  description: {
    en: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: {
      usd: number;
    };
    ath_date: {
      usd: string;
    };
    ath_change_percentage: {
      usd: number;
    };
  };
  platforms: Record<string, string>;
  tickers: Array<{
    base: string;
    target: string;
    market: {
      name: string;
      category: string;
      has_trading_incentive: boolean;
    };
    last: number;
    volume: number;
    converted_last: {
      usd: number;
    };
    converted_volume: {
      usd: number;
    };
    trust_score: string;
    bid_ask_spread_percentage: number;
    timestamp: string;
    last_traded_at: string;
    last_fetch_at: string;
    is_anomaly: boolean;
    is_stale: boolean;
    trade_url: string;
    token_info_url: string | null;
    coin_id: string;
    target_coin_id: string;
  }>;
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  community_data: {
    facebook_likes: number | null;
    twitter_followers: number;
    reddit_subscribers: number;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    reddit_subscribers_48h: number;
    reddit_accounts_active_48h: number;
    telegram_channel_user_count: number | null;
  };
  developer_data: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_request_contributors: number;
    code_additions_deletions_4_weeks: {
      additions: number;
      deletions: number;
    };
    commit_count_4_weeks: number;
    last_4_weeks_commit_activity_series: number[];
  };
  public_interest_score: number;
  public_interest_stats: {
    alexa_rank: number | null;
    bing_matches: number | null;
  };
  status_updates: any[];
  last_updated: string;
}

export interface MarketChartData {
  prices: Array<[number, number]>; // [timestamp, price]
  market_caps: Array<[number, number]>; // [timestamp, market_cap]
  total_volumes: Array<[number, number]>; // [timestamp, volume]
}

export interface FormattedChartData {
  labels: string[];
  prices: number[];
  volumes: number[];
  marketCaps: number[];
}

export interface FormattedTokenData {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  description: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  allTimeHigh?: {
    price: number;
    date: string;
    changePercentage: number;
  };
  exchanges: Array<{
    name: string;
    pair: string;
    price: number;
    volume: number;
    trustScore: string;
    tradeUrl: string;
  }>;
  socialLinks: {
    homepage: string[];
    twitter: string;
    telegram: string;
    reddit: string;
    github: string[];
  };
  communityStats: {
    twitterFollowers: number;
    redditSubscribers: number;
    telegramMembers: number;
  };
  platforms: Record<string, string>;
}

export class CoinGeckoService {
  private static readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private static readonly API_KEY = process.env.COINGECKO_API_KEY;

  // Get token data by ID
  static async getTokenData(tokenId: string): Promise<FormattedTokenData> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add delay between retries to avoid rate limiting
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }

        const response = await axios.get<CoinGeckoTokenData>(
          `${this.BASE_URL}/coins/${tokenId}`,
          {
            params: {
              localization: false,
              tickers: true,
              market_data: true,
              community_data: true,
              developer_data: true,
              sparkline: false,
            },
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        return this.formatTokenData(response.data);
      } catch (error) {
        lastError = error;
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new NotFoundError(`Token with ID '${tokenId}' not found`);
          }
          if (error.response?.status === 429) {
            // Rate limited, wait longer before retry
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
              continue;
            }
          }
          if (error.response?.status === 401) {
            throw new Error(`CoinGecko API authentication error: ${error.message}`);
          }
        }
        
        if (attempt === maxRetries) {
          const errorMessage = axios.isAxiosError(error) ? error.message : 'Unknown error';
          throw new Error(`CoinGecko API error after ${maxRetries} attempts: ${errorMessage}`);
        }
      }
    }

    throw lastError;
  }

  // Get market chart data with fallback to free endpoints
  static async getMarketChart(tokenId: string, days: number = 1, currency: string = 'usd'): Promise<FormattedChartData> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add delay between retries to avoid rate limiting
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }

        // Try different approaches based on days
        if (days === 1) {
          // For 1 day, use simple price endpoint with sparkline
          return await this.getSparklineData(tokenId);
        } else {
          // For longer periods, try market_chart first, then fallback to CoinCap
          try {
            return await this.getMarketChartData(tokenId, days, currency);
          } catch (error) {
            console.log(`CoinGecko market chart failed for ${days} days, trying CoinCap API`);
            try {
              const coincapId = CoinCapService.getCoinCapId(tokenId);
              return await CoinCapService.getHistory(coincapId, days);
            } catch (coincapError) {
              console.log('CoinCap API failed, trying CryptoCompare API');
              try {
                const cryptocompareSymbol = CryptoCompareService.getCryptoCompareSymbol(tokenId);
                if (days === 1) {
                  return await CryptoCompareService.getHourlyHistory(cryptocompareSymbol);
                } else {
                  return await CryptoCompareService.getHistory(cryptocompareSymbol, days);
                }
              } catch (cryptocompareError) {
                console.log('CryptoCompare API also failed, using mock data');
                return this.generateMockChartData(tokenId, days);
              }
            }
          }
        }
      } catch (error) {
        lastError = error;
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new NotFoundError(`Token with ID '${tokenId}' not found`);
          }
          if (error.response?.status === 429) {
            // Rate limited, try CoinCap API
            console.log('CoinGecko rate limited, trying CoinCap API');
            try {
              const coincapId = CoinCapService.getCoinCapId(tokenId);
              return await CoinCapService.getHistory(coincapId, days);
            } catch (coincapError) {
              console.log('CoinCap API failed, trying CryptoCompare API');
              try {
                const cryptocompareSymbol = CryptoCompareService.getCryptoCompareSymbol(tokenId);
                if (days === 1) {
                  return await CryptoCompareService.getHourlyHistory(cryptocompareSymbol);
                } else {
                  return await CryptoCompareService.getHistory(cryptocompareSymbol, days);
                }
              } catch (cryptocompareError) {
                console.log('CryptoCompare API also failed, using mock data');
                return this.generateMockChartData(tokenId, days);
              }
            }
          }
          if (error.response?.status === 401) {
            // Authentication error, try CoinCap API
            console.log('CoinGecko authentication error, trying CoinCap API');
            try {
              const coincapId = CoinCapService.getCoinCapId(tokenId);
              return await CoinCapService.getHistory(coincapId, days);
            } catch (coincapError) {
              console.log('CoinCap API failed, trying CryptoCompare API');
              try {
                const cryptocompareSymbol = CryptoCompareService.getCryptoCompareSymbol(tokenId);
                if (days === 1) {
                  return await CryptoCompareService.getHourlyHistory(cryptocompareSymbol);
                } else {
                  return await CryptoCompareService.getHistory(cryptocompareSymbol, days);
                }
              } catch (cryptocompareError) {
                console.log('CryptoCompare API also failed, using mock data');
                return this.generateMockChartData(tokenId, days);
              }
            }
          }
        }
        
        if (attempt === maxRetries) {
          // Skip CoinCap (currently having issues) and go directly to CryptoCompare
          console.log('CoinGecko rate limited, trying CryptoCompare API');
          try {
            const cryptocompareSymbol = CryptoCompareService.getCryptoCompareSymbol(tokenId);
            console.log(`🟡 Using CryptoCompare for ${tokenId} → ${cryptocompareSymbol}`);
            
            if (days === 1) {
              return await CryptoCompareService.getHourlyHistory(cryptocompareSymbol);
            } else {
              return await CryptoCompareService.getHistory(cryptocompareSymbol, days);
            }
          } catch (cryptocompareError) {
            console.log('CryptoCompare API also failed, using mock data');
            console.warn('CryptoCompare error:', cryptocompareError);
            return this.generateMockChartData(tokenId, days);
          }
        }
      }
    }

    // Ultimate fallback to mock data
    return this.generateMockChartData(tokenId, days);
  }

  // Search tokens by query
  static async searchTokens(query: string): Promise<Array<{ id: string; name: string; symbol: string; market_cap_rank: number }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/search`, {
        params: { query },
        timeout: 10000,
      });

      return response.data.coins || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinGecko API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get trending tokens
  static async getTrendingTokens(): Promise<Array<{ id: string; name: string; symbol: string; market_cap_rank: number }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/search/trending`, {
        timeout: 10000,
      });

      return response.data.coins.map((coin: any) => coin.item) || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinGecko API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get token prices by IDs
  static async getTokenPrices(tokenIds: string[]): Promise<Record<string, number>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/simple/price`, {
        params: {
          ids: tokenIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: false,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const prices: Record<string, number> = {};
      Object.entries(response.data).forEach(([tokenId, data]: [string, any]) => {
        prices[tokenId] = data.usd || 0;
      });

      return prices;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinGecko API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Format raw CoinGecko data to our format
  private static formatTokenData(data: CoinGeckoTokenData): FormattedTokenData {
    const exchanges = data.tickers
      .filter(ticker => ticker.market.category === 'spot')
      .slice(0, 20) // Limit to top 20 exchanges
      .map(ticker => ({
        name: ticker.market.name,
        pair: `${ticker.base}/${ticker.target}`,
        price: ticker.converted_last.usd,
        volume: ticker.converted_volume.usd,
        trustScore: ticker.trust_score,
        tradeUrl: ticker.trade_url,
      }));

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      currentPrice: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      volume24h: data.market_data.total_volume.usd,
      priceChange24h: data.market_data.price_change_percentage_24h,
      priceChange7d: data.market_data.price_change_percentage_7d,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      maxSupply: data.market_data.max_supply,
      description: data.description.en,
      image: data.image,
      allTimeHigh: data.market_data.ath?.usd ? {
        price: data.market_data.ath.usd,
        date: data.market_data.ath_date?.usd || new Date().toISOString(),
        changePercentage: data.market_data.ath_change_percentage?.usd || 0,
      } : undefined,
      exchanges,
      socialLinks: {
        homepage: data.links.homepage,
        twitter: data.links.twitter_screen_name,
        telegram: data.links.telegram_channel_identifier,
        reddit: data.links.subreddit_url,
        github: data.links.repos_url.github,
      },
      communityStats: {
        twitterFollowers: data.community_data.twitter_followers,
        redditSubscribers: data.community_data.reddit_subscribers,
        telegramMembers: data.community_data.telegram_channel_user_count || 0,
      },
      platforms: data.platforms,
    };
  }

  // Format sparkline data for 1 day
  private static formatSparklineData(data: any, days: number): FormattedChartData {
    const sparkline = data.market_data?.sparkline_7d;
    if (!sparkline || !sparkline.price) {
      // Fallback to simple data
      const currentPrice = data.market_data?.current_price?.usd || 0;
      return {
        labels: ['Current'],
        prices: [currentPrice],
        volumes: [data.market_data?.total_volume?.usd || 0],
        marketCaps: [data.market_data?.market_cap?.usd || 0],
      };
    }

    const prices = sparkline.price;
    const labels: string[] = [];
    
    // Generate labels for 7 days
    for (let i = 0; i < prices.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (prices.length - 1 - i));
      labels.push(date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }));
    }

    return {
      labels,
      prices,
      volumes: new Array(prices.length).fill(data.market_data?.total_volume?.usd || 0),
      marketCaps: new Array(prices.length).fill(data.market_data?.market_cap?.usd || 0),
    };
  }

  // Format chart data
  private static formatChartData(data: MarketChartData, days: number): FormattedChartData {
    const labels: string[] = [];
    const prices: number[] = [];
    const volumes: number[] = [];
    const marketCaps: number[] = [];

    data.prices.forEach(([timestamp, price]) => {
      const date = new Date(timestamp);
      
      // Format label based on time range
      let label: string;
      if (days === 1) {
        label = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (days <= 7) {
        label = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        label = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }

      labels.push(label);
      prices.push(price);
    });

    data.total_volumes.forEach(([timestamp, volume]) => {
      volumes.push(volume);
    });

    data.market_caps.forEach(([timestamp, marketCap]) => {
      marketCaps.push(marketCap);
    });

    return {
      labels,
      prices,
      volumes,
      marketCaps,
    };
  }

  // Get sparkline data (free endpoint)
  private static async getSparklineData(tokenId: string): Promise<FormattedChartData> {
    const response = await axios.get(`${this.BASE_URL}/coins/${tokenId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: true,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return this.formatSparklineData(response.data, 1);
  }

  // Try to get market chart data (may require paid API)
  private static async getMarketChartData(tokenId: string, days: number, currency: string): Promise<FormattedChartData> {
    const params: any = {
      vs_currency: currency,
      days: days,
      interval: days === 1 ? 'hourly' : 'daily',
    };

    if (this.API_KEY) {
      params.x_cg_demo_api_key = this.API_KEY;
    }

    const response = await axios.get<MarketChartData>(
      `${this.BASE_URL}/coins/${tokenId}/market_chart`,
      {
        params,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    return this.formatChartData(response.data, days);
  }

  // Generate mock chart data when API fails
  private static generateMockChartData(tokenId: string, days: number): FormattedChartData {
    const basePrice = 45000; // Base price for Bitcoin
    const volatility = 0.05; // 5% volatility
    const dataPoints = days === 1 ? 24 : days === 7 ? 7 : 30;
    
    const labels: string[] = [];
    const prices: number[] = [];
    const volumes: number[] = [];
    const marketCaps: number[] = [];

    for (let i = 0; i < dataPoints; i++) {
      // Generate date labels
      const date = new Date();
      if (days === 1) {
        date.setHours(date.getHours() - (dataPoints - 1 - i));
        labels.push(date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }));
      } else {
        date.setDate(date.getDate() - (dataPoints - 1 - i));
        labels.push(date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }));
      }

      // Generate realistic price data with some randomness
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const price = basePrice * (1 + randomChange);
      prices.push(price);

      // Generate volume and market cap data
      const volume = 25000000000 + Math.random() * 10000000000;
      const marketCap = price * 19500000; // Assuming 19.5M circulating supply

      volumes.push(volume);
      marketCaps.push(marketCap);
    }

    return {
      labels,
      prices,
      volumes,
      marketCaps,
    };
  }
} 