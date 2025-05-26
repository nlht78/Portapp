import bcrypt from 'bcrypt';
import mongoose, { isValidObjectId } from 'mongoose';
import { Types } from 'mongoose';

import { EmployeeModel } from '../models/employee.model';
import { BadRequestError, NotFoundError } from '../core/errors';
import {
  formatAttributeName,
  getReturnData,
  getReturnList,
  isEmptyObj,
  removeNestedNullish,
} from '@utils/index';
import { UserModel } from '../models/user.model';
import { KPIModel } from '../models/kpi.model';
import {
  ICreateEmployeeWithUserData,
  IUpdateEmployeeData,
} from '../interfaces/employee.interface';
import { USER } from '../constants';
import { createUser } from '@models/repositories/user.repo';

const createEmployee = async (data: ICreateEmployeeWithUserData) => {
  let session;
  try {
    // Kiểm tra trước khi bắt đầu transaction
    const [existingEmployeeCheck, existingUserCheck] = await Promise.all([
      EmployeeModel.findOne({ employeeCode: data.employeeCode }),
      UserModel.findOne({ usr_email: data.email }),
    ]);

    if (existingEmployeeCheck) {
      throw new BadRequestError('Employee code already exists');
    }

    if (existingUserCheck) {
      throw new BadRequestError('Email already exists in user system');
    }

    // Kiểm tra ràng buộc role nếu có trường role
    if (!data.role || !isValidObjectId(data.role) || !data.password) {
      throw new BadRequestError('Bad data');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Tạo user mới
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(data.password, salt);

    const userData = {
      usr_firstName: data.firstName,
      usr_lastName: data.lastName,
      usr_email: data.email,
      usr_msisdn: data.msisdn,
      usr_address: data.address,
      usr_birthdate: data.birthdate,
      usr_sex: data.sex,
      usr_username: data.username || data.email,
      usr_slug: data.email.split('@')[0],
      usr_role: data.role,
      usr_password: hashPassword,
      usr_salt: salt,
    };

    const [newUser] = await UserModel.create([userData], { session });

    // Tạo employee mới
    const [newEmployee] = await EmployeeModel.create(
      [
        {
          userId: newUser._id,
          employeeCode: data.employeeCode,
          position: data.position,
          department: data.department,
          joinDate: data.joinDate,
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session = null;

    return {
      ...getReturnData(newEmployee.toJSON(), { without: ['userId'] }),
      userId: getReturnData(newUser.toJSON(), {
        without: ['_id', 'usr_password', 'usr_salt'],
      }),
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  }
};

const getEmployees = async (query: any = {}) => {
  const employees = await EmployeeModel.find(query)
    .populate({
      path: 'userId',
      select: '-__v -usr_password -usr_salt',
      populate: {
        path: 'usr_avatar',
      },
    })
    .sort({ createdAt: -1 });

  return getReturnList(employees);
};

const getEmployeeById = async (id: string) => {
  const employee = await EmployeeModel.findById(id).populate({
    path: 'userId',
    select: '-usr_password -usr_salt -__v',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const getEmployeeByUserId = async (userId: string) => {
  const employee = await EmployeeModel.findOne({ userId }).populate({
    path: 'userId',
    select: '-__v -usr_password -usr_salt',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const getCurrentEmployeeByUserId = async (userId: string) => {
  const employee = await EmployeeModel.findOne({ userId }).populate({
    path: 'userId',
    select: '-__v -usr_password -usr_salt',
    populate: {
      path: 'usr_role usr_avatar',
      select: 'name slug img_url',
    },
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return getReturnData(employee);
};

const updateEmployee = async (id: string, data: IUpdateEmployeeData) => {
  let session;
  try {
    // Tìm employee và lấy userId
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Kiểm tra trùng lặp mã nhân viên
    if (data.employeeCode) {
      const existingEmployee = await EmployeeModel.findOne({
        _id: { $ne: id },
        employeeCode: data.employeeCode,
      });

      if (existingEmployee) {
        throw new BadRequestError('Mã nhân viên đã tồn tại trong hệ thống');
      }
    }

    // Kiểm tra trùng lặp email nếu có cập nhật email
    if (data.email) {
      const existingUser = await UserModel.findOne({
        _id: { $ne: employee.userId },
        usr_email: data.email,
      });

      if (existingUser) {
        throw new BadRequestError('Email đã tồn tại trong hệ thống');
      }
    }

    // Kiểm tra ràng buộc role nếu có cập nhật role
    if (data.role && !isValidObjectId(data.role)) {
      throw new BadRequestError('Quyền không hợp lệ');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const employeeUpdateData = removeNestedNullish<IUpdateEmployeeData>(
      getReturnData(data, {
        fields: ['employeeCode', 'position', 'department', 'joinDate'],
      })
    );

    // Cập nhật employee nếu có dữ liệu cần cập nhật
    if (!isEmptyObj(employeeUpdateData)) {
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        id,
        { $set: employeeUpdateData },
        { new: true, session }
      );

      if (!updatedEmployee) {
        throw new NotFoundError('Nhân viên không tồn tại');
      }
    }

    const userUpdateData = removeNestedNullish<IUpdateEmployeeData>(
      getReturnData(data, {
        fields: [
          'firstName',
          'lastName',
          'email',
          'msisdn',
          'avatar',
          'address',
          'username',
          'birthdate',
          'sex',
          'status',
          'role',
        ],
      })
    );

    if (data.password) {
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(data.password, salt);

      userUpdateData.password = hashPassword;
      // @ts-ignore
      userUpdateData.salt = salt;
    }

    if (!isEmptyObj(userUpdateData)) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        employee.userId,
        {
          $set: {
            ...formatAttributeName(userUpdateData, USER.PREFIX),
            ...(data.email && {
              usr_slug: data.email.split('@')[0],
            }),
          },
        },
        { new: true, session }
      );

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session = null;

    // Lấy dữ liệu mới nhất sau khi cập nhật
    const finalEmployee = await EmployeeModel.findById(id).populate({
      path: 'userId',
      select: '-__v -usr_password -usr_salt',
    });

    if (!finalEmployee) {
      throw new NotFoundError('Nhân viên không tồn tại');
    }

    return {
      ...getReturnData(finalEmployee, { without: ['userId'] }),
      userId: getReturnData(finalEmployee.userId),
    };
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.error('Error ending session:', endError);
      }
    }
  }
};

const deleteEmployee = async (id: string) => {
  let session;
  try {
    // Tìm employee để lấy userId
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Bắt đầu transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Xóa employee
    const deleteEmployeeResult = await EmployeeModel.deleteOne(
      { _id: id },
      { session }
    );

    if (deleteEmployeeResult.deletedCount === 0) {
      throw new Error('Failed to delete employee');
    }

    // Xóa user tương ứng
    const deleteUserResult = await UserModel.deleteOne(
      { _id: employee.userId },
      { session }
    );

    if (deleteUserResult.deletedCount === 0) {
      throw new Error('Failed to delete user');
    }

    // Xóa tất cả KPI liên quan đến employee
    await KPIModel.deleteMany(
      { assigneeId: employee.userId },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      message:
        'Employee and all associated data have been deleted successfully',
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    throw error;
  } finally {
    // Đảm bảo session luôn được kết thúc
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.error('Error ending session:', endError);
      }
    }
  }
};

export {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeByUserId,
  getCurrentEmployeeByUserId,
};
