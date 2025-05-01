export interface IOfficeIP {
  id: string;
  officeName: string;
  ipAddress: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOfficeIPCreate {
  officeName: string;
  ipAddress: string;
}
