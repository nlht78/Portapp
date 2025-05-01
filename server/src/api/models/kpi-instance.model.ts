import { Schema, model } from 'mongoose';
import {
  IKPIInstance,
  IKPIInstanceModel,
  IKPIInstanceAttrs,
} from '../interfaces/kpi-instance.interface';

const kpiInstanceSchema = new Schema<IKPIInstance, IKPIInstanceModel>(
  {
    kpiId: {
      type: Schema.Types.ObjectId,
      ref: 'KPI',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    goal: {
      type: Number,
      required: true,
    },
    completed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'kpi_instances',
  }
);

kpiInstanceSchema.statics.build = (attrs: IKPIInstanceAttrs) => {
  return KPIInstanceModel.create(attrs);
};

export const KPIInstanceModel = model<IKPIInstance, IKPIInstanceModel>(
  'KPIInstance',
  kpiInstanceSchema
);
