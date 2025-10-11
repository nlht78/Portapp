export interface Transaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  gasPrice: number;
  gasUsed: number;
  blockNumber: number;
  confirmations: number;
  status: 'success' | 'failed';
  method?: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  blockchain: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransactionFilter {
  minValueUsd?: number;
  maxValueUsd?: number;
  fromAddress?: string;
  toAddress?: string;
  startDate?: number;
  endDate?: number;
  status?: 'success' | 'failed';
} 