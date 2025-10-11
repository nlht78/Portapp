import { UserTokenModel } from '../models/userToken.model';
import { IUserToken, IUserTokenAttrs, IUserTokenResponseData, IUserTokenStatistics } from '../interfaces/userToken.interface';
import { UserModel } from '../models/user.model';
import { NotFoundError } from '../core/errors';

export class UserTokenService {
  // Create new user token
  static async createUserToken(userId: string, tokenData: any): Promise<IUserToken> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userTokenAttrs: IUserTokenAttrs = {
      userId: user._id,
      tokenId: tokenData.tokenId,
      tokenName: tokenData.tokenName,
      tokenSymbol: tokenData.tokenSymbol,
      quantity: tokenData.quantity,
      purchasePrice: tokenData.purchasePrice,
      currentPrice: tokenData.currentPrice,
      notes: tokenData.notes || '',
    };

    return await UserTokenModel.build(userTokenAttrs);
  }

  // Get all user tokens by user ID
  static async getUserTokens(userId: string): Promise<IUserTokenResponseData[]> {
    const userTokens = await UserTokenModel.find({ userId, isActive: true })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return userTokens.map(token => this.formatUserTokenResponse(token));
  }

  // Get user token by ID
  static async getUserTokenById(id: string): Promise<IUserTokenResponseData> {
    const userToken = await UserTokenModel.findById(id)
      .populate('userId', 'firstName lastName email');

    if (!userToken) {
      throw new NotFoundError('User token not found');
    }

    return this.formatUserTokenResponse(userToken);
  }

  // Update user token
  static async updateUserToken(id: string, updateData: any): Promise<IUserTokenResponseData> {
    const userToken = await UserTokenModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!userToken) {
      throw new NotFoundError('User token not found');
    }

    return this.formatUserTokenResponse(userToken);
  }

  // Delete user token (soft delete)
  static async deleteUserToken(id: string): Promise<boolean> {
    const userToken = await UserTokenModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!userToken) {
      throw new NotFoundError('User token not found');
    }

    return true;
  }

  // Get user token statistics
  static async getUserTokenStatistics(userId: string): Promise<IUserTokenStatistics> {
    const userTokens = await UserTokenModel.find({ userId, isActive: true });

    const totalTokens = userTokens.length;
    const activeTokens = userTokens.filter(token => token.isActive).length;

    let totalValue = 0;
    let totalPurchaseValue = 0;

    userTokens.forEach(token => {
      const currentValue = token.quantity * token.currentPrice;
      const purchaseValue = token.quantity * token.purchasePrice;
      totalValue += currentValue;
      totalPurchaseValue += purchaseValue;
    });

    const totalProfitLoss = totalValue - totalPurchaseValue;
    const totalProfitLossPercentage = totalPurchaseValue > 0 
      ? (totalProfitLoss / totalPurchaseValue) * 100 
      : 0;

    return {
      totalTokens,
      totalValue,
      totalProfitLoss,
      totalProfitLossPercentage,
      activeTokens,
    };
  }

  // Get user tokens with statistics
  static async getUserTokensWithStats(userId: string): Promise<{
    tokens: IUserTokenResponseData[];
  }> {
    const tokens = await this.getUserTokens(userId);

    return { tokens };
  }

  // Check if token already exists for user
  static async checkTokenExists(userId: string, tokenId: string): Promise<boolean> {
    const existingToken = await UserTokenModel.findOne({ userId, tokenId, isActive: true });
    return !!existingToken;
  }

  // Update current price for all tokens
  static async updateCurrentPrices(tokenUpdates: Array<{ tokenId: string; currentPrice: number }>): Promise<void> {
    for (const update of tokenUpdates) {
      await UserTokenModel.updateMany(
        { tokenId: update.tokenId, isActive: true },
        { currentPrice: update.currentPrice }
      );
    }
  }

  // Private method to format user token response
  private static formatUserTokenResponse(userToken: IUserToken): IUserTokenResponseData {
    const totalValue = userToken.quantity * userToken.currentPrice;
    const purchaseValue = userToken.quantity * userToken.purchasePrice;
    const profitLoss = totalValue - purchaseValue;
    const profitLossPercentage = purchaseValue > 0 
      ? (profitLoss / purchaseValue) * 100 
      : 0;

    return {
      id: userToken._id.toString(),
      tokenId: userToken.tokenId,
      tokenName: userToken.tokenName,
      tokenSymbol: userToken.tokenSymbol,
      quantity: userToken.quantity,
      purchasePrice: userToken.purchasePrice,
      currentPrice: userToken.currentPrice,
      totalValue,
      profitLoss,
      profitLossPercentage,
      notes: userToken.notes,
      isActive: userToken.isActive,
      createdAt: userToken.createdAt,
      updatedAt: userToken.updatedAt,
      userId: userToken.userId.toString(),
    };
  }
} 