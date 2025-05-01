import { IUser } from './user.interface';

export interface IEmployee {
  id: string;
  employeeCode: string;
  position: string;
  department: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
  userId: IUser;
}

export interface IEmployeeWithUserId {
  id: string;
  employeeCode: string;
  position: string;
  department: string;
  userId: {
    id: string;
    usr_username: string;
    usr_email: string;
    usr_firstName: string;
    usr_lastName: string;
  };
}

export interface ICreateEmployeeData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  msisdn: string;
  position: string;
  department: string;
  joinDate: string;
  password: string;
  status?: 'active' | 'inactive';
  avatar?: string;
  address?: string;
  birthdate?: string;
  sex?: string;
  role: string;
}

export interface IUpdateEmployeeData {
  username?: string;
  password?: string;
  employeeCode?: string;
  position?: string;
  department?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
  firstName?: string;
  lastName?: string;
  email?: string;
  msisdn?: string;
  avatar?: string;
  address?: string;
  birthdate?: string;
  sex?: string;
  role?: string;
  currentPassword?: string;
  newPassword?: string;
}
