import { fetcher } from './index';

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  type: 'buy' | 'sell' | 'transfer';
}

export interface TransactionHistoryResponse {
  transactions: TransactionHistory[];
  total: number;
  page: number;
  limit: number;
}

// Get large transactions for a token
export const getLargeTransactions = async (
  tokenAddress: string,
  page: number = 1,
  limit: number = 50
) => {
  return await fetcher(
    `/transaction-history/${tokenAddress}/large-transactions?page=${page}&limit=${limit}`
  );
};

// Get transaction history for a token
export const getTransactionHistory = async (
  tokenAddress: string,
  page: number = 1,
  limit: number = 50
) => {
  return await fetcher(
    `/transaction-history/${tokenAddress}?page=${page}&limit=${limit}`
  );
};
