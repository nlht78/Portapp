import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import { TokenHoldersService } from '../services/tokenHolders.service';
import { BadRequestError } from '../core/errors';

export class TokenHoldersController {
  // Get top token holders
  static async getTopTokenHolders(req: Request, res: Response) {
    const { tokenAddress } = req.params;
    const { blockchain } = req.query;
    const limit = parseInt(req.query.limit as string) || 30;
    const page = parseInt(req.query.page as string) || 1;

    if (!tokenAddress) {
      throw new BadRequestError('Token address is required');
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError('Limit must be between 1 and 100');
    }

    if (page < 1) {
      throw new BadRequestError('Page must be greater than 0');
    }

    const result = await TokenHoldersService.getTopTokenHolders(
      tokenAddress, 
      blockchain as string, 
      limit,
      page
    );
    
    return OK({
      res,
      message: 'Top token holders retrieved successfully',
      metadata: result,
    });
  }

  // Get token info
  static async getTokenInfo(req: Request, res: Response) {
    const { tokenAddress } = req.params;
    const { blockchain } = req.query;

    if (!tokenAddress) {
      throw new BadRequestError('Token address is required');
    }

    const result = await TokenHoldersService.getTokenInfo(tokenAddress, blockchain as string);
    
    return OK({
      res,
      message: 'Token info retrieved successfully',
      metadata: result,
    });
  }

  // Get address info
  static async getAddressInfo(req: Request, res: Response) {
    const { address } = req.params;
    const { blockchain } = req.query;

    if (!address) {
      throw new BadRequestError('Address is required');
    }

    const result = await TokenHoldersService.getAddressInfo(address, blockchain as string);
    
    return OK({
      res,
      message: 'Address info retrieved successfully',
      metadata: result,
    });
  }

  // Get supported blockchains
  static async getSupportedBlockchains(req: Request, res: Response) {
    const blockchains = TokenHoldersService.getSupportedBlockchains();
    
    return OK({
      res,
      message: 'Supported blockchains retrieved successfully',
      metadata: { blockchains },
    });
  }
} 