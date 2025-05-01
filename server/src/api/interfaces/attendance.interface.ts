import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawAttendance {
  id: string;
  employeeId: Types.ObjectId;
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceAttrs {
  employeeId: Types.ObjectId;
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
}

export interface ICheckInData {
  userId: string;
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
}

export interface IAttendanceStats {
  _id: Types.ObjectId;
  totalDays: number;
  lateCount: number;
}

export type IAttendance = HydratedDocument<IRawAttendance>;

export interface IAttendanceModel extends Model<IAttendance> {
  build(attrs: IAttendanceAttrs): Promise<IAttendance>;
}

export interface IAttendanceResponseData {
  id: string;
  employeeId: string;
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
  checkInTime: Date;
  scheduledTime?: Date;
}

export interface IAttendanceQRResponse {
  qrCode: string;
  attendanceUrl: string;
}
