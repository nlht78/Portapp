import { IUser } from './user.interface';

export interface IKPI {
  id: string;
  assigneeId: Pick<
    IUser,
    'id' | 'usr_email' | 'usr_firstName' | 'usr_lastName'
  >;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IKPIInstance {
  id: string;
  kpiId: string;
  kpi: IKPI;
  startDate: string;
  endDate: string;
  goal: number;
  completed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateKPIData {
  assigneeId: string;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
}

export interface IUpdateKPIData {
  name?: string;
  description?: string;
  baseGoal?: number;
  intervalType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
}

export interface ICreateKPIInstanceData {
  kpiId: string;
  startDate: string;
  endDate: string;
  goal: number;
}

export interface IUpdateKPIInstanceData {
  completed: number;
  startDate?: string;
  endDate?: string;
  goal?: number;
}

// New interface for admin to update all KPI instance fields
export interface IAdminUpdateKPIInstanceData {
  kpiId?: string;
  startDate?: string;
  endDate?: string;
  goal?: number;
  completed?: number;
}

// New interface for admin to update all KPI fields
export interface IAdminUpdateKPIData {
  name?: string;
  description?: string;
  baseGoal?: number;
  intervalType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
  assigneeId?: string;
}

export interface IKPIWithInstance extends IKPI {
  instance?: {
    id: string;
    startDate: string;
    endDate: string;
    goal: number;
    completed: number;
    createdAt: string;
    updatedAt: string;
    kpiId: {
      id: string;
      name: string;
      description: string;
      intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      isActive: boolean;
      assigneeId: {
        id: string;
        usr_email: string;
        usr_firstName: string;
        usr_lastName: string;
      };
    };
  };
  statistics?: {
    totalInstances: number;
    completedInstances: number;
    averageCompletionRate: number;
  };
}

export interface IKPIInstanceWithProgress extends IKPIInstance {
  completionRate: number;
  status: 'completed' | 'in_progress' | 'at_risk';
}

export interface IKPIStatistics {
  totalInstances: number;
  completedInstances: number;
  averageCompletionRate: number;
}

export interface IEmployeeKPI {
  id: string;
  name: string;
  description: string;
  baseGoal: number;
  intervalType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assigneeId: {
    usr_email: string;
    usr_firstName: string;
    usr_lastName: string;
    id: string;
  };
  instance?: {
    id: string;
    kpiId: {
      buffer: string;
    };
    startDate: string;
    endDate: string;
    goal: number;
    completed: number;
    createdAt: string;
    updatedAt: string;
  };
}
