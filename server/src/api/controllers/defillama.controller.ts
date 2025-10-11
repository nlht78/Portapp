import { Request, Response } from 'express';
import { DeFiLlamaService } from '../services/defillama.service';
import { OK } from '../core/success.response';
import { BadRequestError } from '../core/errors';

export class DeFiLlamaController {
  /**
   * Get protocol data by ID
   */
  static async getProtocol(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const protocol = await DeFiLlamaService.getProtocol(protocolId);

      if (!protocol) {
        return res.status(404).json({
          status: 404,
          message: 'Protocol not found',
          isOperation: false,
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Protocol data retrieved successfully',
        isOperation: true,
        metadata: {
          protocol,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getProtocol error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Search protocols
   */
  static async searchProtocols(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Query parameter "q" is required');
      }

      const protocols = await DeFiLlamaService.searchProtocols(q);

      return res.status(200).json({
        status: 200,
        message: 'Protocols retrieved successfully',
        isOperation: true,
        metadata: {
          protocols,
          count: protocols.length,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama searchProtocols error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get treasury data for a protocol
   */
  static async getTreasury(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const treasury = await DeFiLlamaService.getTreasury(protocolId);

      return res.status(200).json({
        status: 200,
        message: 'Treasury data retrieved successfully',
        isOperation: true,
        metadata: {
          treasury,
          count: treasury.length,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getTreasury error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get token data by address
   */
  static async getTokenData(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const { chain = 'ethereum' } = req.query;

      if (!address) {
        throw new BadRequestError('Token address is required');
      }

      const token = await DeFiLlamaService.getTokenData(address, chain as string);

      if (!token) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          isOperation: false,
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Token data retrieved successfully',
        isOperation: true,
        metadata: {
          token,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getTokenData error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get protocol TVL history
   */
  static async getProtocolTvlHistory(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;
      const { days = '30' } = req.query;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const daysNumber = parseInt(days as string, 10);
      if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
        throw new BadRequestError('Days must be a number between 1 and 365');
      }

      const tvlHistory = await DeFiLlamaService.getProtocolTvlHistory(protocolId, daysNumber);

      return res.status(200).json({
        status: 200,
        message: 'TVL history retrieved successfully',
        isOperation: true,
        metadata: {
          tvlHistory,
          count: tvlHistory.length,
          days: daysNumber,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getProtocolTvlHistory error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get funding rounds for a protocol
   */
  static async getFundingRounds(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const fundingRounds = await DeFiLlamaService.getFundingRounds(protocolId);

      return res.status(200).json({
        status: 200,
        message: 'Funding rounds retrieved successfully',
        isOperation: true,
        metadata: {
          fundingRounds,
          count: fundingRounds.length,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getFundingRounds error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get investors for a protocol
   */
  static async getInvestors(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const investors = await DeFiLlamaService.getInvestors(protocolId);

      return res.status(200).json({
        status: 200,
        message: 'Investors retrieved successfully',
        isOperation: true,
        metadata: {
          investors,
          count: investors.length,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getInvestors error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get comprehensive protocol data
   */
  static async getComprehensiveData(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new BadRequestError('Protocol ID is required');
      }

      const data = await DeFiLlamaService.getComprehensiveProtocolData(protocolId);

      return res.status(200).json({
        status: 200,
        message: 'Comprehensive protocol data retrieved successfully',
        isOperation: true,
        metadata: {
          ...data,
          summary: {
            hasProtocol: !!data.protocol,
            treasuryCount: data.treasury.length,
            fundingRoundsCount: data.fundingRounds.length,
            investorsCount: data.investors.length,
            tvlHistoryCount: data.tvlHistory.length,
          },
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getComprehensiveData error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }

  /**
   * Get protocol by token address
   */
  static async getProtocolByTokenAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const { chain = 'ethereum' } = req.query;

      if (!address) {
        throw new BadRequestError('Token address is required');
      }

      // First get token data
      const token = await DeFiLlamaService.getTokenData(address, chain as string);
      
      if (!token) {
        return res.status(404).json({
          status: 404,
          message: 'Token not found',
          isOperation: false,
        });
      }

      // Search for protocols that might use this token
      const protocols = await DeFiLlamaService.searchProtocols(token.symbol || token.name);

      return res.status(200).json({
        status: 200,
        message: 'Protocol data retrieved successfully',
        isOperation: true,
        metadata: {
          token,
          protocols,
          count: protocols.length,
        },
      });
    } catch (error: any) {
      console.error('DeFiLlama getProtocolByTokenAddress error:', error);
      return res.status(error.status || 500).json({
        status: error.status || 500,
        message: error.message || 'Internal server error',
        isOperation: false,
      });
    }
  }
}
