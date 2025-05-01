import { Schema, model } from 'mongoose';
import {
  IOfficeIP,
  IOfficeIPAttrs,
  IOfficeIPModel,
} from '../interfaces/officeIP.interface';
import { OFFICE_IP } from '../constants/officeIP.constant';
import { formatAttributeName } from '@utils/index';

const officeIPSchema = new Schema<IOfficeIP, IOfficeIPModel>(
  {
    officeName: {
      type: String,
      unique: true,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: OFFICE_IP.COLLECTION_NAME,
  }
);

officeIPSchema.statics.build = async (attrs: IOfficeIPAttrs) => {
  return OfficeIPModel.create(attrs);
};

export const OfficeIPModel = model<IOfficeIP, IOfficeIPModel>(
  OFFICE_IP.DOCUMENT_NAME,
  officeIPSchema
);
