import { ICustomer } from './customer.interface';
import { IEmployee } from './employee.interface';

// Interface for staff member data
export interface IStaffMember {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email: string;
}

// Interface for process status data
export interface IProcessStatus {
  isScanned: boolean;
  isFullInfo: boolean;
  isAnalysisSent: boolean;
  isPdfExported: boolean;
  isFullyPaid: boolean;
  isSoftFileSent: boolean;
  isPrinted: boolean;
  isPhysicalCopySent: boolean;
  isDeepConsulted?: boolean;
}

export interface ICaseService {
  id: string;
  case_customerId: ICustomer;
  case_date: string;
  case_appointmentDate: string;
  case_eventLocation?: string;
  case_partner?: string;
  case_eventType?: string;
  case_consultantId?: IEmployee;
  case_fingerprintTakerId?: IEmployee;
  case_mainCounselorId?: IEmployee;

  // Thông tin nhân viên (tên) - để hiển thị dữ liệu từ file import
  case_consultantName?: string;
  case_fingerprintTakerName?: string;
  case_counselorName?: string;
  case_scanLocation?: string;

  case_price: number;
  case_amountPaid: number;
  case_debt: number;
  case_isFullyPaid: boolean;
  case_paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  case_progressNote?: string;

  // Process status flags (keeping for backward compatibility)
  case_isScanned?: boolean;
  case_isFullInfo?: boolean;
  case_isAnalysisSent?: boolean;
  case_isPdfExported?: boolean;
  case_isSoftFileSent?: boolean;
  case_isPrintedAndSent?: boolean;
  case_isPhysicalCopySent?: boolean;
  case_isDeepConsulted?: boolean;

  // Progress percentage
  case_progressPercent: number;

  // New optimized staff data structure
  case_staff?: {
    consultant: IStaffMember | null;
    fingerprintTaker: IStaffMember | null;
    counselor: IStaffMember | null;
  };

  // New optimized process status structure
  case_processStatus?: IProcessStatus;

  createdAt: string;
  updatedAt: string;
}

export interface ICaseServiceAttrs {
  customerId: string;
  appointmentDate: string;
  eventLocation?: string;
  partner?: string;
  eventType?: string;
  consultantId?: string;
  fingerprintTakerId?: string;
  mainCounselorId?: string;
  price: number;
  amountPaid?: number;
  isFullyPaid?: boolean;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  progressNote?: string;

  // Process status flags
  isScanned?: boolean;
  isFullInfo?: boolean;
  isAnalysisSent?: boolean;
  isPdfExported?: boolean;
  isSoftFileSent?: boolean;
  isPrintedAndSent?: boolean;
  isPhysicalCopySent?: boolean;
  isDeepConsulted?: boolean;
}

export interface ICaseServiceFilter {
  startDate?: string;
  endDate?: string;
  month?: number;
  week?: number;
  day?: number;
  note?: string;
  contactChannel?: string;
  isFullyPaid?: boolean;
  customerId?: string;
}

export interface ICaseServicePagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICaseListResponse {
  data: ICaseService[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ICaseResponse {
  data: ICaseService;
}

export interface IUpdateCaseData extends Partial<ICaseServiceAttrs> {}

export interface ISearchCasesQuery {
  keyword?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  customerId?: string;
  processStatus?: {
    isScanned?: boolean;
    isFullInfo?: boolean;
    isAnalysisSent?: boolean;
    isPdfExported?: boolean;
    isSoftFileSent?: boolean;
    isPrintedAndSent?: boolean;
    isPhysicalCopySent?: boolean;
    isDeepConsulted?: boolean;
  };
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  staff?: {
    consultantId?: string;
    fingerprintTakerId?: string;
    mainCounselorId?: string;
  };
  appointmentDate?: {
    start: string;
    end: string;
  };
}

export interface ICaseStatisticsQuery {
  groupBy: 'processStep' | 'staff' | 'paymentStatus' | 'daily' | 'monthly';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ICaseProgressData {
  progressNote?: string;
  isScanned?: boolean;
  isFullInfo?: boolean;
  isAnalysisSent?: boolean;
  isPdfExported?: boolean;
  isSoftFileSent?: boolean;
  isPrintedAndSent?: boolean;
  isPhysicalCopySent?: boolean;
  isDeepConsulted?: boolean;
}

export interface ICasePaymentData {
  price?: number;
  amountPaid?: number;
  isFullyPaid?: boolean;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  paymentDate?: string;
}

export interface ICaseStaffData {
  consultantId?: string;
  fingerprintTakerId?: string;
  mainCounselorId?: string;
}

export interface ICaseServiceDailyReport {
  date?: string;
  eventLocation?: string;
  partner?: string;
  revenue: number; // Number of cases sold
  actualIncome: number; // Amount customers have paid
  debt: number; // Revenue - Actual income
}
