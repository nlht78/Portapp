import { Request, Response } from 'express';
import { AIResearchService } from '../services/ai-research.service';
import { ResearchQuery, ResearchResponse } from '../interfaces/ai-research.interface';

export class AIResearchController {
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