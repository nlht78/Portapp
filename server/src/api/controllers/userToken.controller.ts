import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as userTokenService from '../services/userToken.service';
import { BadRequestError } from '../core/errors';

export class UserTokenController {
  // Create new user token
  static async createUserToken(req: Request, res: Response) {
    const userId = req.user.userId;
    const result = await userTokenService.UserTokenService.createUserToken(userId, req.body);
    return OK({
      res,
      message: 'User token created successfully',
      metadata: result,
    });
  }

  // Get all user tokens for current user
  static async getUserTokens(req: Request, res: Response) {
    const userId = req.user.userId;
    const tokens = await userTokenService.UserTokenService.getUserTokens(userId);
    return OK({
      res,
      message: 'User tokens retrieved successfully',
      metadata: tokens,
    });
  }

  // Get user token by ID
  static async getUserTokenById(req: Request, res: Response) {
    const { id } = req.params;
    const token = await userTokenService.UserTokenService.getUserTokenById(id);
    return OK({
      res,
      message: 'User token retrieved successfully',
      metadata: token,
    });
  }

  // Update user token
  static async updateUserToken(req: Request, res: Response) {
    const { id } = req.params;
    const token = await userTokenService.UserTokenService.updateUserToken(id, req.body);
    return OK({
      res,
      message: 'User token updated successfully',
      metadata: token,
    });
  }

  // Delete user token
  static async deleteUserToken(req: Request, res: Response) {
    const { id } = req.params;
    const result = await userTokenService.UserTokenService.deleteUserToken(id);
    return OK({
      res,
      message: 'User token deleted successfully',
      metadata: result,
    });
  }

  // Get user tokens with statistics
  static async getUserTokensWithStats(req: Request, res: Response) {
    const userId = req.user.userId;
    const result = await userTokenService.UserTokenService.getUserTokensWithStats(userId);
    return OK({
      res,
      message: 'User tokens with statistics retrieved successfully',
      metadata: result,
    });
  }

  // Check if token exists for user
  static async checkTokenExists(req: Request, res: Response) {
    const userId = req.user.userId;
    const { tokenId } = req.params;
    const exists = await userTokenService.UserTokenService.checkTokenExists(userId, tokenId);
    return OK({
      res,
      message: 'Token existence checked successfully',
      metadata: { exists },
    });
  }

  // Update current prices for tokens
  static async updateCurrentPrices(req: Request, res: Response) {
    const { tokenUpdates } = req.body;
    
    if (!Array.isArray(tokenUpdates)) {
      throw new BadRequestError('tokenUpdates must be an array');
    }

    await userTokenService.UserTokenService.updateCurrentPrices(tokenUpdates);
    return OK({
      res,
      message: 'Current prices updated successfully',
      metadata: { updated: tokenUpdates.length },
    });
  }

  // Get user token statistics
  static async getUserTokenStatistics(req: Request, res: Response) {
    const userId = req.user.userId;
    const statistics = await userTokenService.UserTokenService.getUserTokenStatistics(userId);
    return OK({
      res,
      message: 'User token statistics retrieved successfully',
      metadata: statistics,
    });
  }
} 