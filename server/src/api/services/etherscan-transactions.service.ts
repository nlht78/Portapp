import axios from 'axios';
import { NotFoundError } from '../core/errors';
import { Transaction, TransactionHistoryResponse, TransactionFilter } from '../interfaces/transaction.interface';

export class EtherscanTransactionsService {
  private static readonly BASE_URL = 'https://api.etherscan.io/api';
  private static readonly API_KEY = process.env.ETHERSCAN_API_KEY || '';

  // Get token transactions with filtering
  static async getTokenTransactions(
    tokenAddress: string,
    limit: number = 50,
    page: number = 1,
    filter?: TransactionFilter
  ): Promise<TransactionHistoryResponse> {
    try {
      // For testing without API key, return mock data
      if (!this.API_KEY) {
        return this.generateMockTransactions(tokenAddress, limit, page, filter);
      }

      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: tokenAddress,
          page: page,
          offset: limit,
          sort: 'desc',
          apikey: this.API_KEY,
        },
        timeout: 15000,
      });

      if (response.data.status !== '1' || !response.data.result) {
        throw new NotFoundError(`No transactions found for token ${tokenAddress}`);
      }

      let transactions = response.data.result.map((tx: any) => ({
        hash: tx.hash,
        timestamp: parseInt(tx.timeStamp) * 1000, // Convert to milliseconds
        from: tx.from,
        to: tx.to,
        value: parseFloat(tx.value) || 0,
        valueUsd: 0, // Will be calculated later
        gasPrice: parseInt(tx.gasPrice) || 0,
        gasUsed: parseInt(tx.gasUsed) || 0,
        blockNumber: parseInt(tx.blockNumber) || 0,
        confirmations: parseInt(tx.confirmations) || 0,
        status: tx.isError === '0' ? 'success' : 'failed',
        method: tx.functionName || 'transfer',
      }));

      // Apply filters
      if (filter) {
        transactions = this.applyFilters(transactions, filter);
      }

      // Calculate USD values (simplified - in production you'd use price API)
      transactions = await this.calculateUsdValues(transactions, tokenAddress);

      const total = response.data.result.length;
      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        total,
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
        throw new Error(`Etherscan API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get large transactions (>100k USD)
  static async getLargeTransactions(
    tokenAddress: string,
    minValueUsd: number = 100000,
    limit: number = 50,
    page: number = 1
  ): Promise<TransactionHistoryResponse> {
    const filter: TransactionFilter = {
      minValueUsd,
      status: 'success',
    };

    return this.getTokenTransactions(tokenAddress, limit, page, filter);
  }

  // Get transaction by hash
  static async getTransactionByHash(txHash: string): Promise<Transaction> {
    try {
      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionByHash',
          txhash: txHash,
          apikey: this.API_KEY,
        },
        timeout: 10000,
      });

      if (!response.data.result) {
        throw new NotFoundError(`Transaction '${txHash}' not found`);
      }

      const tx = response.data.result;
      return {
        hash: tx.hash,
        timestamp: 0, // Would need to get from block
        from: tx.from,
        to: tx.to,
        value: parseInt(tx.value, 16) / Math.pow(10, 18), // Convert from wei to ETH
        valueUsd: 0,
        gasPrice: parseInt(tx.gasPrice, 16),
        gasUsed: 0,
        blockNumber: parseInt(tx.blockNumber, 16),
        confirmations: 0,
        status: 'success',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Transaction '${txHash}' not found`);
        }
        throw new Error(`Etherscan API error: ${error.message}`);
      }
      throw error;
    }
  }

  // Apply filters to transactions
  private static applyFilters(transactions: Transaction[], filter: TransactionFilter): Transaction[] {
    return transactions.filter(tx => {
      // Filter by USD value
      if (filter.minValueUsd && tx.valueUsd < filter.minValueUsd) return false;
      if (filter.maxValueUsd && tx.valueUsd > filter.maxValueUsd) return false;

      // Filter by addresses
      if (filter.fromAddress && tx.from.toLowerCase() !== filter.fromAddress.toLowerCase()) return false;
      if (filter.toAddress && tx.to.toLowerCase() !== filter.toAddress.toLowerCase()) return false;

      // Filter by date range
      if (filter.startDate && tx.timestamp < filter.startDate) return false;
      if (filter.endDate && tx.timestamp > filter.endDate) return false;

      // Filter by status
      if (filter.status && tx.status !== filter.status) return false;

      return true;
    });
  }

  // Calculate USD values (simplified implementation)
  private static async calculateUsdValues(transactions: Transaction[], tokenAddress: string): Promise<Transaction[]> {
    // In a real implementation, you would:
    // 1. Get current token price from CoinGecko or similar
    // 2. Calculate USD value for each transaction
    // For now, we'll use a placeholder calculation
    
    const tokenPrice = await this.getTokenPrice(tokenAddress);
    
    return transactions.map(tx => ({
      ...tx,
      valueUsd: tx.value * tokenPrice,
    }));
  }

  // Get token price (simplified)
  private static async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you'd use CoinGecko API or similar
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum`, {
        params: {
          contract_addresses: tokenAddress,
          vs_currencies: 'usd',
        },
        timeout: 5000,
      });

      return response.data[tokenAddress.toLowerCase()]?.usd || 1;
    } catch (error) {
      console.warn(`Failed to get price for token ${tokenAddress}, using default value`);
      return 1; // Default price
    }
  }

  // Generate mock transactions for testing
  private static generateMockTransactions(
    tokenAddress: string,
    limit: number = 50,
    page: number = 1,
    filter?: TransactionFilter
  ): TransactionHistoryResponse {
    const mockTransactions: Transaction[] = [];
    const startIndex = (page - 1) * limit;
    
    for (let i = 0; i < limit; i++) {
      const index = startIndex + i;
      const value = Math.random() * 1000000 + 100000; // Random value between 100k and 1.1M
      const valueUsd = value * (Math.random() * 2 + 0.5); // Random USD value
      
      mockTransactions.push({
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random time in last 30 days
        from: `0x${Math.random().toString(16).substring(2, 42)}`,
        to: `0x${Math.random().toString(16).substring(2, 42)}`,
        value: value,
        valueUsd: valueUsd,
        gasPrice: Math.floor(Math.random() * 100) + 20,
        gasUsed: Math.floor(Math.random() * 100000) + 50000,
        blockNumber: 18000000 + Math.floor(Math.random() * 1000000),
        confirmations: Math.floor(Math.random() * 100) + 1,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        method: Math.random() > 0.5 ? 'transfer' : 'transferFrom',
      });
    }

    // Apply filters if provided
    let filteredTransactions = mockTransactions;
    if (filter) {
      filteredTransactions = this.applyFilters(mockTransactions, filter);
    }

    const total = 1000; // Mock total
    const totalPages = Math.ceil(total / limit);

    return {
      transactions: filteredTransactions,
      total,
      blockchain: 'ethereum',
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
} 