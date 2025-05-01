import { useState, useEffect } from 'react';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigate } from '@remix-run/react';
import { isAuthenticated } from '~/services/auth.server';
import { getNotificationById, updateNotification } from '~/services/notification.server';
import { getEmployees } from '~/services/employee.server';
import { toast } from 'react-toastify';
import { INotification, INotificationResponse, INotificationActionData } from '~/interfaces/notification.interface';
import { IEmployeeWithUserId } from '~/interfaces/employee.interface';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      throw redirect('/hrm/login');
    }

    const { id } = params;
    if (!id) {
      throw redirect('/hrm/notifications');
    }

    const [notificationData, employeesData] = await Promise.all([
      getNotificationById(id, auth),
      getEmployees(auth).catch((e) => {
        console.error('Error loading employees:', e);
        return [];
      })
    ]);

    console.log("Notification API Response:", notificationData);
    
    const notification = notificationData as unknown as INotification;
    
    console.log("Recipient structure:", JSON.stringify(notification.recipientId, null, 2));

    return {
      notification,
      employees: employeesData,
      currentUser: auth.user
    };
  } catch (error) {
    console.error('Error in loader:', error);
    return redirect('/hrm/notifications');
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/hrm/login');
  }

  try {
    const { id } = params;
    if (!id) {
      throw new Error('Notification ID is required');
    }

    const formData = await request.formData();
    const recipientIds = formData.getAll('recipientIds') as string[];
    
    if (!recipientIds.length) {
      return { 
        success: false, 
        message: 'Vui lòng chọn ít nhất một người nhận' 
      };
    }

    const data = {
      title: formData.get('title') as string,
      type: formData.get('type') as 'attendance' | 'system' | 'general' | 'work' | 'event',
      message: formData.get('message') as string,
      recipientIds: recipientIds,
      metadata: {
        priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
        schedule: {
          date: formData.get('scheduleDate') as string,
          time: formData.get('scheduleTime') as string
        }
      }
    };

    await updateNotification(id, data, auth);
    
    return { 
      success: true,
      message: 'Cập nhật thông báo thành công!',
      redirectTo: '/hrm/notifications'
    };
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return { 
      success: false, 
      message: error.message || 'Cập nhật thông báo thất bại' 
    };
  }
};

