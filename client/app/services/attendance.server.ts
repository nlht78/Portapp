// client/app/services/attendance.server.ts
import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { ICheckInData, IAttendance } from '~/interfaces/attendance.interface';

// Check-in
const checkIn = async (data: ICheckInData, request: ISessionUser) => {
  const response = await fetcher('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
  return response as IAttendance;
};

// Check-in
const checkOut = async (data: ICheckInData, request: ISessionUser) => {
  const response = await fetcher('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
  return response as IAttendance;
};

// Lấy danh sách chấm công
const getAttendances = async (request: ISessionUser) => {
  const response = await fetcher('/attendance', { request });
  return response as IAttendance[];
};

const getLast7DaysStats = async (userId: string, request: ISessionUser) => {
  const response = await fetcher(`/attendance/stats/${userId}`, {
    request,
  });
  return response as IAttendance[];
};

// Lấy thông tin một lần chấm công
const getAttendanceById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/attendance/${id}`, { request });
  return response as IAttendance;
};

// Lấy thống kê chấm công
const getAttendanceStats = async (
  month: number,
  year: number,
  request: ISessionUser,
) => {
  const response = await fetcher(
    `/attendance/stats?month=${month}&year=${year}`,
    {
      request,
    },
  );
  return response as IAttendance[];
};

const getTodayAttendance = async (request: ISessionUser) => {
  const response = await fetcher('/attendance/today', { request });
  return response as IAttendance;
};

// Lấy mã QR chấm công
const getAttendanceQR = async (request: ISessionUser) => {
  const response = await fetcher('/attendance/qr-code', { request });
  return response as {
    qrCode: string;
    attendanceUrl: string;
  };
};

const getTodayAttendanceStats = async (request: ISessionUser) => {
  const response = await fetcher('/attendance/stats/today', { request });
  return response as (IAttendance & {
    employeeId: {
      id: string;
      employeeCode: string;
      userId: {
        id: string;
        usr_firstName: string;
        usr_lastName: string;
      };
    };
  })[];
};

const updateAttendance = async (
  id: string,
  data: Partial<IAttendance>,
  request: ISessionUser,
) => {
  const response = await fetcher(`/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IAttendance;
};

const deleteAttendance = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/attendance/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as IAttendance;
};

export {
  checkIn,
  checkOut,
  getLast7DaysStats,
  getAttendances,
  getAttendanceById,
  getAttendanceStats,
  getAttendanceQR,
  getTodayAttendance,
  getTodayAttendanceStats,
  updateAttendance,
  deleteAttendance,
};
