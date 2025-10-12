export interface ITransaction {
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

export interface ITransactionHistory {
  transactions: ITransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ITransactionFilters {
  page?: number;
  limit?: number;
  type?: 'buy' | 'sell' | 'transfer';
  minValue?: number;
  maxValue?: number;
  fromDate?: string;
  toDate?: string;
}