export default function EditNotification() {
  const { notification, employees, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<INotificationActionData>();
  const navigate = useNavigate();
  
  console.log("Full notification data:", JSON.stringify(notification, null, 2));
  
  const [selectedRecipient, setSelectedRecipient] = useState<string>(notification?.recipientId?.id || '');
  const [priority, setPriority] = useState<string>(notification.metadata?.priority || 'medium');
  const [formData, setFormData] = useState({
    title: notification.title || '',
    type: notification.type || 'general',
    message: notification.message || '',
    scheduleDate: notification.metadata?.schedule?.date || '',
    scheduleTime: notification.metadata?.schedule?.time || '',
    isScheduled: !!(notification.metadata?.schedule?.date || notification.metadata?.schedule?.time)
  });

  useEffect(() => {
    if (actionData?.success && actionData?.redirectTo) {
      toast.success(actionData.message);
      navigate(actionData.redirectTo);
    } else if (actionData?.message && !actionData?.success) {
      toast.error(actionData.message);
    }
  }, [actionData, navigate]);

  useEffect(() => {
    if (notification && notification.recipientId) {
      setSelectedRecipient(notification.recipientId.id);
    }
  }, [notification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRecipient(e.target.value);
  };

  // Get the selected employee's name for display
  const getSelectedRecipientName = () => {
    if (!selectedRecipient) return '';
    
    const employee = employees.find((emp: IEmployeeWithUserId) => emp.userId.id === selectedRecipient);
    if (employee) {
      return `${employee.userId.usr_firstName} ${employee.userId.usr_lastName}`;
    }
    
    if (notification.recipientId && notification.recipientId.id === selectedRecipient) {
      return `${notification.recipientId.firstName} ${notification.recipientId.lastName}`;
    }
    
    return '';
  };

  return (
    <div className='flex-1 p-4 md:p-6 lg:ml-[240px] mt-4 lg:mt-0 overflow-y-auto'>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h1 className='text-xl font-semibold'>Chỉnh sửa thông báo</h1>
        <div className='flex space-x-2'>
          <button 
            type='submit'
            form='notificationForm'
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu thay đổi
          </button>
          <button 
            type='button'
            onClick={() => navigate(-1)}
            className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'
          >
            <span className='material-symbols-outlined text-sm mr-1'>close</span>
            Hủy
          </button>
        </div>
      </div>

      {/* Edit Notification Form */}
      <Form id='notificationForm' method='post' className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-6'>
            <div>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Tiêu đề thông báo
              </label>
              <input
                type='text'
                id='title'
                name='title'
                value={formData.title}
                onChange={handleInputChange}
                placeholder='Nhập tiêu đề thông báo'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
              />
            </div>

            <div>
              <label
                htmlFor='type'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Loại thông báo
              </label>
              <div className='relative'>
                <select
                  id='type'
                  name='type'
                  value={formData.type}
                  onChange={handleInputChange}
                  className='appearance-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                >
                  <option value='system'>Thông báo hệ thống</option>
                  <option value='work'>Công việc</option>
                  <option value='event'>Sự kiện</option>
                  <option value='general'>Thông báo chung</option>
                </select>
                <span className='material-symbols-outlined absolute right-2 top-2 text-gray-500 pointer-events-none'>
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor='priority'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Mức độ ưu tiên
              </label>
              <div className='flex space-x-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='priority'
                    value='low'
                    checked={priority === 'low'}
                    onChange={() => setPriority('low')}
                    className='h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Thấp</span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='priority'
                    value='medium'
                    checked={priority === 'medium'}
                    onChange={() => setPriority('medium')}
                    className='h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Trung bình</span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='priority'
                    value='high'
                    checked={priority === 'high'}
                    onChange={() => setPriority('high')}
                    className='h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Cao</span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='priority'
                    value='urgent'
                    checked={priority === 'urgent'}
                    onChange={() => setPriority('urgent')}
                    className='h-4 w-4 text-red-500 border-gray-300 focus:ring-red-500'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Khẩn cấp</span>
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor='message'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Nội dung thông báo
              </label>
              <textarea
                id='message'
                name='message'
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                placeholder='Nhập nội dung thông báo'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
              ></textarea>
            </div>
          </div>

          <div className='space-y-6'>
            <div>
              <label 
                htmlFor='recipientId'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Người nhận
              </label>
              <div className='relative'>
                <select
                  id='recipientId'
                  name='recipientIds'
                  value={selectedRecipient}
                  onChange={handleRecipientChange}
                  className='appearance-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                  required
                >
                  <option value=''>Chọn người nhận</option>
                  {employees.map((employee: IEmployeeWithUserId) => (
                    <option key={employee.userId.id} value={employee.userId.id}>
                      {employee.userId.usr_firstName} {employee.userId.usr_lastName} ({employee.userId.usr_email})
                    </option>
                  ))}
                </select>
                <span className='material-symbols-outlined absolute right-2 top-2 text-gray-500 pointer-events-none'>
                  expand_more
                </span>
              </div>
              {selectedRecipient && (
                <div className='mt-2 text-sm text-blue-600'>
                  Người nhận đã chọn: {getSelectedRecipientName()}
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Lên lịch thông báo
              </label>
              <div className='flex items-center mb-3'>
                <input
                  type='checkbox'
                  id='scheduleToggle'
                  name='isScheduled'
                  checked={formData.isScheduled}
                  onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                  className='h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500'
                />
                <label
                  htmlFor='scheduleToggle'
                  className='ml-2 text-sm text-gray-700'
                >
                  Gửi thông báo sau
                </label>
              </div>
              {formData.isScheduled && (
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      htmlFor='scheduleDate'
                      className='block text-sm text-gray-500 mb-1'
                    >
                      Ngày
                    </label>
                    <input
                      type='date'
                      id='scheduleDate'
                      name='scheduleDate'
                      value={formData.scheduleDate}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='scheduleTime'
                      className='block text-sm text-gray-500 mb-1'
                    >
                      Giờ
                    </label>
                    <input
                      type='time'
                      id='scheduleTime'
                      name='scheduleTime'
                      value={formData.scheduleTime}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Xem trước thông báo
              </label>
              <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
                <div className='bg-blue-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
                  <div className='flex p-4'>
                    <div className='shrink-0 mr-4'>
                      <div className='h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center'>
                        <span className='material-symbols-outlined text-blue-500'>
                          notifications
                        </span>
                      </div>
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-medium text-sm'>
                            {formData.title || '[Tiêu đề thông báo]'}
                          </h3>
                          <span className='text-xs text-blue-500 font-medium'>
                            {priority === 'low' ? 'Ưu tiên thấp' :
                             priority === 'medium' ? 'Ưu tiên trung bình' :
                             priority === 'high' ? 'Ưu tiên cao' :
                             'Ưu tiên khẩn cấp'}
                          </span>
                        </div>
                        <div className='text-xs text-gray-400'>Vừa xong</div>
                      </div>
                      <p className='text-sm mt-2 text-gray-600'>
                        {formData.message || '[Nội dung thông báo sẽ hiển thị ở đây]'}
                      </p>
                      {selectedRecipient && (
                        <div className='text-xs mt-1 text-gray-500'>
                          Gửi đến: {getSelectedRecipientName()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
} 