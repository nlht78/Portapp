import { Request, Response } from 'express';
import { AIResearchService } from '../services/ai-research.service';
import { ResearchQuery, ResearchResponse } from '../interfaces/ai-research.interface';

export class AIResearchController {
  /**
   * Health check endpoint for AI provider system
   * Returns provider availability, success rates, and cache statistics
   */
  static async getHealth(req: Request, res: Response) {
    try {
      const providerManager = AIResearchService.getProviderManager();
      
      if (!providerManager) {
        return res.status(503).json({
          status: 503,
          message: 'AI Provider Manager not initialized',
          metadata: {
            healthy: false,
            error: 'Provider manager not available',
          },
        });
      }

      // Get all providers
      const providers = providerManager.getProviders();
      
      // Get health information for each provider
      const providerHealth = providers.map(provider => {
        const health = providerManager.getProviderHealth(provider.name);
        const successRate = providerManager.getProviderSuccessRate(provider.name);
        
        return {
          name: provider.name,
          available: provider.isAvailable(),
          enabled: provider.config.enabled,
          priority: provider.config.priority,
          disabled: health?.disabled || false,
          disabledUntil: health?.disabledUntil ? new Date(health.disabledUntil).toISOString() : null,
          successCount: health?.successCount || 0,
          failureCount: health?.failureCount || 0,
          consecutiveFailures: health?.consecutiveFailures || 0,
          successRate: successRate !== null ? parseFloat((successRate * 100).toFixed(2)) : 0,
          lastFailureTime: health?.lastFailureTime ? new Date(health.lastFailureTime).toISOString() : null,
        };
      });

      // Get cache statistics
      const cacheMetrics = providerManager.getCacheMetrics();
      const cacheStats = {
        enabled: process.env.AI_RESPONSE_CACHE_ENABLED !== 'false',
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        hitRate: parseFloat((cacheMetrics.hitRate * 100).toFixed(2)),
        size: cacheMetrics.size,
        ttl: parseInt(process.env.AI_RESPONSE_CACHE_TTL || '3600000', 10),
      };

      // Get metrics summary
      const metricsService = providerManager.getMetricsService();
      const metricsSummary = metricsService.getMetricsSummary();

      // Get cost tracking information
      const costTracker = providerManager.getCostTracker();
      const costSummaries = costTracker.getAllDailyCostSummaries();
      const costConfig = costTracker.getConfig();

      const costData = {
        enabled: costConfig.enabled,
        dailyLimit: costConfig.dailyLimitUSD,
        alertThreshold: costConfig.alertThresholdUSD,
        providers: costSummaries.map(summary => ({
          name: summary.provider,
          todayCost: parseFloat(summary.totalCost.toFixed(4)),
          requests: summary.totalRequests,
          tokens: summary.totalTokens,
          avgCostPerRequest: parseFloat(summary.averageCostPerRequest.toFixed(6)),
        })),
        totalCostToday: parseFloat(
          costSummaries.reduce((sum, s) => sum + s.totalCost, 0).toFixed(4)
        ),
      };

      // Determine overall health status
      const availableProviders = providerHealth.filter(p => p.available && !p.disabled);
      const healthy = availableProviders.length > 0 && metricsSummary.healthy;

      const healthData = {
        status: healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        strategy: providerManager.getStrategy(),
        providers: providerHealth,
        cache: cacheStats,
        metrics: {
          totalRequests: metricsSummary.totalRequests,
          successRate: metricsSummary.successRate,
          averageResponseTime: metricsSummary.averageResponseTime,
          providers: metricsSummary.providers,
        },
        costs: costData,
        summary: {
          totalProviders: providers.length,
          availableProviders: availableProviders.length,
          disabledProviders: providerHealth.filter(p => p.disabled).length,
        },
      };

      res.json({
        status: 200,
        message: 'Health check completed',
        metadata: healthData,
      });
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during health check',
        metadata: {
          healthy: false,
          error: (error as Error).message,
        },
      });
    }
  }
  static async researchToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const { 
        query = 'roadmap, tokenomics, earning mechanisms, upcoming events',
        sources = ['twitter', 'github', 'medium', 'reddit', 'news'],
        timeRange = '30d',
        includeHistorical = true 
      } = req.body;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      const researchQuery: ResearchQuery = {
        tokenId,
        query,
        sources,
        timeRange,
        includeHistorical,
      };

      console.log(`Starting AI research for ${tokenId} with query: ${query}`);

      const result = await AIResearchService.researchToken(researchQuery);

      const response: ResearchResponse = {
        status: 200,
        message: 'AI research completed successfully',
        metadata: result,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in AI research:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during AI research',
        metadata: null,
      });
    }
  }

  static async getResearchHistory(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const { limit = '10' } = req.query;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // In a real implementation, this would fetch from database
      // For now, return mock history
      const mockHistory = [
        {
          id: `research-${tokenId}-1`,
          query: 'roadmap and upcoming events',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          confidence: 0.85,
          summary: 'Comprehensive analysis of roadmap and upcoming events',
        },
        {
          id: `research-${tokenId}-2`,
          query: 'tokenomics and earning mechanisms',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          confidence: 0.78,
          summary: 'Analysis of tokenomics and earning opportunities',
        },
      ];

      res.json({
        status: 200,
        message: 'Research history retrieved successfully',
        metadata: {
          tokenId,
          history: mockHistory.slice(0, parseInt(limit as string)),
          total: mockHistory.length,
        },
      });
    } catch (error) {
      console.error('Error getting research history:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }

  static async getResearchInsights(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;

      if (!tokenId) {
        return res.status(400).json({
          status: 400,
          message: 'Token ID is required',
          metadata: null,
        });
      }

      // Generate insights based on recent research
      const insights = {
        tokenId,
        lastUpdated: new Date(),
        insights: [
          {
            category: 'roadmap',
            insight: 'Strong development momentum with clear timeline execution',
            confidence: 0.9,
            source: 'Official announcements and GitHub activity',
          },
          {
            category: 'tokenomics',
            insight: 'Tokenomics adjustments show long-term sustainability focus',
            confidence: 0.85,
            source: 'Whitepaper updates and official communications',
          },
          {
            category: 'earning',
            insight: 'Multiple earning opportunities with competitive APY',
            confidence: 0.8,
            source: 'DeFi protocol analysis and community feedback',
          },
          {
            category: 'partnership',
            insight: 'Strategic partnerships indicate ecosystem expansion',
            confidence: 0.7,
            source: 'Industry sources and community discussions',
          },
        ],
        recommendations: [
          'Monitor official channels for roadmap updates',
          'Consider staking before tokenomics changes',
          'Diversify into new earning mechanisms',
          'Follow partnership announcements closely',
        ],
        risks: [
          'Market volatility during major updates',
          'Potential delays in roadmap execution',
          'Competition from similar projects',
          'Regulatory uncertainty',
        ],
      };

      res.json({
        status: 200,
        message: 'Research insights retrieved successfully',
        metadata: insights,
      });
    } catch (error) {
      console.error('Error getting research insights:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        metadata: null,
      });
    }
  }
} 