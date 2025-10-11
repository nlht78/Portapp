import axios from 'axios';
import { NotFoundError } from '../core/errors';

export interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
  explorer: string;
}

export interface CoinCapHistory {
  priceUsd: string;
  time: number;
  circulatingSupply: string;
  date: string;
}

export interface FormattedChartData {
  labels: string[];
  prices: number[];
  volumes: number[];
  marketCaps: number[];
}

export class CoinCapService {
  private static readonly BASE_URL = 'https://api.coincap.io/v2';

  // Get current asset data
  static async getAssetData(assetId: string): Promise<CoinCapAsset> {
    try {
      const response = await axios.get(`${this.BASE_URL}/assets/${assetId}`, {
        timeout: 10000,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Asset with ID '${assetId}' not found`);
        }
        throw new Error(`CoinCap API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get historical data
  static async getHistory(assetId: string, days: number = 1): Promise<FormattedChartData> {
    try {
      const interval = days === 1 ? 'h1' : 'd1';
      const start = Date.now() - (days * 24 * 60 * 60 * 1000);
      const end = Date.now();

      const response = await axios.get(`${this.BASE_URL}/assets/${assetId}/history`, {
        params: {
          interval,
          start,
          end,
        },
        timeout: 15000,
      });

      return this.formatHistoryData(response.data.data, days);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Asset with ID '${assetId}' not found`);
        }
        throw new Error(`CoinCap API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Search assets
  static async searchAssets(query: string): Promise<Array<{ id: string; name: string; symbol: string; rank: string }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/assets`, {
        params: { search: query },
        timeout: 10000,
      });
      return response.data.data.map((asset: CoinCapAsset) => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        rank: asset.rank,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinCap API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get top assets
  static async getTopAssets(limit: number = 20): Promise<Array<{ id: string; name: string; symbol: string; rank: string }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/assets`, {
        params: { limit },
        timeout: 10000,
      });
      return response.data.data.map((asset: CoinCapAsset) => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        rank: asset.rank,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinCap API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Format history data for charts
  private static formatHistoryData(data: CoinCapHistory[], days: number): FormattedChartData {
    const labels: string[] = [];
    const prices: number[] = [];
    const volumes: number[] = [];
    const marketCaps: number[] = [];

    data.forEach((item) => {
      const date = new Date(item.time);
      
      // Format label based on time range
      let label: string;
      if (days === 1) {
        label = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        label = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }

      labels.push(label);
      prices.push(parseFloat(item.priceUsd));
      
      // CoinCap doesn't provide volume in history, so we'll use a placeholder
      volumes.push(0);
      marketCaps.push(0);
    });

    return {
      labels,
      prices,
      volumes,
      marketCaps,
    };
  }

  // Map CoinGecko IDs to CoinCap IDs
  static getCoinCapId(coinGeckoId: string): string {
    const idMap: Record<string, string> = {
      'bitcoin': 'bitcoin',
      'ethereum': 'ethereum',
      'cardano': 'cardano',
      'solana': 'solana',
      'polkadot': 'polkadot',
      'chainlink': 'chainlink',
      'uniswap': 'uniswap',
      'aave': 'aave',
      'litecoin': 'litecoin',
      'bitcoin-cash': 'bitcoin-cash',
      'stellar': 'stellar',
      'monero': 'monero',
      'tron': 'tron',
      'eos': 'eos',
      'tezos': 'tezos',
      'neo': 'neo',
      'vechain': 'vechain',
      'iota': 'iota',
      'dash': 'dash',
      'zcash': 'zcash',
    };

    return idMap[coinGeckoId] || coinGeckoId;
  }
} 