import { useState, useEffect } from 'react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import {
  Form,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '~/services/notification.server';
import {
  INotification,
  INotificationQueryParams,
  INotificationLoaderData,
  INotificationActionData,
} from '~/interfaces/notification.interface';
import { toast } from 'react-toastify';
import { ISessionUser } from '~/interfaces/auth.interface';
import ContentHeader from '../_components/ContentHeader';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/hrm/login');
  }

  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';
    const type = url.searchParams.get('type') || '';
    const isRead =
      url.searchParams.get('isRead') === 'false' ? false : undefined;

    const queryParams: INotificationQueryParams = {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || undefined,
      isRead,
    };

    const response = await getMyNotifications(
      auth as ISessionUser,
      queryParams,
    );

    return {
      notifications: response.notifications || [],
      pagination: response.pagination,
      currentUser: auth.user,
    };
  } catch (error) {
    console.error('Error loading notifications:', error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 10, total: 0 },
      currentUser: null,
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/hrm/login');
  }

  const formData = await request.formData();
  const actionType = formData.get('action');
  const notificationId = formData.get('notificationId') as string;

  try {
    console.log('Client action:', { actionType, notificationId });

    if (actionType === 'markAsRead' && notificationId) {
      const result = await markAsRead(notificationId, auth as ISessionUser);
      return {
        success: true,
        message: 'Đã đánh dấu thông báo đã đọc',
        data: result,
      };
    } else if (actionType === 'markAllAsRead') {
      const result = await markAllAsRead(auth as ISessionUser);
      return {
        success: true,
        message: 'Đã đánh dấu tất cả thông báo đã đọc',
        data: result,
      };
    }
    return { success: false, message: 'Hành động không hợp lệ' };
  } catch (error) {
    console.error('Error performing notification action:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi thực hiện thao tác',
    };
  }
};

