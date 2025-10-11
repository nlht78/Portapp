import axios from 'axios';
import { NotFoundError } from '../core/errors';
import { TokenHolder, TokenHoldersResponse } from './ethplorer.service';

export class BSCScanService {
  private static readonly BASE_URL = 'https://api.bscscan.com/api';
  private static readonly API_KEY = process.env.BSCSCAN_API_KEY || '';

  // Get top token holders for BSC
  static async getTopTokenHolders(tokenAddress: string, limit: number = 30, page: number = 1): Promise<TokenHoldersResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          module: 'token',
          action: 'tokenholderlist',
          contractaddress: tokenAddress,
          page: page,
          offset: limit,
          apikey: this.API_KEY,
        },
        timeout: 15000,
      });

      if (response.data.status !== '1' || !response.data.result) {
        throw new NotFoundError(`No holders found for token ${tokenAddress} on BSC`);
      }

      const startRank = (page - 1) * limit + 1;
      const holders = response.data.result.map((holder: any, index: number) => ({
        address: holder.TokenHolderAddress,
        balance: parseFloat(holder.TokenHolderQuantity) || 0,
        share: parseFloat(holder.TokenHolderShare) || 0,
        rank: startRank + index,
      }));

      const total = parseInt(response.data.result[0]?.TotalTokenHolders || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        holders,
        total: total,
        blockchain: 'bsc',
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
          throw new NotFoundError(`Token with address '${tokenAddress}' not found on BSC`);
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`BSCScan API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get token info
  static async getTokenInfo(tokenAddress: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          module: 'token',
          action: 'tokeninfo',
          contractaddress: tokenAddress,
          apikey: this.API_KEY,
        },
        timeout: 10000,
      });

      if (response.data.status !== '1' || !response.data.result) {
        throw new NotFoundError(`Token with address '${tokenAddress}' not found on BSC`);
      }

      return response.data.result[0];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Token with address '${tokenAddress}' not found on BSC`);
        }
        throw new Error(`BSCScan API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get address info
  static async getAddressInfo(address: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          module: 'account',
          action: 'balance',
          address: address,
          apikey: this.API_KEY,
        },
        timeout: 10000,
      });

      if (response.data.status !== '1') {
        throw new NotFoundError(`Address '${address}' not found on BSC`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Address '${address}' not found on BSC`);
        }
        throw new Error(`BSCScan API error: ${error.message}`);
      }
      throw error;
    }
  }
} 