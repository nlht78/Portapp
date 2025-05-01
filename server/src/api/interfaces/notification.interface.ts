import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawNotification {
  id: string;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: "attendance" | "system" | "general" | "work" | "event";
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationAttrs {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: "attendance" | "system" | "general" | "work" | "event";
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface ICreateNotificationData {
  senderId: string | null;
  recipientId: string;
  title: string;
  message: string;
  type?: "attendance" | "system" | "general" | "work" | "event";
  metadata?: Record<string, any>;
}

export interface IAttendanceNotificationData {
  recipientId: string;
  checkInTime: Date;
  status: "success" | "late" | "failed";
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export interface INotificationResponse {
  notifications: INotificationResponseData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface INotificationResponseData {
  id: string;
  senderId: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  recipientId: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  title: string;
  message: string;
  type: 'attendance' | 'system' | 'general' | 'work' | 'event';
  isRead: boolean;
  metadata?: {
    checkInTime?: Date;
    status?: 'success' | 'late' | 'failed' | 'early' | 'absent';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminCreateNotificationData {
  recipientIds: string[];
  title: string;
  message: string;
  type: "attendance" | "system" | "general" | "work" | "event";
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: {
    requireResponse?: boolean;
    includeButtons?: boolean;
    buttons?: {
      text: string;
      type: "primary" | "success" | "danger" | "warning" | "default";
    }[];
    schedule?: {
      date: string;
      time: string;
    };
  };
}

export type INotification = HydratedDocument<IRawNotification>;

export interface INotificationModel extends Model<INotification> {
  build(attrs: INotificationAttrs): Promise<INotification>;
} 