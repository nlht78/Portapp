export interface IUserToken {
  id: string;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserTokenCreateData {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  notes?: string;
}

export interface IUserTokenUpdateData {
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
  notes?: string;
}

export interface IUserTokenResponse {
  success: boolean;
  message: string;
  metadata: IUserToken;
}

export interface IUserTokenListResponse {
  success: boolean;
  message: string;
  metadata: {
    tokens: IUserToken[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface IUserTokenStatisticsResponse {
  success: boolean;
  message: string;
  metadata: {
    totalTokens: number;
    totalValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    topPerformingTokens: IUserToken[];
    worstPerformingTokens: IUserToken[];
  };
}
