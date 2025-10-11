import { EtherscanTransactionsService } from './etherscan-transactions.service';
import { TransactionHistoryResponse, TransactionFilter } from '../interfaces/transaction.interface';
import { NotFoundError } from '../core/errors';

export class TransactionHistoryService {
  // Get token transactions with blockchain detection
  static async getTokenTransactions(
    tokenAddress: string,
    blockchain?: string,
    limit: number = 50,
    page: number = 1,
    filter?: TransactionFilter
  ): Promise<TransactionHistoryResponse> {
    if (!blockchain) {
      blockchain = this.detectBlockchain(tokenAddress);
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EtherscanTransactionsService.getTokenTransactions(tokenAddress, limit, page, filter);
        
        default:
          // Default to Ethereum
          return await EtherscanTransactionsService.getTokenTransactions(tokenAddress, limit, page, filter);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get large transactions (>100k USD)
  static async getLargeTransactions(
    tokenAddress: string,
    blockchain?: string,
    minValueUsd: number = 100000,
    limit: number = 50,
    page: number = 1
  ): Promise<TransactionHistoryResponse> {
    if (!blockchain) {
      blockchain = this.detectBlockchain(tokenAddress);
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EtherscanTransactionsService.getLargeTransactions(tokenAddress, minValueUsd, limit, page);
        
        default:
          // Default to Ethereum
          return await EtherscanTransactionsService.getLargeTransactions(tokenAddress, minValueUsd, limit, page);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get transaction by hash
  static async getTransactionByHash(txHash: string, blockchain?: string) {
    if (!blockchain) {
      blockchain = 'ethereum'; // Default
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EtherscanTransactionsService.getTransactionByHash(txHash);
        
        default:
          return await EtherscanTransactionsService.getTransactionByHash(txHash);
      }
    } catch (error) {
      throw error;
    }
  }

  // Detect blockchain based on address format
  private static detectBlockchain(address: string): string {
    // Simple detection - in production you'd want more sophisticated logic
    return 'ethereum';
  }

  // Get supported blockchains for transactions
  static getSupportedBlockchains() {
    return [
      { id: 'ethereum', name: 'Ethereum', explorer: 'https://etherscan.io' },
    ];
  }
} 