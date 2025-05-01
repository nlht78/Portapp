import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawEmployee {
  id: string;
  userId: Types.ObjectId;
  employeeCode: string;
  position: string;
  department: string;
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeAttrs {
  userId: string;
  employeeCode: string;
  position: string;
  department: string;
  joinDate: Date;
}

export interface ICreateEmployeeData {
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  msisdn: string;
  position: string;
  department: string;
  joinDate: Date;
  status?: 'active' | 'inactive';
  avatar?: string;
}

export interface ICreateEmployeeWithUserData {
  username?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  msisdn: string;
  position: string;
  department: string;
  joinDate: Date;
  password: string;
  status: 'active' | 'inactive';
  avatar?: string;
  address?: string;
  birthdate?: Date;
  sex?: string;
  role?: Types.ObjectId;
}

export interface IUpdateEmployeeData {
  employeeCode?: string;
  position?: string;
  department?: string;
  joinDate?: Date;
  password?: string;
  status?: 'active' | 'inactive';
  firstName?: string;
  lastName?: string;
  email?: string;
  msisdn?: string;
  avatar?: string;
  address?: string;
  birthdate?: Date;
  sex?: string;
  role?: string;
  currentPassword?: string;
  newPassword?: string;
  username?: string;
}

export type IEmployee = HydratedDocument<IRawEmployee>;

export interface IEmployeeModel extends Model<IEmployee> {
  build(attrs: IEmployeeAttrs): Promise<IEmployee>;
}

export interface IEmployeeResponseData {
  id: string;
  employeeCode: string;
  position: string;
  department: string;
  joinDate: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    msisdn: string;
    avatar?: string;
    address?: string;
    birthdate?: Date;
    sex?: string;
    status: string;
    role: Types.ObjectId;
  };
}
