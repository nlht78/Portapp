import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import {
  getAllNotifications,
  deleteNotification,
  getMyNotifications,
  createAdminNotification,
  updateNotification,
} from '~/services/notification.server';
import { INotification } from '~/interfaces/notification.interface';
import { Link } from '@remix-run/react';
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
    const isPersonal = url.searchParams.get('personal') === 'true';

    let response;
    if (isPersonal) {
      response = await getMyNotifications(auth);
    } else {
      response = await getAllNotifications(auth, {
        page: parseInt(page),
        limit: parseInt(limit),
        type: type || undefined,
      });
    }

    // Lấy tổng số thông báo cho mỗi loại (không phân trang)
    const countResponse = await getAllNotifications(auth, {
      limit: 1000, // Số lớn để lấy tất cả (hoặc gần như tất cả)
      page: 1,
    });

    const typeCount = {
      attendance: countResponse.notifications.filter(
        (n) => n.type === 'attendance',
      ).length,
      system: countResponse.notifications.filter((n) => n.type === 'system')
        .length,
      work: countResponse.notifications.filter((n) => n.type === 'work').length,
      event: countResponse.notifications.filter((n) => n.type === 'event')
        .length,
      general: countResponse.notifications.filter((n) => n.type === 'general')
        .length,
    };

    return {
      notifications: response.notifications || [],
      pagination: response.pagination,
      isPersonal,
      typeCount,
    };
  } catch (error) {
    console.error('Error loading notifications:', error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 10, total: 0 },
      isPersonal: false,
      typeCount: { attendance: 0, system: 0, work: 0, event: 0, general: 0 },
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/hrm/login');
  }

  const formData = await request.formData();
  const action = formData.get('action');
  const notificationId = formData.get('notificationId') as string;

  try {
    if (action === 'delete') {
      await deleteNotification(notificationId, auth);
      return { success: true };
    } else if (action === 'create') {
      const data = {
        title: formData.get('title') as string,
        type: formData.get('type') as
          | 'attendance'
          | 'system'
          | 'general'
          | 'work'
          | 'event',
        message: formData.get('message') as string,
        status: formData.get('status') as 'active' | 'inactive',
        recipientIds: [auth.user.id],
      };
      await createAdminNotification(data, auth);
      return { success: true };
    } else if (action === 'update') {
      const data = {
        title: formData.get('title') as string,
        type: formData.get('type') as
          | 'attendance'
          | 'system'
          | 'general'
          | 'work'
          | 'event',
        message: formData.get('message') as string,
        status: formData.get('status') as 'active' | 'inactive',
      };
      await updateNotification(notificationId, data, auth);
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error performing notification action:', error);
    return { success: false };
  }
};

export default function HRMNotifications() {
  const navigate = useNavigate();
  const { notifications, pagination, isPersonal, typeCount } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ success: boolean; message?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notificationsList, setNotificationsList] = useState<INotification[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(pagination.page);
  const [selectedType, setSelectedType] = useState(
    searchParams.get('type') || '',
  );
  const [showPersonal, setShowPersonal] = useState(isPersonal);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    setNotificationsList(notifications);
  }, [notifications]);

  // Update notifications list when delete is successful
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      // Remove the deleted notification from the list
      if (isDeleting) {
        setNotificationsList((prev) => prev.filter((n) => n.id !== isDeleting));
        setIsDeleting(null);
        toast.success('Xóa thông báo thành công');
      }
    } else if (
      fetcher.state === 'idle' &&
      fetcher.data &&
      fetcher.data.success === false
    ) {
      setIsDeleting(null);
      toast.error(fetcher.data.message || 'Xóa thông báo thất bại');
    }
  }, [fetcher.state, fetcher.data, isDeleting]);

  const handleDelete = (notificationId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) {
      setIsDeleting(notificationId);
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('notificationId', notificationId);
      fetcher.submit(formData, { method: 'post' });
    }
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

  const handlePersonalToggle = () => {
    const newShowPersonal = !showPersonal;
    setShowPersonal(newShowPersonal);
    const params = new URLSearchParams(searchParams);
    if (newShowPersonal) {
      params.set('personal', 'true');
    } else {
      params.delete('personal');
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'late':
        return 'text-red-500';
      case 'early':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      case 'absent':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Danh sách thông báo'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Tạo thông báo
          </>
        }
        actionHandler={() => navigate('/hrm/notifications/new')}
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
              {typeCount.attendance}
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
              {typeCount.system}
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
              {typeCount.work}
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
              {typeCount.event}
            </span>
          </button>
          <button
            className={`text-sm font-medium px-4 py-3 flex items-center ${
              selectedType === 'general'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTypeChange('general')}
          >
            <span className='material-symbols-outlined text-sm mr-2'>
              notifications
            </span>
            Thông báo chung
            <span className='ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
              {typeCount.general}
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
                    <div className='flex items-center gap-2 mt-1'>
                      <span
                        className={`text-xs ${getNotificationColor(notification.type)} font-medium`}
                      >
                        {notification.type === 'system'
                          ? 'Hệ thống'
                          : notification.type === 'attendance'
                            ? 'Chấm công'
                            : notification.type === 'work'
                              ? 'Công việc'
                              : notification.type === 'event'
                                ? 'Sự kiện'
                                : 'Thông báo chung'}
                      </span>
                      {notification.metadata?.status && (
                        <span
                          className={`text-xs ${getStatusColor(notification.metadata.status)} font-medium`}
                        >
                          {notification.metadata.status === 'success'
                            ? 'Thành công'
                            : notification.metadata.status === 'late'
                              ? 'Muộn'
                              : notification.metadata.status === 'early'
                                ? 'Sớm'
                                : notification.metadata.status === 'failed'
                                  ? 'Thất bại'
                                  : 'Vắng mặt'}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${notification.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'} font-medium`}
                      >
                        {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                      </span>
                    </div>
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
                  <div>
                    Người nhận: {notification.recipientId.firstName}{' '}
                    {notification.recipientId.lastName}
                  </div>
                </div>
                {notification.metadata?.buttons && (
                  <div className='flex gap-2 mt-3'>
                    {notification.metadata.buttons.map((button, index) => (
                      <button
                        key={index}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          button.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : button.type === 'danger'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                )}
                <div className='flex justify-end items-center mt-3 gap-2'>
                  {notification.type !== 'attendance' && (
                    <Link
                      to={`/hrm/notifications/${notification.id}/edit`}
                      className='text-blue-500 hover:text-blue-700 mr-2'
                    >
                      <span className='material-symbols-outlined text-sm'>
                        edit
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className={`${isDeleting === notification.id ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                    disabled={isDeleting === notification.id}
                  >
                    {isDeleting === notification.id ? (
                      <span className='material-symbols-outlined text-sm animate-pulse'>
                        hourglass_empty
                      </span>
                    ) : (
                      <span className='material-symbols-outlined text-sm'>
                        delete
                      </span>
                    )}
                  </button>
                </div>
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
