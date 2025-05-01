import { HydratedDocument, Model, Types } from 'mongoose';
import { ICaseServiceAttrs } from './caseService.interface';

export interface ICustomerInteraction {
  date: Date;
  type: 'call' | 'message' | 'meeting' | 'email' | 'other';
  notes?: string;
  staff?: Types.ObjectId;
}

export interface ICustomerProcessStatus {
  isScanned: boolean;
  isFullInfo: boolean;
  isAnalysisSent: boolean;
  isPdfExported: boolean;
  isSoftFileSent: boolean;
  isPrinted: boolean;
  isPhysicalCopySent: boolean;
}

export interface ICustomerAssignedStaff {
  consultant?: Types.ObjectId;
  technician?: Types.ObjectId;
  counselor?: Types.ObjectId;
}

export interface IRawCustomer {
  id: string;
  cus_fullName: string;
  cus_dateOfBirth?: Date;
  cus_gender?: string;
  cus_parentName?: string;
  cus_parentDateOfBirth?: Date;
  cus_phone?: string;
  cus_email?: string;
  cus_address?: string;
  cus_contactChannel?: string;
  cus_contactAccountName?: string;
  cus_status?: 'potential' | 'active' | 'completed' | 'inactive';
  cus_type?: 'regular' | 'vip' | 'premium';
  cus_source?: 'referral' | 'social_media' | 'website' | 'direct' | 'other';
  
  // Service information
  cus_serviceLocation?: string;
  
  // Interactions and notes
  cus_interactions?: ICustomerInteraction[];
  cus_note?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerAttrs {
  // Thông tin cơ bản
  fullName: string;
  dateOfBirth?: Date;
  gender?: string;
  parentName?: string;
  parentDateOfBirth?: Date;
  phone?: string;
  email?: string;
  address?: string;
  
  // Thông tin liên lạc
  contactChannel?: string;
  contactAccountName?: string;
  
  // Thông tin trạng thái
  status?: 'potential' | 'active' | 'completed' | 'inactive';
  type?: 'regular' | 'vip' | 'premium';
  source?: 'referral' | 'social_media' | 'website' | 'direct' | 'other';
  
  // Thông tin dịch vụ
  serviceLocation?: string;
  
  // Thông tin tương tác
  interactions?: ICustomerInteraction[];
  note?: string;
}

export type ICustomer = HydratedDocument<IRawCustomer>;

export interface ICustomerModel extends Model<ICustomer> {
  build(attrs: ICustomerAttrs): Promise<ICustomer>;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface ICustomerFilter {
  status?: string;
  contactChannel?: string;
  birthMonth?: number;
  birthDay?: number;
  note?: string;
  search?: string;
}

export interface ICustomerSearchQuery {
  keyword?: string;
  dateRange?: { start: Date; end: Date };
  status?: ('potential' | 'active' | 'completed' | 'inactive')[];
  type?: ('regular' | 'vip' | 'premium')[];
  staff?: string[];
  source?: ('referral' | 'social_media' | 'website' | 'direct' | 'other')[];
}

export interface ICSVRow {
  date: string;
  partner: string;
  eventLocation: string;
  customerName: string;
  customerDOB: string;
  gender: string;
  parentName: string;
  parentDOB: string;
  phone: string;
  address: string;
  email: string;
  price: string;
  paidAmount: string;
  debt: string;
  paymentMethod: string;
  consultant: string;
  fingerprintTaker: string;
  scanLocation: string;
  isFullInfo: boolean;
  isAnalysisSent: boolean;
  isPdfExported: boolean;
  isFullyPaid: boolean;
  isSoftFileSent: boolean;
  isPrintedAndSent: boolean;
  isPhysicalCopySent: boolean;
  isDeepConsulted: boolean;
  consultationNote: string;
  counselor: string;
  progressPercent: string;
  contactChannel: string;
  contactAccount: string;
  additionalNote: string;
}

export interface IImportResult {
  success: boolean;
  imported: number;
  caseServices: number;
  errors: string[];
}

// Thêm các interface mới từ customer.service.ts
export interface ICustomerStatisticsQuery {
  dateRange?: { start: Date; end: Date };
  groupBy: 'status' | 'type' | 'source' | 'staff';
}

export interface ICustomerInteractionInput {
  type: 'call' | 'message' | 'meeting' | 'email' | 'other';
  notes?: string;
  staff?: string;
}

export interface ICustomerWithCaseService {
  id: string;
  fullName: string;
  dateOfBirth?: Date;
  gender?: string;
  parentName?: string;
  parentDateOfBirth?: Date;
  phone?: string;
  email?: string;
  address?: string;
  contactChannel?: string;
  contactAccountName?: string;
  status?: 'potential' | 'active' | 'completed' | 'inactive';
  type?: 'regular' | 'vip' | 'premium';
  source?: 'referral' | 'social_media' | 'website' | 'direct' | 'other';
  serviceLocation?: string;
  interactions?: ICustomerInteraction[];
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
  caseService?: {
    id: string;
    case_price?: number;
    case_amountPaid?: number;
    case_debt?: number;
    case_paymentMethod?: string;
    case_progressPercent?: number;
    case_appointmentDate?: Date;
    case_consultantId?: string | Types.ObjectId;
    case_fingerprintTakerId?: string | Types.ObjectId;
    case_mainCounselorId?: string | Types.ObjectId;
    case_consultantName?: string;
    case_fingerprintTakerName?: string;
    case_counselorName?: string;
    case_scanLocation?: string;
    case_progressNote?: string;
    case_processStatus?: {
      isScanned?: boolean;
      isFullInfo?: boolean;
      isAnalysisSent?: boolean;
      isPdfExported?: boolean;
      isFullyPaid?: boolean;
      isSoftFileSent?: boolean;
      isPrinted?: boolean;
      isPhysicalCopySent?: boolean;
      isDeepConsulted?: boolean;
    };
  };
}

export interface ICreateCustomerWithCaseServiceData {
  customer: ICustomerAttrs;
  caseService?: ICaseServiceAttrs;
} 