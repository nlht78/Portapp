import { ICaseService } from './caseService.interface';

export interface ICustomer {
  id: string;
  cus_fullName: string;
  cus_email: string;
  cus_phone: string;
  cus_address?: string;
  cus_dateOfBirth?: string;
  cus_gender?: 'male' | 'female' | 'other';
  cus_nationality?: string;
  cus_status: 'potential' | 'active' | 'completed' | 'inactive';
  cus_contactChannel?: string;
  cus_contactAccountName?: string;
  cus_source?: string;
  cus_notes?: string;
  cus_type?: string;
  cus_parentName?: string;
  cus_parentDateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  cus_interactions?: Array<{
    type: 'call' | 'message' | 'meeting' | 'email' | 'other';
    notes?: string;
    staff?: string;
    createdAt: string;
  }>;
}

export interface ICustomerAttrs {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  status?: 'potential' | 'active' | 'completed' | 'inactive';
  contactChannel?: string;
  source?: string;
  notes?: string;
  interactions?: Array<{
    type: 'call' | 'message' | 'meeting' | 'email' | 'other';
    notes?: string;
    staff?: string;
    createdAt?: string;
  }>;
}

export interface ICustomerListResponse {
  data: ICustomer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ICustomerInteraction {
  type: 'call' | 'message' | 'meeting' | 'email' | 'other';
  notes?: string;
  staff?: string;
  createdAt: string;
}

export interface ICustomerSearchQuery {
  keyword?: string;
  status?: 'potential' | 'active' | 'completed' | 'inactive';
  contactChannel?: string;
  source?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  paymentStatus?: 'paid' | 'unpaid'; // This will need to be handled via join with CaseService
}

export interface ICustomerStatisticsQuery {
  groupBy: 'status' | 'contactChannel' | 'source' | 'monthly' | 'daily';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IUpdateCustomerData extends Partial<ICustomerAttrs> {}

export interface ICSVRow {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  status?: string;
  contactChannel?: string;
  source?: string;
  notes?: string;
}

export interface IImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}
