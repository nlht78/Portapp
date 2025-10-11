import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import { TransactionHistoryService } from '../services/transactionHistory.service';
import { BadRequestError } from '../core/errors';

export class TransactionHistoryController {
  // Get token transactions
  static async getTokenTransactions(req: Request, res: Response) {
    const { tokenAddress } = req.params;
    const { blockchain, limit, page, minValueUsd, maxValueUsd, fromAddress, toAddress, status } = req.query;

    const limitNum = parseInt(limit as string) || 50;
    const pageNum = parseInt(page as string) || 1;

    if (!tokenAddress) {
      throw new BadRequestError('Token address is required');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestError('Limit must be between 1 and 100');
    }

    if (pageNum < 1) {
      throw new BadRequestError('Page must be greater than 0');
    }

    // Build filter
    const filter: any = {};
    if (minValueUsd) filter.minValueUsd = parseFloat(minValueUsd as string);
    if (maxValueUsd) filter.maxValueUsd = parseFloat(maxValueUsd as string);
    if (fromAddress) filter.fromAddress = fromAddress as string;
    if (toAddress) filter.toAddress = toAddress as string;
    if (status) filter.status = status as string;

    const result = await TransactionHistoryService.getTokenTransactions(
      tokenAddress,
      blockchain as string,
      limitNum,
      pageNum,
      Object.keys(filter).length > 0 ? filter : undefined
    );
    
    return OK({
      res,
      message: 'Token transactions retrieved successfully',
      metadata: result,
    });
  }

  // Get large transactions (>100k USD)
  static async getLargeTransactions(req: Request, res: Response) {
    const { tokenAddress } = req.params;
    const { blockchain, limit, page, minValueUsd } = req.query;

    const limitNum = parseInt(limit as string) || 50;
    const pageNum = parseInt(page as string) || 1;
    const minValueUsdNum = parseFloat(minValueUsd as string) || 100000;

    if (!tokenAddress) {
      throw new BadRequestError('Token address is required');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestError('Limit must be between 1 and 100');
    }

    if (pageNum < 1) {
      throw new BadRequestError('Page must be greater than 0');
    }

    const result = await TransactionHistoryService.getLargeTransactions(
      tokenAddress,
      blockchain as string,
      minValueUsdNum,
      limitNum,
      pageNum
    );
    
    return OK({
      res,
      message: 'Large transactions retrieved successfully',
      metadata: result,
    });
  }

  // Get transaction by hash
  static async getTransactionByHash(req: Request, res: Response) {
    const { txHash } = req.params;
    const { blockchain } = req.query;

    if (!txHash) {
      throw new BadRequestError('Transaction hash is required');
    }

    const result = await TransactionHistoryService.getTransactionByHash(txHash, blockchain as string);
    
    return OK({
      res,
      message: 'Transaction retrieved successfully',
      metadata: result,
    });
  }

  // Get supported blockchains
  static async getSupportedBlockchains(req: Request, res: Response) {
    const blockchains = TransactionHistoryService.getSupportedBlockchains();
    
    return OK({
      res,
      message: 'Supported blockchains retrieved successfully',
      metadata: { blockchains },
    });
  }
} 