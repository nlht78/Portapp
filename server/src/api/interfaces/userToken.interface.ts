import { HydratedDocument, Model, Types } from 'mongoose';

// Base interface cho response
export interface IBaseResponse<T> {
  message: string;
  metadata: T;
  options?: Record<string, any>;
  _link?: Record<string, any>;
}

export interface IRawUserToken {
  id: string;
  userId: Types.ObjectId;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserTokenAttrs {
  userId: Types.ObjectId;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  notes?: string;
  isActive?: boolean;
}

export interface ICreateUserTokenData {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  notes?: string;
}

export interface IUpdateUserTokenData {
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
  notes?: string;
  isActive?: boolean;
}

export type IUserToken = HydratedDocument<IRawUserToken>;

export interface IUserTokenModel extends Model<IUserToken> {
  build(attrs: IUserTokenAttrs): Promise<IUserToken>;
}

export interface IUserTokenResponseData {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Interface cho statistics
export interface IUserTokenStatistics {
  totalTokens: number;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  activeTokens: number;
}

// Interface cho User Token với statistics
export interface IUserTokenWithStats extends IUserTokenResponseData {
  statistics: IUserTokenStatistics;
}

// Định nghĩa các response types cụ thể
export type IUserTokenResponse = IBaseResponse<IUserTokenResponseData>;
export type IUserTokenListResponse = IBaseResponse<IUserTokenResponseData[]>;
export type IUserTokenWithStatsResponse = IBaseResponse<IUserTokenWithStats>;
export type IUserTokenWithStatsListResponse = IBaseResponse<IUserTokenWithStats[]>; 