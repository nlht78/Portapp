import { Schema, model } from 'mongoose';
import { IKPI, IKPIModel, IKPIAttrs } from '../interfaces/kpi.interface';

const kpiSchema = new Schema<IKPI, IKPIModel>(
  {
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    baseGoal: {
      type: Number,
      required: true,
    },
    intervalType: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'kpis',
  }
);

kpiSchema.statics.build = (attrs: IKPIAttrs) => {
  return KPIModel.create(attrs);
};

export const KPIModel = model<IKPI, IKPIModel>('KPI', kpiSchema);
