import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as coingeckoService from '../services/coingecko.service';
import { CoinPaprikaService } from '../services/coinpaprika.service';
import { MultiPricingService } from '../services/multi-pricing.service';

export class CoinGeckoController {
  // Get token data by ID - CoinPaprika primary, CoinGecko fallback
  static async getTokenData(req: Request, res: Response) {
    const { tokenId } = req.params;
    
    try {
      // Primary: Try CoinPaprika first
      console.log(`Attempting to fetch ${tokenId} from CoinPaprika...`);
      const tokenData = await CoinPaprikaService.getTokenData(tokenId);
      console.log(`✅ CoinPaprika success for ${tokenId}`);
      return OK({
        res,
        message: 'Token data retrieved successfully (source: coinpaprika)',
        metadata: tokenData,
      });
    } catch (paprikaError) {
      console.warn(`❌ CoinPaprika failed for ${tokenId}, falling back to CoinGecko:`, paprikaError);
      
      try {
        // Fallback: Use CoinGecko if CoinPaprika fails
        const tokenData = await coingeckoService.CoinGeckoService.getTokenData(tokenId);
        return OK({
          res,
          message: 'Token data retrieved successfully (fallback: coingecko)',
          metadata: tokenData,
        });
      } catch (geckoError) {
        console.error(`Both CoinPaprika and CoinGecko failed for ${tokenId}:`, {
          paprikaError: paprikaError instanceof Error ? paprikaError.message : String(paprikaError),
          geckoError: geckoError instanceof Error ? geckoError.message : String(geckoError)
        });
        
        // If both fail, try CoinPaprika search as last resort
        try {
          const searchResult = await CoinPaprikaService.searchToken(tokenId);
          if (searchResult) {
            const tokenData = await CoinPaprikaService.getTokenData(searchResult);
            return OK({
              res,
              message: 'Token data retrieved successfully (search result: coinpaprika)',
              metadata: tokenData,
            });
          }
        } catch (searchError) {
          console.error(`Search also failed for ${tokenId}:`, searchError);
        }
        
        throw geckoError; // Throw the CoinGecko error as final fallback
      }
    }
  }

  // Get market chart data
  static async getMarketChart(req: Request, res: Response) {
    const { tokenId } = req.params;
    const { days = '1', currency = 'usd' } = req.query;
    
    const daysNumber = parseInt(days as string, 10);
    if (isNaN(daysNumber) || daysNumber < 1) {
      return OK({
        res,
        message: 'Invalid days parameter',
        metadata: { chartData: null },
      });
    }

    const chartData = await coingeckoService.CoinGeckoService.getMarketChart(
      tokenId, 
      daysNumber, 
      currency as string
    );
    
    return OK({
      res,
      message: 'Market chart data retrieved successfully',
      metadata: chartData,
    });
  }

  // Search tokens - CoinPaprika primary, CoinGecko fallback
  static async searchTokens(req: Request, res: Response) {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return OK({
        res,
        message: 'Search query is required',
        metadata: { tokens: [] },
      });
    }

    try {
      // Primary: Try CoinPaprika search first (via MultiPricingService)
      console.log(`🔍 Searching tokens for "${query}" using CoinPaprika...`);
      const paprikaTokens = await MultiPricingService.searchTokens(query);
      
      if (paprikaTokens && paprikaTokens.length > 0) {
        console.log(`✅ CoinPaprika search success: found ${paprikaTokens.length} tokens for "${query}"`);
        return OK({
          res,
          message: 'Token search completed successfully (source: coinpaprika)',
          metadata: { 
            tokens: paprikaTokens,
            source: 'coinpaprika',
            query: query
          },
        });
      }
    } catch (paprikaError) {
      console.warn(`❌ CoinPaprika search failed for "${query}":`, paprikaError);
    }

    try {
      // Fallback: Try CoinGecko if CoinPaprika fails or returns empty
      console.log(`🔄 Falling back to CoinGecko search for "${query}"...`);
      const geckoTokens = await coingeckoService.CoinGeckoService.searchTokens(query);
      
      console.log(`✅ CoinGecko search success: found ${geckoTokens?.length || 0} tokens for "${query}"`);
      return OK({
        res,
        message: 'Token search completed successfully (fallback: coingecko)',
        metadata: { 
          tokens: geckoTokens || [],
          source: 'coingecko',
          query: query
        },
      });
    } catch (geckoError) {
      console.error(`❌ Both CoinPaprika and CoinGecko search failed for "${query}":`, {
        paprikaError: 'Failed or empty results',
        geckoError: geckoError instanceof Error ? geckoError.message : String(geckoError)
      });

      return OK({
        res,
        message: 'Token search failed - all sources unavailable',
        metadata: { 
          tokens: [],
          source: 'none',
          query: query,
          error: 'All search sources failed or rate limited'
        },
      });
    }
  }

  // Get trending tokens
  static async getTrendingTokens(req: Request, res: Response) {
    const tokens = await coingeckoService.CoinGeckoService.getTrendingTokens();
    return OK({
      res,
      message: 'Trending tokens retrieved successfully',
      metadata: { tokens },
    });
  }

  // Get token prices by IDs
  static async getTokenPrices(req: Request, res: Response) {
    const { ids } = req.query;
    
    if (!ids || typeof ids !== 'string') {
      return OK({
        res,
        message: 'Token IDs are required',
        metadata: { prices: {} },
      });
    }

    const tokenIds = ids.split(',').map(id => id.trim());
    const prices = await coingeckoService.CoinGeckoService.getTokenPrices(tokenIds);
    
    return OK({
      res,
      message: 'Token prices retrieved successfully',
      metadata: { prices },
    });
  }
} 