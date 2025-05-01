import { HydratedDocument, Model, ObjectId } from 'mongoose';

export interface IRawBooking {
  id: string;
  bok_name: string;
  bok_msisdn: string;
  bok_childAge: string;
  bok_branch: ObjectId;
  bok_viewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingAttrs {
  name: string;
  msisdn: string;
  childAge: string;
  branch: ObjectId;
  viewed: boolean;
}

export type IBooking = HydratedDocument<IRawBooking>;

export interface IBookingModel extends Model<IBooking> {
  build(attrs: IBookingAttrs): Promise<IBooking>;
}
