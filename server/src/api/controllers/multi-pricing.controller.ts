import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as multiPricingService from '../services/multi-pricing.service';

export class MultiPricingController {
  // Get token prices by IDs with fallback strategy
  static async getTokenPrices(req: Request, res: Response) {
    // Set no-cache headers for real-time pricing data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"`, // Unique ETag based on timestamp
    });

    const { ids } = req.query;
    
    if (!ids || typeof ids !== 'string') {
      return OK({
        res,
        message: 'Token IDs are required',
        metadata: { prices: {} },
      });
    }

    const tokenIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    
    if (tokenIds.length === 0) {
      return OK({
        res,
        message: 'No valid token IDs provided',
        metadata: { prices: {} },
      });
    }

    try {
      const result = await multiPricingService.MultiPricingService.getTokenPrices(tokenIds);
      
      return OK({
        res,
        message: `Token prices retrieved successfully from ${result.source}`,
        metadata: { 
          prices: result.prices,
          source: result.source,
          success: result.success,
          error: result.error,
          timestamp: new Date().toISOString() // Add timestamp for freshness
        },
      });
    } catch (error: any) {
      return OK({
        res,
        message: 'Failed to fetch token prices',
        metadata: { 
          prices: {},
          source: 'none',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
      });
    }
  }

  // Get single token price
  static async getTokenPrice(req: Request, res: Response) {
    // Set no-cache headers for real-time pricing data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"`,
    });

    const { tokenId } = req.params;
    
    if (!tokenId) {
      return OK({
        res,
        message: 'Token ID is required',
        metadata: { price: null, timestamp: new Date().toISOString() },
      });
    }

    try {
      const price = await multiPricingService.MultiPricingService.getTokenPrice(tokenId);
      
      return OK({
        res,
        message: price ? 'Token price retrieved successfully' : 'Token not found',
        metadata: { price, timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      return OK({
        res,
        message: 'Failed to fetch token price',
        metadata: { price: null, error: error.message, timestamp: new Date().toISOString() },
      });
    }
  }

  // Get trending tokens
  static async getTrendingTokens(req: Request, res: Response) {
    // Set short cache for trending data (5 minutes)
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'ETag': `"trending-${Date.now()}"`,
    });

    try {
      const tokens = await multiPricingService.MultiPricingService.getTrendingTokens();
      
      return OK({
        res,
        message: 'Trending tokens retrieved successfully',
        metadata: { tokens, timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      return OK({
        res,
        message: 'Failed to fetch trending tokens',
        metadata: { tokens: [], error: error.message, timestamp: new Date().toISOString() },
      });
    }
  }

  // Search tokens
  static async searchTokens(req: Request, res: Response) {
    // Set moderate cache for search results (2 minutes)
    res.set({
      'Cache-Control': 'public, max-age=120', // 2 minutes cache
      'ETag': `"search-${Date.now()}"`,
    });

    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return OK({
        res,
        message: 'Search query is required',
        metadata: { tokens: [], timestamp: new Date().toISOString() },
      });
    }

    try {
      const tokens = await multiPricingService.MultiPricingService.searchTokens(query);
      
      return OK({
        res,
        message: 'Token search completed successfully',
        metadata: { tokens, query, timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      return OK({
        res,
        message: 'Failed to search tokens',
        metadata: { tokens: [], query, error: error.message, timestamp: new Date().toISOString() },
      });
    }
  }

  // Get pricing health status
  static async getPricingHealth(req: Request, res: Response) {
    try {
      // Test all sources with a simple request
      const testTokenIds = ['bitcoin', 'ethereum'];
      const result = await multiPricingService.MultiPricingService.getTokenPrices(testTokenIds);
      
      return OK({
        res,
        message: 'Pricing service health check completed',
        metadata: {
          status: result.success ? 'healthy' : 'degraded',
          activeSource: result.source,
          error: result.error,
          timestamp: new Date().toISOString()
        },
      });
    } catch (error: any) {
      return OK({
        res,
        message: 'Pricing service health check failed',
        metadata: {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        },
      });
    }
  }
}
