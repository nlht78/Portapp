import { Schema, model, Types, Model } from 'mongoose';
import { USER } from '../constants';
import {
  IEmployeeAttrs,
  IEmployeeModel,
  IRawEmployee,
} from '../interfaces/employee.interface';

const employeeSchema = new Schema<IRawEmployee, IEmployeeModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: USER.DOCUMENT_NAME,
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    joinDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: USER.EMPLOYEE.COLLECTION_NAME,
  }
);

employeeSchema.statics.build = (attrs: IEmployeeAttrs) => {
  return new EmployeeModel(attrs);
};

export const EmployeeModel = model<IRawEmployee, IEmployeeModel>(
  USER.EMPLOYEE.DOCUMENT_NAME,
  employeeSchema
);
