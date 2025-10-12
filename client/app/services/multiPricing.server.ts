import { fetcher } from './index';

export interface MultiPricingToken {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface MultiPricingResponse {
  tokens: MultiPricingToken[];
}

// Get prices for multiple tokens
export const getMultiPrices = async (tokenIds: string[]) => {
  const ids = tokenIds.join(',');
  return await fetcher(`/multi-pricing/prices?ids=${ids}`);
};

// Get trending tokens from multiple sources
export const getMultiTrending = async () => {
  return await fetcher('/multi-pricing/trending');
};
