// Client-side service for multi-pricing (used in components)
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
  prices: Record<string, MultiPricingToken>;
  source: string;
}

// Get prices for multiple tokens (client-side)
export const getMultiPricesClient = async (tokenIds: string[]): Promise<MultiPricingResponse> => {
  const ids = tokenIds.join(',');
  const response = await fetch(`/api/v1/multi-pricing/prices?ids=${ids}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.status}`);
  }

  const data = await response.json();
  return data.metadata;
};

// Get trending tokens from multiple sources (client-side)
export const getMultiTrendingClient = async (): Promise<any> => {
  const response = await fetch('/api/v1/multi-pricing/trending', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trending: ${response.status}`);
  }

  const data = await response.json();
  return data.metadata;
};
