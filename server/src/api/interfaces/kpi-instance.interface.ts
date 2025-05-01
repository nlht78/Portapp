import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawKPIInstance {
  id: string;
  kpiId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  goal: number;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKPIInstanceAttrs {
  kpiId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  goal: number;
  completed?: number;
}

export interface ICreateKPIInstanceData {
  kpiId: string;
  startDate: Date;
  endDate: Date;
  goal: number;
  completed?: number;
}

export interface IUpdateKPIInstanceData {
  startDate?: Date;
  endDate?: Date;
  goal?: number;
  completed?: number;
}

// New interface for full KPI instance update
export interface IUpdateFullKPIInstanceData {
  kpiId?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: number;
  completed?: number;
}

export type IKPIInstance = HydratedDocument<IRawKPIInstance>;

export interface IKPIInstanceModel extends Model<IKPIInstance> {
  build(attrs: IKPIInstanceAttrs): Promise<IKPIInstance>;
}

export interface IKPIInstanceResponseData {
  id: string;
  startDate: Date;
  endDate: Date;
  goal: number;
  completed: number;
  kpi: {
    id: string;
    name: string;
    description: string;
    intervalType: string;
    assignee: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
} 