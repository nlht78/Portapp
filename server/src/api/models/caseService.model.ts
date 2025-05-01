import { Schema, model } from 'mongoose';
import { CASE_SERVICE, CUSTOMER, USER } from '../constants';
import {
  ICaseServiceAttrs,
  ICaseServiceModel,
  IRawCaseService,
} from '../interfaces/caseService.interface';
import { formatAttributeName } from '../utils';

const caseServiceSchema = new Schema<IRawCaseService, ICaseServiceModel>(
  {
    case_customerId: {
      type: Schema.Types.ObjectId,
      ref: CUSTOMER.DOCUMENT_NAME,
      required: true,
    },
    case_eventLocation: {
      type: String,
      default: '',
    },
    case_partner: {
      type: String,
      default: '',
    },
    case_appointmentDate: {
      type: Date,
      default: Date.now,
    },
    case_price: {
      type: Number,
      default: 0,
    },
    case_amountPaid: {
      type: Number,
      default: 0,
    },
    case_debt: {
      type: Number,
      default: 0,
    },
    case_paymentMethod: {
      type: String,
      default: '',
    },
    
    // Thông tin nhân viên - lưu ID
    case_consultantId: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      default: null,
    },
    case_fingerprintTakerId: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      default: null,
    },
    case_mainCounselorId: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      default: null,
    },
    
    // Thông tin nhân viên - lưu tên (để dùng trong import)
    case_consultantName: {
      type: String,
      default: '',
    },
    case_fingerprintTakerName: {
      type: String,
      default: '',
    },
    case_counselorName: {
      type: String,
      default: '',
    },
    
    // Thông tin về địa điểm
    case_scanLocation: {
      type: String,
      default: '',
    },
    
    // Process status fields
    case_isScanned: {
      type: Boolean,
      default: false,
    },
    case_isFullInfo: {
      type: Boolean,
      default: false,
    },
    case_isAnalysisSent: {
      type: Boolean,
      default: false, 
    },
    case_isPdfExported: {
      type: Boolean,
      default: false,
    },
    case_isFullyPaid: {
      type: Boolean,
      default: false,
    },
    case_isSoftFileSent: {
      type: Boolean,
      default: false,
    },
    case_isPrintedAndSent: {
      type: Boolean,
      default: false,
    },
    case_isPhysicalCopySent: {
      type: Boolean,
      default: false,
    },
    case_isDeepConsulted: {
      type: Boolean,
      default: false,
    },
    
    // Progress info
    case_progressNote: {
      type: String,
      default: '',
    },
    case_progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    collection: CASE_SERVICE.COLLECTION_NAME,
    strict: false
  }
);

// Pre-save middleware to calculate debt
caseServiceSchema.pre('save', function(next) {
  if (this.case_price !== undefined && this.case_amountPaid !== undefined) {
    this.case_debt = this.case_price - this.case_amountPaid;
    
    // Update payment status if fully paid
    this.case_isFullyPaid = this.case_debt <= 0;
  }
  next();
});

caseServiceSchema.statics.build = (attrs: ICaseServiceAttrs) => {
  return CaseServiceModel.create(formatAttributeName(attrs, CASE_SERVICE.PREFIX));
};

export const CaseServiceModel = model<IRawCaseService, ICaseServiceModel>(
  CASE_SERVICE.DOCUMENT_NAME,
  caseServiceSchema
); 