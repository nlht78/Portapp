import axios from 'axios';
import { NotFoundError } from '../core/errors';

export interface CryptoComparePrice {
  USD: number;
}

export interface CryptoCompareHistory {
  time: number;
  high: number;
  low: number;
  open: number;
  volumefrom: number;
  volumeto: number;
  close: number;
  conversionType: string;
  conversionSymbol: string;
}

export interface FormattedChartData {
  labels: string[];
  prices: number[];
  volumes: number[];
  marketCaps: number[];
}

export class CryptoCompareService {
  private static readonly BASE_URL = 'https://min-api.cryptocompare.com/data';
  private static readonly API_KEY = process.env.CRYPTOCOMPARE_API_KEY;

  // Get request headers with API key
  private static getHeaders() {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    if (this.API_KEY) {
      headers['Authorization'] = `Apikey ${this.API_KEY}`;
    }
    
    return headers;
  }

  // Get current price with enhanced error handling
  static async getPrice(symbol: string): Promise<number> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const response = await axios.get<{ USD: number }>(`${this.BASE_URL}/price`, {
          params: {
            fsym: symbol,
            tsyms: 'USD',
          },
          headers: this.getHeaders(),
          timeout: 10000,
        });

        if (response.data && typeof response.data.USD === 'number') {
          return response.data.USD;
        } else {
          throw new Error(`Invalid response format for symbol ${symbol}`);
        }
      } catch (error) {
        lastError = error;
        if (axios.isAxiosError(error)) {
          console.warn(`CryptoCompare attempt ${attempt} failed for ${symbol}:`, error.message);
          if (error.response?.status === 429 && attempt < maxRetries) {
            continue; // Retry on rate limit
          }
        }
        if (attempt === maxRetries) break;
      }
    }

    throw new Error(`CryptoCompare API error after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Get historical data with enhanced error handling
  static async getHistory(symbol: string, days: number = 1): Promise<FormattedChartData> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const limit = Math.min(days, 2000); // CryptoCompare limit
        const response = await axios.get<{ Data: { Data: CryptoCompareHistory[] } }>(
          `${this.BASE_URL}/v2/histoday`,
          {
            params: {
              fsym: symbol,
              tsym: 'USD',
              limit,
            },
            headers: this.getHeaders(),
            timeout: 15000,
          }
        );

        if (response.data?.Data?.Data && Array.isArray(response.data.Data.Data)) {
          return this.formatHistoryData(response.data.Data.Data, days);
        } else {
          throw new Error(`Invalid history response format for symbol ${symbol}`);
        }
      } catch (error) {
        lastError = error;
        if (axios.isAxiosError(error)) {
          console.warn(`CryptoCompare history attempt ${attempt} failed for ${symbol}:`, error.message);
          if (error.response?.status === 404) {
            throw new NotFoundError(`Symbol '${symbol}' not found`);
          }
          if (error.response?.status === 429 && attempt < maxRetries) {
            continue; // Retry on rate limit
          }
        }
        if (attempt === maxRetries) break;
      }
    }

    throw new Error(`CryptoCompare history API error after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Get hourly data for 1 day with enhanced error handling
  static async getHourlyHistory(symbol: string): Promise<FormattedChartData> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const response = await axios.get<{ Data: { Data: CryptoCompareHistory[] } }>(
          `${this.BASE_URL}/v2/histohour`,
          {
            params: {
              fsym: symbol,
              tsym: 'USD',
              limit: 24,
            },
            headers: this.getHeaders(),
            timeout: 15000,
          }
        );

        if (response.data?.Data?.Data && Array.isArray(response.data.Data.Data)) {
          return this.formatHistoryData(response.data.Data.Data, 1);
        } else {
          throw new Error(`Invalid hourly history response format for symbol ${symbol}`);
        }
      } catch (error) {
        lastError = error;
        if (axios.isAxiosError(error)) {
          console.warn(`CryptoCompare hourly attempt ${attempt} failed for ${symbol}:`, error.message);
          if (error.response?.status === 404) {
            throw new NotFoundError(`Symbol '${symbol}' not found`);
          }
          if (error.response?.status === 429 && attempt < maxRetries) {
            continue; // Retry on rate limit
          }
        }
        if (attempt === maxRetries) break;
      }
    }

    throw new Error(`CryptoCompare hourly API error after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Search coins
  static async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string; rank: number }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/all/coinlist`, {
        timeout: 10000,
      });

      const coins = response.data.Data;
      const filteredCoins = Object.values(coins).filter((coin: any) =>
        coin.FullName.toLowerCase().includes(query.toLowerCase()) ||
        coin.Symbol.toLowerCase().includes(query.toLowerCase())
      );

      return filteredCoins.slice(0, 20).map((coin: any) => ({
        id: coin.Symbol.toLowerCase(),
        name: coin.FullName,
        symbol: coin.Symbol,
        rank: 0, // CryptoCompare doesn't provide rank in search
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CryptoCompare API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get top coins
  static async getTopCoins(limit: number = 20): Promise<Array<{ id: string; name: string; symbol: string; rank: number }>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/top/mktcapfull`, {
        params: {
          limit,
          tsym: 'USD',
        },
        timeout: 10000,
      });

      return response.data.Data.map((coin: any, index: number) => ({
        id: coin.CoinInfo.Name.toLowerCase(),
        name: coin.CoinInfo.FullName,
        symbol: coin.CoinInfo.Name,
        rank: index + 1,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CryptoCompare API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Format history data for charts
  private static formatHistoryData(data: CryptoCompareHistory[], days: number): FormattedChartData {
    const labels: string[] = [];
    const prices: number[] = [];
    const volumes: number[] = [];
    const marketCaps: number[] = [];

    data.forEach((item) => {
      const date = new Date(item.time * 1000);
      
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
      prices.push(item.close);
      volumes.push(item.volumeto);
      marketCaps.push(0); // CryptoCompare doesn't provide market cap in history
    });

    return {
      labels,
      prices,
      volumes,
      marketCaps,
    };
  }

  // Map CoinGecko IDs to CryptoCompare symbols with comprehensive coverage
  static getCryptoCompareSymbol(coinGeckoId: string): string {
    const symbolMap: Record<string, string> = {
      // Major cryptocurrencies
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'ripple': 'XRP',
      'cardano': 'ADA',
      'solana': 'SOL',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'uniswap': 'UNI',
      'aave': 'AAVE',
      'litecoin': 'LTC',
      'bitcoin-cash': 'BCH',
      'stellar': 'XLM',
      'monero': 'XMR',
      'tron': 'TRX',
      'eos': 'EOS',
      'tezos': 'XTZ',
      'neo': 'NEO',
      'vechain': 'VET',
      'iota': 'MIOTA',
      'dash': 'DASH',
      'zcash': 'ZEC',
      
      // Popular tokens
      'worldcoin-wld': 'WLD',
      'worldcoin': 'WLD',
      'polygon': 'MATIC',
      'avalanche-2': 'AVAX',
      'fantom': 'FTM',
      'cosmos': 'ATOM',
      'algorand': 'ALGO',
      'near': 'NEAR',
      'internet-computer': 'ICP',
      'hedera-hashgraph': 'HBAR',
      'the-graph': 'GRT',
      'sandbox': 'SAND',
      'decentraland': 'MANA',
      'axie-infinity': 'AXS',
      'gala': 'GALA',
      'enjincoin': 'ENJ',
      'chiliz': 'CHZ',
      'basic-attention-token': 'BAT',
      'maker': 'MKR',
      'compound': 'COMP',
      'sushi': 'SUSHI',
      'yearn-finance': 'YFI',
      'curve-dao-token': 'CRV',
      'synthetix': 'SNX',
      'balancer': 'BAL',
      'uma': 'UMA',
      'loopring': 'LRC',
      '0x': 'ZRX',
      'kyber-network-crystal': 'KNC',
      'bancor': 'BNT',
      
      // Stablecoins
      'tether': 'USDT',
      'usd-coin': 'USDC',
      'dai': 'DAI',
      'frax': 'FRAX',
      'terrausd': 'UST',
      'true-usd': 'TUSD',
      'paxos-standard': 'PAX',
      'gemini-dollar': 'GUSD',
      
      // Layer 2 & Scaling
      'optimism': 'OP',
      'arbitrum': 'ARB',
      'immutable-x': 'IMX',
    };

    // First try exact match
    if (symbolMap[coinGeckoId]) {
      return symbolMap[coinGeckoId];
    }

    // Try removing common suffixes and prefixes
    const cleanId = coinGeckoId
      .replace(/^wrapped-/, '')
      .replace(/-token$/, '')
      .replace(/-coin$/, '')
      .replace(/-network$/, '')
      .replace(/-protocol$/, '');

    if (symbolMap[cleanId]) {
      return symbolMap[cleanId];
    }

    // Fallback: convert to uppercase and take first part
    const fallbackSymbol = coinGeckoId.split('-')[0].toUpperCase();
    return fallbackSymbol;
  }
} 