export interface IAttendance {
  id: string;
  employeeId: string;
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceStats {
  _id: string;
  totalDays: number;
  lateCount: number;
}

export interface ICheckInData {
  fingerprint: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  ip: string;
}
