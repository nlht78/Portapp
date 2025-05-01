import { Schema, model } from 'mongoose';
import { CUSTOMER } from '../constants';
import {
  ICustomerAttrs,
  ICustomerModel,
  IRawCustomer,
} from '../interfaces/customer.interface';
import { formatAttributeName } from '../utils';

const customerSchema = new Schema<IRawCustomer, ICustomerModel>(
  {
    cus_fullName: { 
      type: String, 
      required: true, 
    },
    cus_dateOfBirth: { 
      type: Date,
    },
    cus_gender: { 
      type: String,
      enum: ['male', 'female', 'other'],
    },
    cus_parentName: { 
      type: String,
    },
    cus_parentDateOfBirth: { 
      type: Date,
    },
    cus_phone: { 
      type: String,
    },
    cus_email: { 
      type: String,
    },
    cus_address: { 
      type: String,
    },
    cus_contactChannel: { 
      type: String,
      default: '',
    },
    cus_contactAccountName: { 
      type: String,
    },
    cus_status: {
      type: String,
      enum: ['potential', 'active', 'completed', 'inactive'],
      default: 'potential'
    },
    cus_type: {
      type: String,
      enum: ['regular', 'vip', 'premium'],
      default: 'regular'
    },
    cus_source: {
      type: String,
      enum: ['referral', 'social_media', 'website', 'direct', 'other']
    },
    cus_serviceLocation: {
      type: String,
    },
    cus_interactions: [{
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ['call', 'message', 'meeting', 'email', 'other'] },
      notes: String,
      staff: { type: Schema.Types.ObjectId, ref: 'Employee' }
    }],
    cus_note: { 
      type: String,
    },
  },
  {
    timestamps: true,
    collection: CUSTOMER.COLLECTION_NAME,
  }
);

customerSchema.statics.build = (attrs: ICustomerAttrs) => {
  return CustomerModel.create(formatAttributeName(attrs, CUSTOMER.PREFIX));
};

export const CustomerModel = model<IRawCustomer, ICustomerModel>(
  CUSTOMER.DOCUMENT_NAME,
  customerSchema
); 