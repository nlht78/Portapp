import { fetcher } from './index';

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

export interface CoinGeckoSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

export interface CoinGeckoSearchResponse {
  coins: CoinGeckoSearchResult[];
}

export interface CoinGeckoTrendingResponse {
  coins: Array<{
    item: CoinGeckoSearchResult;
  }>;
}

// Search tokens
export const searchTokens = async (query: string) => {
  return await fetcher(`/coingecko/search?query=${encodeURIComponent(query)}`);
};

// Get trending tokens
export const getTrendingTokens = async () => {
  return await fetcher('/coingecko/trending');
};

// Get token details
export const getTokenDetails = async (tokenId: string) => {
  return await fetcher(`/coingecko/tokens/${tokenId}`);
};

// Get multiple token prices
export const getTokenPrices = async (tokenIds: string[]) => {
  const ids = tokenIds.join(',');
  return await fetcher(`/coingecko/prices?ids=${ids}`);
};
