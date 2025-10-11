import { model, Schema, Types, Model, ClientSession } from 'mongoose';
import { IMAGE, USER } from '../constants';
import { IUser, IUserModel, IUserAttrs } from '../interfaces/user.interface';
import { formatAttributeName } from '../utils';

const userSchema = new Schema<IUser, IUserModel>(
  {
    usr_username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    usr_email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    usr_firstName: {
      type: String,
      required: true,
      trim: true,
    },
    usr_lastName: {
      type: String,
      required: true,
      trim: true,
    },
    usr_slug: {
      type: String,
      required: true,
    },
    usr_password: {
      type: String,
      required: true,
    },
    usr_salt: {
      type: String,
      required: true,
    },
    usr_avatar: {
      type: Types.ObjectId,
      ref: IMAGE.DOCUMENT_NAME,
    },
    usr_address: {
      type: String,
    },
    usr_birthdate: {
      type: Date,
    },
    usr_msisdn: {
      type: String,
    },
    usr_sex: {
      type: String,
    },
    usr_status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive'],
    },
    usr_role: {
      type: String,
      default: 'user', // Default role since role system is removed
    },
  },
  {
    timestamps: true,
    collection: USER.COLLECTION_NAME,
  }
);

userSchema.statics.build = async (attrs: IUserAttrs, session?: ClientSession) => {
  const user = new UserModel(formatAttributeName(attrs, USER.PREFIX));
  if (session) {
    return await user.save({ session });
  }
  return await user.save();
};

export const UserModel = model<IUser, IUserModel>(
  USER.DOCUMENT_NAME,
  userSchema
);
