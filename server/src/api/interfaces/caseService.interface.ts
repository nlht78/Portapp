import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawCaseService {
  id: string;
  case_customerId: Types.ObjectId;
  case_eventLocation?: string;
  case_partner?: string;
  case_appointmentDate: Date;
  case_price?: number;
  case_amountPaid?: number;
  case_debt?: number;
  case_paymentMethod?: string;

  // Staff references (IDs)
  case_consultantId?: Types.ObjectId;
  case_fingerprintTakerId?: Types.ObjectId;
  case_mainCounselorId?: Types.ObjectId;
  
  // Staff names (for import/export)
  case_consultantName?: string;
  case_fingerprintTakerName?: string;
  case_counselorName?: string;
  
  // Location information
  case_scanLocation?: string;

  // Process status
  case_isScanned?: boolean;
  case_isFullInfo?: boolean;
  case_isAnalysisSent?: boolean;
  case_isPdfExported?: boolean;
  case_isFullyPaid?: boolean;
  case_isSoftFileSent?: boolean;
  case_isPrintedAndSent?: boolean;
  case_isPhysicalCopySent?: boolean;
  case_isDeepConsulted?: boolean;

  // Progress info
  case_progressNote?: string;
  case_progressPercent?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ICaseServiceAttrs {
  // Liên kết với khách hàng
  customerId: string | Types.ObjectId;
  
  // Thông tin dịch vụ
  appointmentDate: Date | string;
  eventLocation?: string;
  partner?: string;
  
  // Thông tin thanh toán
  price?: number;
  amountPaid?: number;
  paymentMethod?: string;
  
  // Thông tin nhân viên - IDs
  consultantId?: string | Types.ObjectId;
  fingerprintTakerId?: string | Types.ObjectId;
  mainCounselorId?: string | Types.ObjectId;
  
  // Thông tin nhân viên - Tên (để import/export)
  consultantName?: string;
  fingerprintTakerName?: string;
  counselorName?: string;
  
  // Thông tin địa điểm
  scanLocation?: string;
  
  // Trạng thái quy trình
  isScanned?: boolean;
  isFullInfo?: boolean;
  isAnalysisSent?: boolean;
  isPdfExported?: boolean;
  isFullyPaid?: boolean;
  isSoftFileSent?: boolean;
  isPrintedAndSent?: boolean;
  isPhysicalCopySent?: boolean;
  isDeepConsulted?: boolean;
  
  // Thông tin tiến độ
  progressNote?: string;
  progressPercent?: number;
}

export type ICaseService = HydratedDocument<IRawCaseService>;

export interface ICaseServiceModel extends Model<ICaseService> {
  build(attrs: ICaseServiceAttrs): Promise<ICaseService>;
}

export interface ICaseServiceFilter {
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  month?: number | undefined;
  week?: number | undefined;
  day?: number | undefined;
  note?: string | undefined;
  contactChannel?: string | undefined;
  isFullyPaid?: boolean | undefined;
  customerId?: string | Types.ObjectId | undefined;
  appointmentStartDate?: Date | undefined;
  appointmentEndDate?: Date | undefined;
  paymentStatus?: 'paid' | 'unpaid' | undefined;
  search?: string | undefined;
}

export interface ICaseServicePagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ISearchCasesQuery {
  keyword?: string;
  dateRange?: { start: Date; end: Date };
  customerId?: string;
  processStatus?: {
    isScanned?: boolean;
    isFullInfo?: boolean;
    isAnalysisSent?: boolean;
    isPdfExported?: boolean;
    isFullyPaid?: boolean;
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
  appointmentDate?: { start: Date; end: Date };
}

export interface ICaseStatisticsQuery {
  dateRange?: { start: Date; end: Date };
  groupBy: 'processStep' | 'staff' | 'paymentStatus' | 'daily' | 'monthly';
} 