export default function HRMNotifications() {
  const { notifications, pagination, currentUser } =
    useLoaderData<INotificationLoaderData>();
  const fetcher = useFetcher<INotificationActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notificationsList, setNotificationsList] = useState<INotification[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(pagination.page);
  const [selectedType, setSelectedType] = useState(
    searchParams.get('type') || '',
  );
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [processingAll, setProcessingAll] = useState(false);

  // Update notifications list when notifications data changes
  useEffect(() => {
    if (selectedType) {
      const filtered = notifications.filter(
        (n: INotification) => n.type === selectedType,
      );
      setNotificationsList(filtered);
    } else {
      setNotificationsList(notifications);
    }
  }, [notifications, selectedType]);

  // Update notifications list when mark as read is successful
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      toast.success(fetcher.data.message || 'Đã cập nhật trạng thái thông báo');

      // Cập nhật local state thay vì refresh toàn trang
      const actionId = localStorage.getItem('currentNotificationAction');
      const notificationId = localStorage.getItem('currentNotificationId');

      if (actionId === 'markAsRead' && notificationId) {
        setNotificationsList((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
        setIsLoading((prev) => ({ ...prev, [notificationId]: false }));
      } else if (actionId === 'markAllAsRead') {
        setNotificationsList((prev) =>
          prev.map((n) => ({ ...n, isRead: true })),
        );
        setProcessingAll(false);
      }

      // Xóa dữ liệu đã lưu
      localStorage.removeItem('currentNotificationAction');
      localStorage.removeItem('currentNotificationId');
    } else if (
      fetcher.state === 'idle' &&
      fetcher.data &&
      !fetcher.data.success
    ) {
      toast.error(fetcher.data.message || 'Có lỗi xảy ra');
      setIsLoading({});
      setProcessingAll(false);

      // Xóa dữ liệu đã lưu
      localStorage.removeItem('currentNotificationAction');
      localStorage.removeItem('currentNotificationId');
    }
  }, [fetcher.state, fetcher.data]);

  const handleMarkAsRead = (notificationId: string) => {
    // Lưu ID thông báo và action vào localStorage để dùng sau
    localStorage.setItem('currentNotificationAction', 'markAsRead');
    localStorage.setItem('currentNotificationId', notificationId);

    // Cập nhật trạng thái loading
    setIsLoading((prev) => ({ ...prev, [notificationId]: true }));

    const formData = new FormData();
    formData.append('action', 'markAsRead');
    formData.append('notificationId', notificationId);
    fetcher.submit(formData, { method: 'post' });
  };

  const handleMarkAllAsRead = () => {
    // Lưu action vào localStorage để dùng sau
    localStorage.setItem('currentNotificationAction', 'markAllAsRead');

    // Cập nhật trạng thái loading
    setProcessingAll(true);

    const formData = new FormData();
    formData.append('action', 'markAllAsRead');
    fetcher.submit(formData, { method: 'post' });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const params = new URLSearchParams(searchParams);
    if (type) {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return 'priority_high';
      case 'attendance':
        return 'check_circle';
      case 'work':
        return 'work';
      case 'event':
        return 'event';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-red-100 text-red-500';
      case 'attendance':
        return 'bg-green-100 text-green-500';
      case 'work':
        return 'bg-blue-100 text-blue-500';
      case 'event':
        return 'bg-purple-100 text-purple-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'system':
        return 'Hệ thống';
      case 'attendance':
        return 'Chấm công';
      case 'work':
        return 'Công việc';
      case 'event':
        return 'Sự kiện';
      default:
        return 'Thông báo chung';
    }
  };

  const getNotificationCount = (
    notifications: INotification[],
    type: string,
  ) => {
    return notifications.filter((n: INotification) => n.type === type).length;
  };

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Thông báo'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>
              {processingAll ? 'hourglass_empty' : 'mark_email_read'}
            </span>
            {processingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </>
        }
        actionHandler={handleMarkAllAsRead}
      />

      {/* Notifications Filter Tabs */}
      <div className='bg-white rounded-lg shadow-sm mb-6 overflow-x-auto'>
        <div className='flex border-b border-gray-200'>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              !selectedType
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>
              inbox
            </span>
            Tất cả
            <span className='ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {pagination.total}
            </span>
          </button>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              selectedType === 'attendance'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('attendance')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>work</span>
            Chấm công
            <span className='ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {getNotificationCount(notifications, 'attendance')}
            </span>
          </button>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              selectedType === 'system'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('system')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>
              priority_high
            </span>
            Hệ thống
            <span className='ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {getNotificationCount(notifications, 'system')}
            </span>
          </button>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              selectedType === 'work'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('work')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>work</span>
            Công việc
            <span className='ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {getNotificationCount(notifications, 'work')}
            </span>
          </button>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              selectedType === 'event'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('event')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>
              event
            </span>
            Sự kiện
            <span className='ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {getNotificationCount(notifications, 'event')}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className='space-y-4 mb-6'>
        {notificationsList.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden ${
              !notification.isRead ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <div className='flex p-4'>
              <div className='shrink-0 mr-4'>
                <div
                  className={`h-10 w-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center`}
                >
                  <span className='material-symbols-outlined'>
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
              </div>
              <div className='flex-1'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3
                      className={`font-medium text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}
                    >
                      {notification.title}
                    </h3>
                    <span
                      className={`text-xs ${getNotificationColor(notification.type)} font-medium`}
                    >
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>
                  <div className='text-xs text-gray-400'>
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
                <p
                  className={`text-sm mt-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}
                >
                  {notification.message}
                </p>
                <div className='mt-2 text-xs text-gray-500'>
                  <div>
                    Người gửi: {notification.senderId.firstName}{' '}
                    {notification.senderId.lastName}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className='flex justify-end items-center mt-3'>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={isLoading[notification.id]}
                      className='bg-white hover:bg-gray-50 text-gray-500 text-xs px-3 py-1 rounded border border-gray-200 flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait'
                    >
                      <span className='material-symbols-outlined text-xs mr-1'>
                        {isLoading[notification.id]
                          ? 'hourglass_empty'
                          : 'task_alt'}
                      </span>
                      {isLoading[notification.id]
                        ? 'Đang xử lý...'
                        : 'Đánh dấu đã đọc'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className='flex justify-center items-center space-x-2 mt-4'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Trước
          </button>
          <span className='text-sm text-gray-600'>
            Trang {currentPage} /{' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage === Math.ceil(pagination.total / pagination.limit)
            }
            className='px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Sau
          </button>
        </div>
      )}
    </>
  );
}
