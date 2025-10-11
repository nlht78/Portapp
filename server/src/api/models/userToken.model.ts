import { Schema, model } from 'mongoose';
import { IUserToken, IUserTokenModel, IUserTokenAttrs } from '../interfaces/userToken.interface';

const userTokenSchema = new Schema<IUserToken, IUserTokenModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenId: {
      type: String,
      required: true,
    },
    tokenName: {
      type: String,
      required: true,
    },
    tokenSymbol: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'userTokens',
  }
);

// Compound index to ensure unique token per user
userTokenSchema.index({ userId: 1, tokenId: 1 }, { unique: true });

userTokenSchema.statics.build = (attrs: IUserTokenAttrs) => {
  return UserTokenModel.create(attrs);
};

export const UserTokenModel = model<IUserToken, IUserTokenModel>('UserToken', userTokenSchema); 