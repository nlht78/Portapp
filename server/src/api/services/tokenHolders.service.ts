import { EthplorerService, TokenHoldersResponse } from './ethplorer.service';
import { BSCScanService } from './bscscan.service';
import { NotFoundError } from '../core/errors';

export class TokenHoldersService {
  // Get top token holders with blockchain detection
  static async getTopTokenHolders(tokenAddress: string, blockchain?: string, limit: number = 30, page: number = 1): Promise<TokenHoldersResponse> {
    // Auto-detect blockchain if not provided
    if (!blockchain) {
      blockchain = this.detectBlockchain(tokenAddress);
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EthplorerService.getTopTokenHolders(tokenAddress, limit, page);
        
        case 'bsc':
        case 'binance':
        case 'binance-smart-chain':
          return await BSCScanService.getTopTokenHolders(tokenAddress, limit, page);
        
        default:
          // Try Ethereum first, then BSC as fallback
          try {
            return await EthplorerService.getTopTokenHolders(tokenAddress, limit, page);
          } catch (error) {
            try {
              return await BSCScanService.getTopTokenHolders(tokenAddress, limit, page);
            } catch (bscError) {
              throw new NotFoundError(`Token holders not found on any supported blockchain for address: ${tokenAddress}`);
            }
          }
      }
    } catch (error) {
      throw error;
    }
  }

  // Get token info with blockchain detection
  static async getTokenInfo(tokenAddress: string, blockchain?: string) {
    if (!blockchain) {
      blockchain = this.detectBlockchain(tokenAddress);
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EthplorerService.getTokenInfo(tokenAddress);
        
        case 'bsc':
        case 'binance':
        case 'binance-smart-chain':
          return await BSCScanService.getTokenInfo(tokenAddress);
        
        default:
          // Try Ethereum first, then BSC as fallback
          try {
            return await EthplorerService.getTokenInfo(tokenAddress);
          } catch (error) {
            try {
              return await BSCScanService.getTokenInfo(tokenAddress);
            } catch (bscError) {
              throw new NotFoundError(`Token info not found on any supported blockchain for address: ${tokenAddress}`);
            }
          }
      }
    } catch (error) {
      throw error;
    }
  }

  // Get address info with blockchain detection
  static async getAddressInfo(address: string, blockchain?: string) {
    if (!blockchain) {
      blockchain = this.detectBlockchain(address);
    }

    try {
      switch (blockchain.toLowerCase()) {
        case 'ethereum':
        case 'eth':
          return await EthplorerService.getAddressInfo(address);
        
        case 'bsc':
        case 'binance':
        case 'binance-smart-chain':
          return await BSCScanService.getAddressInfo(address);
        
        default:
          // Try Ethereum first, then BSC as fallback
          try {
            return await EthplorerService.getAddressInfo(address);
          } catch (error) {
            try {
              return await BSCScanService.getAddressInfo(address);
            } catch (bscError) {
              throw new NotFoundError(`Address info not found on any supported blockchain for address: ${address}`);
            }
          }
      }
    } catch (error) {
      throw error;
    }
  }

  // Detect blockchain based on address format or other indicators
  private static detectBlockchain(address: string): string {
    // This is a simple detection - in production you might want more sophisticated logic
    // For now, we'll default to Ethereum and let the APIs handle validation
    
    // You could add more sophisticated detection here:
    // - Check address length
    // - Check prefix patterns
    // - Use external APIs to validate
    
    return 'ethereum'; // Default to Ethereum
  }

  // Get supported blockchains
  static getSupportedBlockchains() {
    return [
      { id: 'ethereum', name: 'Ethereum', explorer: 'https://etherscan.io' },
      { id: 'bsc', name: 'Binance Smart Chain', explorer: 'https://bscscan.com' },
    ];
  }
} 