import axios from 'axios';
import { NotFoundError } from '../core/errors';

export interface TokenHolder {
  address: string;
  balance: number;
  share: number;
  rank?: number;
}

export interface TokenHoldersResponse {
  holders: TokenHolder[];
  total: number;
  blockchain: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BlockchainInfo {
  name: string;
  explorer: string;
  apiUrl: string;
  apiKey?: string;
}

export class EthplorerService {
  private static readonly BASE_URL = 'https://api.ethplorer.io';
  private static readonly API_KEY = process.env.ETHPLORER_API_KEY || 'freekey';

  // Get top token holders
  static async getTopTokenHolders(tokenAddress: string, limit: number = 30, page: number = 1): Promise<TokenHoldersResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}/getTopTokenHolders/${tokenAddress}`, {
        params: {
          apiKey: this.API_KEY,
          limit,
          page,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.holders) {
        throw new NotFoundError(`No holders found for token ${tokenAddress}`);
      }

                     const startRank = (page - 1) * limit + 1;
        const total = response.data.total || 0;
        const totalPages = Math.ceil(total / limit);
        
        return {
          holders: response.data.holders.map((holder: any, index: number) => ({
            address: holder.address,
            balance: parseFloat(holder.balance) || 0,
            share: parseFloat(holder.share) || 0,
            rank: startRank + index,
          })),
          total: total,
          blockchain: 'ethereum',
          pagination: {
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Token with address '${tokenAddress}' not found`);
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Ethplorer API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get token info
  static async getTokenInfo(tokenAddress: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/getTokenInfo/${tokenAddress}`, {
        params: {
          apiKey: this.API_KEY,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Token with address '${tokenAddress}' not found`);
        }
        throw new Error(`Ethplorer API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get address info
  static async getAddressInfo(address: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/getAddressInfo/${address}`, {
        params: {
          apiKey: this.API_KEY,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Address '${address}' not found`);
        }
        throw new Error(`Ethplorer API error: ${error.message}`);
      }
      throw error;
    }
  }
} 