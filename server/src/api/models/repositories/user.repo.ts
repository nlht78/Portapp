import { ClientSession, isValidObjectId } from 'mongoose';
import { IUserAttrs } from '../../interfaces/user.interface';
import { UserModel } from '../user.model';
import { getReturnData } from '@utils/index';

const getAllUsers = async () => {
  return await UserModel.find();
};

const createUser = async (user: IUserAttrs, session?: ClientSession) => {
  return await UserModel.build(user, session);
};

const findUserByEmail = async (email: string) => {
  return await UserModel.findOne({ usr_email: email });
};

const findUserById = async (id: string) => {
  if (isValidObjectId(id)) {
    return await UserModel.findById(id).populate('usr_role', 'name slug');
  }

  return await UserModel.findOne({
    $or: [{ usr_email: id }, { usr_username: id }],
  }).populate('usr_role', 'name slug');
};

export { getAllUsers, createUser, findUserByEmail, findUserById };
