import { Schema, model, Types, Model } from 'mongoose';
import { ATTENDANCE, USER } from '../constants';
import {
  IAttendanceAttrs,
  IAttendanceModel,
  IRawAttendance,
} from '../interfaces/attendance.interface';

const attendanceSchema = new Schema<IRawAttendance, IAttendanceModel>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: USER.EMPLOYEE.DOCUMENT_NAME,
      required: true,
    },
    fingerprint: {
      type: String,
      required: true,
    },
    geolocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    ip: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: Date,
    checkOutTime: Date,
  },
  {
    timestamps: true,
    collection: ATTENDANCE.COLLECTION_NAME,
  }
);

attendanceSchema.statics.build = (attrs: IAttendanceAttrs) => {
  return AttendanceModel.create(attrs);
};

export const AttendanceModel = model<IRawAttendance, IAttendanceModel>(
  ATTENDANCE.DOCUMENT_NAME,
  attendanceSchema
);
