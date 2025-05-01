import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  INotificationResponse,
  INotificationListResponse,
  INotificationCountResponse,
  IMarkAsReadResponse,
  IDeleteNotificationResponse,
  IAdminCreateNotificationData,
} from '~/interfaces/notification.interface';

// Lấy danh sách thông báo của user
const getMyNotifications = async (
  request: ISessionUser,
  query: { page?: number; limit?: number; isRead?: boolean } = {},
) => {
  const queryString = new URLSearchParams();
  if (query.page) queryString.append('page', query.page.toString());
  if (query.limit) queryString.append('limit', query.limit.toString());
  if (typeof query.isRead === 'boolean')
    queryString.append('isRead', query.isRead.toString());

  // Log để debug
  console.log('Request user ID:', request.user.id);

  const response = await fetcher(
    `/notifications/me?${queryString.toString()}`,
    {
      method: 'GET',
      request,
      headers: {
        'X-User-ID': request.user.id, // Thêm header để đảm bảo server nhận được đúng ID
      },
    },
  );

  return response as INotificationListResponse;
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (notificationId: string, request: ISessionUser) => {
  const response = await fetcher(
    `/notifications/me/${notificationId}/mark-read`,
    {
      method: 'PUT',
      request,
    },
  );
  return response as INotificationResponse;
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (request: ISessionUser) => {
  const response = await fetcher('/notifications/mark-all-read', {
    method: 'PUT',
    request,
  });
  return response as IMarkAsReadResponse;
};

// Xóa thông báo
const deleteNotification = async (
  notificationId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/notifications/${notificationId}`, {
    method: 'DELETE',
    request,
  });
  return response as IDeleteNotificationResponse;
};

// Đếm số thông báo chưa đọc
const countUnreadNotifications = async (request: ISessionUser) => {
  const response = await fetcher('/notifications/unread-count', {
    method: 'GET',
    request,
  });
  return response as INotificationCountResponse;
};

// Tạo thông báo cho nhiều nhân viên bởi admin
const createAdminNotification = async (
  data: IAdminCreateNotificationData,
  request: ISessionUser,
) => {
  const response = await fetcher('/notifications/admin/create', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
  return response as INotificationResponse;
};

// Lấy tất cả thông báo
const getAllNotifications = async (
  request: ISessionUser,
  query: { page?: number; limit?: number; type?: string } = {},
) => {
  const queryString = new URLSearchParams();
  if (query.page) queryString.append('page', query.page.toString());
  if (query.limit) queryString.append('limit', query.limit.toString());
  if (query.type) queryString.append('type', query.type);

  const response = await fetcher(`/notifications?${queryString.toString()}`, {
    method: 'GET',
    request,
  });
  return response as INotificationListResponse;
};

// Lấy thông báo theo ID
const getNotificationById = async (
  notificationId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/notifications/${notificationId}`, {
    method: 'GET',
    request,
  });
  return response as INotificationResponse;
};

// Cập nhật thông báo
const updateNotification = async (
  notificationId: string,
  data: Partial<IAdminCreateNotificationData>,
  request: ISessionUser,
) => {
  const response = await fetcher(`/notifications/${notificationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as INotificationResponse;
};

export {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  countUnreadNotifications,
  createAdminNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
};
