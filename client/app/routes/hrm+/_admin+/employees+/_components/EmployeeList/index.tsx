import { Link, useFetcher, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useRef } from 'react';
import Defer from '~/components/Defer';
import { IEmployee } from '~/interfaces/employee.interface';

export default function EmployeeList({
  employees,
}: {
  employees: Promise<IEmployee[]>;
}) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const toastId = useRef<string | number | null>(null);

  useEffect(() => {
    // Handle loading state
    if (fetcher.state === 'submitting') {
      toastId.current = toast.loading('Đang xử lý...');
    }
    
    // Handle success or error based on fetcher state
    if (fetcher.state === 'idle' && toastId.current) {
      if (fetcher.data instanceof Error || (typeof fetcher.data === 'object' && fetcher.data && 'status' in fetcher.data)) {
        // Error case
        toast.update(toastId.current, {
          render: (fetcher.data as any).statusText || 'Có lỗi xảy ra',
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
      } else {
        // Success case
        toast.update(toastId.current, {
          render: 'Xóa nhân viên thành công',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      }
      toastId.current = null;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    className='mr-2 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                  />
                  Nhân sự
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Mã nhân viên
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Phòng ban
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Trạng thái
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Sđt
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            <Defer
              resolve={employees}
              fallback={
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-4 text-center text-sm text-gray-500'
                  >
                    Loading...
                  </td>
                </tr>
              }
            >
              {(data) => {
                if (data.length === 0)
                  return (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-4 text-center text-sm text-gray-500'
                      >
                        No employees found
                      </td>
                    </tr>
                  );

                return data.map((employee) => (
                  <tr
                    key={employee.id}
                    className='hover:bg-gray-50 transition-all'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          className='mr-3 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                        />

                        <Link
                          to={`/hrm/employees/${employee.id}`}
                          className='flex items-center flex-grow text-gray-900 hover:text-red-500'
                        >
                          <div className='flex-shrink-0 h-10 w-10'>
                            <img
                              className='h-10 w-10 rounded-full object-cover'
                              src={
                                employee.userId.usr_avatar?.img_url ||
                                'https://randomuser.me/api/portraits/lego/1.jpg'
                              }
                              alt=''
                            />
                          </div>
                          <div className='ml-4'>
                            <div className='text-sm font-medium'>
                              {employee.userId.usr_firstName}{' '}
                              {employee.userId.usr_lastName}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {employee.userId.usr_email}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {employee.employeeCode}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                        {employee.department}
                      </span>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.userId.usr_status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {employee.userId.usr_status || 'Unknown'}
                      </span>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {employee.userId.usr_msisdn || 'Not provided'}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <Link
                          to={`/hrm/employees/${employee.id}`}
                          className='text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-all'
                        >
                          <span className='material-symbols-outlined text-sm'>
                            visibility
                          </span>
                        </Link>

                        <Link
                          to={`/hrm/employees/${employee.id}/edit`}
                          className='text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50 transition-all'
                        >
                          <span className='material-symbols-outlined text-sm'>
                            edit
                          </span>
                        </Link>

                        <fetcher.Form
                          method="delete"
                          action={`/hrm/employees/${employee.id}`}
                          onSubmit={(e) => {
                            if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
                              e.preventDefault();
                            }
                          }}
                          className="inline"
                        >
                          <button
                            type="submit"
                            className='text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-all'
                          >
                            <span className='material-symbols-outlined text-sm'>
                              delete
                            </span>
                          </button>
                        </fetcher.Form>
                      </div>
                    </td>
                  </tr>
                ));
              }}
            </Defer>
          </tbody>
        </table>
      </div>
    </div>
  );
}
