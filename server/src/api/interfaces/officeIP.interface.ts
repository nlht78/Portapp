import { HydratedDocument, Model, ObjectId } from 'mongoose';

export interface IRawOfficeIP {
  officeName: string;
  ipAddress: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IOfficeIP = HydratedDocument<IRawOfficeIP>;

export interface IOfficeIPAttrs {
  officeName: string;
  ipAddress: string;
  status?: boolean;
}

export interface IOfficeIPModel extends Model<IOfficeIP> {
  build(attrs: IOfficeIPAttrs): Promise<IOfficeIP>;
}
