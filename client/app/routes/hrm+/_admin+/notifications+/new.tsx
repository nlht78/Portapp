import { useState, useEffect } from 'react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import { isAuthenticated } from '~/services/auth.server';
import { createAdminNotification } from '~/services/notification.server';
import { getEmployees } from '~/services/employee.server';
import { toast } from 'react-toastify';
import { IEmployeeWithUserId } from '~/interfaces/employee.interface';
import { INotificationActionData } from '~/interfaces/notification.interface';
import HRMButton from '../../_components/HRMButton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      throw redirect('/hrm/login');
    }

    const employees = await getEmployees(auth).catch((e) => {
      console.error('Error loading employees:', e);
      return [];
    });

    return {
      users: employees,
      currentUser: auth.user,
    };
  } catch (error) {
    console.error('Error in loader:', error);
    return {
      users: [],
      currentUser: null,
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw redirect('/hrm/login');
  }

  try {
    const formData = await request.formData();
    const recipientIds = formData.getAll('recipientIds') as string[];

    if (!recipientIds.length) {
      return {
        success: false,
        message: 'Vui lòng chọn ít nhất một người nhận',
      };
    }

    const data = {
      title: formData.get('title') as string,
      type: formData.get('type') as
        | 'attendance'
        | 'system'
        | 'general'
        | 'work'
        | 'event',
      message: formData.get('message') as string,
      recipientIds: recipientIds,
      priority: formData.get('priority') as
        | 'low'
        | 'medium'
        | 'high'
        | 'urgent',
      metadata: {
        schedule: {
          date: formData.get('scheduleDate') as string,
          time: formData.get('scheduleTime') as string,
        },
      },
    };

    await createAdminNotification(data, auth);

    return {
      success: true,
      message: 'Tạo thông báo thành công!',
      redirectTo: '/hrm/notifications',
    };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      message: error.message || 'Tạo thông báo thất bại',
    };
  }
};

export default function NewNotification() {
  const { users, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<INotificationActionData>();
  const navigate = useNavigate();

  const [selectedRecipients, setSelectedRecipients] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [formData, setFormData] = useState({
    title: '',
    type: 'general',
    message: '',
    status: 'active',
    scheduleDate: '',
    scheduleTime: '',
    isScheduled: false,
  });

  useEffect(() => {
    if (actionData?.success && actionData?.redirectTo) {
      toast.success(actionData.message);
      navigate(actionData.redirectTo);
    } else if (actionData?.message && !actionData?.success) {
      toast.error(actionData.message);
    }
  }, [actionData, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addRecipient = (userId: string, userName: string) => {
    if (!selectedRecipients.some((r) => r.id === userId)) {
      setSelectedRecipients([
        ...selectedRecipients,
        { id: userId, name: userName },
      ]);
    }
  };

  const removeRecipient = (userId: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.id !== userId));
  };

  const filteredUsers = users.filter(
    (employee: IEmployeeWithUserId) =>
      `${employee.userId.usr_firstName} ${employee.userId.usr_lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.userId.usr_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h1 className='text-xl font-semibold'>Tạo thông báo mới</h1>
        <div className='flex space-x-2'>
          <HRMButton color='blue' type='submit' form='notificationForm'>
            <span className='material-symbols-outlined text-sm mr-1'>send</span>
            Gửi thông báo
          </HRMButton>

          <HRMButton color='transparent' type='button' className='font-normal'>
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu nháp
          </HRMButton>
        </div>
      </div>

      {/* Create Notification Form */}
      <Form
        id='notificationForm'
        method='post'
        className='bg-white rounded-lg shadow-md p-6 mb-6'
      >
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
                  <option value='alert'>Cảnh báo</option>
                  <option value='personal'>Cá nhân</option>
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
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Người nhận
              </label>
              <div className='border border-gray-300 rounded-md p-3 bg-gray-50'>
                <div className='flex flex-wrap items-center gap-2 mb-3'>
                  {selectedRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className='bg-blue-100 px-2 py-1 rounded-full text-xs text-blue-700 flex items-center'
                    >
                      {recipient.name}
                      <button
                        type='button'
                        onClick={() => removeRecipient(recipient.id)}
                        className='ml-1 cursor-pointer hover:text-blue-900'
                      >
                        <span className='material-symbols-outlined text-xs'>
                          close
                        </span>
                      </button>
                      <input
                        type='hidden'
                        name='recipientIds'
                        value={recipient.id}
                      />
                    </div>
                  ))}
                </div>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Tìm kiếm người nhận...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                    readOnly
                    onClick={() => setShowUserModal(true)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowUserModal(true)}
                    className='absolute right-2 top-2 text-gray-400 cursor-pointer hover:text-blue-500 transition'
                  >
                    <span className='material-symbols-outlined'>
                      person_add
                    </span>
                  </button>
                </div>
              </div>
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isScheduled: e.target.checked,
                    }))
                  }
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
                            {priority === 'low'
                              ? 'Ưu tiên thấp'
                              : priority === 'medium'
                                ? 'Ưu tiên trung bình'
                                : priority === 'high'
                                  ? 'Ưu tiên cao'
                                  : 'Ưu tiên khẩn cấp'}
                          </span>
                        </div>
                        <div className='text-xs text-gray-400'>Vừa xong</div>
                      </div>
                      <p className='text-sm mt-2 text-gray-600'>
                        {formData.message ||
                          '[Nội dung thông báo sẽ hiển thị ở đây]'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className='fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4'>
          <div className='relative bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col'>
            <div className='flex justify-between items-center p-4 border-b'>
              <h3 className='text-lg font-medium'>Chọn người nhận</h3>
              <button
                type='button'
                onClick={() => setShowUserModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>

            <div className='p-4 border-b'>
              <input
                type='text'
                placeholder='Tìm kiếm theo tên, email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='flex-1 overflow-y-auto p-4'>
              {filteredUsers.length > 0 ? (
                <ul className='divide-y divide-gray-200'>
                  {filteredUsers.map((employee: IEmployeeWithUserId) => (
                    <li key={employee.id} className='py-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500'>
                            {employee.userId.usr_firstName?.charAt(0) ||
                              employee.userId.usr_email?.charAt(0) ||
                              'U'}
                          </div>
                          <div className='ml-3'>
                            <p className='text-sm font-medium text-gray-900'>
                              {employee.userId.usr_firstName}{' '}
                              {employee.userId.usr_lastName}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {employee.userId.usr_email}
                            </p>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() =>
                            addRecipient(
                              employee.userId.id,
                              `${employee.userId.usr_firstName} ${employee.userId.usr_lastName}`,
                            )
                          }
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            selectedRecipients.some(
                              (r) => r.id === employee.userId.id,
                            )
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {selectedRecipients.some(
                            (r) => r.id === employee.userId.id,
                          )
                            ? 'Đã chọn'
                            : 'Chọn'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='py-8 text-center text-gray-500'>
                  Không tìm thấy người dùng nào phù hợp
                </div>
              )}
            </div>

            <div className='flex justify-end p-4 border-t'>
              <HRMButton
                color='blue'
                type='button'
                onClick={() => setShowUserModal(false)}
              >
                Xác nhận ({selectedRecipients.length} người nhận)
              </HRMButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
