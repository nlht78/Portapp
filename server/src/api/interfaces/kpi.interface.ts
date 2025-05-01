import { HydratedDocument, Model, Types } from 'mongoose';

// Base interface cho response
export interface IBaseResponse<T> {
  message: string;
  metadata: T;
  options?: Record<string, any>;
  _link?: Record<string, any>;
}

export interface IRawKPI {
  id: string;
  assigneeId: Types.ObjectId;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKPIAttrs {
  assigneeId: Types.ObjectId;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
}

export interface ICreateKPIData {
  assigneeId: string;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
  goal?: number;
}

export interface IUpdateKPIData {
  name?: string;
  description?: string;
  baseGoal?: number;
  intervalType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
}

export type IKPI = HydratedDocument<IRawKPI>;

export interface IKPIModel extends Model<IKPI> {
  build(attrs: IKPIAttrs): Promise<IKPI>;
}

export interface IKPIResponseData {
  id: string;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Interface cho instance với progress
export interface IKPIInstanceWithProgress {
  id: string;
  startDate: Date;
  endDate: Date;
  goal: number;
  completed: number;
  completionRate: number;
  status: 'completed' | 'in_progress' | 'at_risk';
}

// Interface cho statistics
export interface IKPIStatistics {
  totalInstances: number;
  completedInstances: number;
  averageCompletionRate: number;
}

// Interface cho KPI với instance
export interface IKPIWithInstance extends IKPIResponseData {
  instance?: {
    id: string;
    startDate: Date;
    endDate: Date;
    goal: number;
    completed: number;
  };
}

// Interface cho Employee KPI với đầy đủ thông tin
export interface IEmployeeKPI {
  id: string;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  instances: IKPIInstanceWithProgress[];
  statistics: IKPIStatistics;
}

// Định nghĩa các response types cụ thể
export type IKPIResponse = IBaseResponse<IKPIResponseData>;
export type IKPIListResponse = IBaseResponse<IKPIResponseData[]>;
export type IKPIWithInstanceResponse = IBaseResponse<IKPIWithInstance>;
export type IKPIWithInstanceListResponse = IBaseResponse<IKPIWithInstance[]>;
export type IEmployeeKPIResponse = IBaseResponse<IEmployeeKPI[]>;
