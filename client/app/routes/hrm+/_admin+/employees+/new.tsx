import { useState } from 'react';
import { Link, useLoaderData, useLocation } from '@remix-run/react';

import { getRoles } from '~/services/role.server';
import EmployeeDetailForm from './_components/EmployeeDetailForm';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import Defer from '~/components/Defer';
import { createEmployee } from '~/services/employee.server';
import { toast } from 'react-toastify';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const action = async ({ request }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries()) as any;
        const user = await isAuthenticated(request);

        // Kiểm tra dữ liệu bắt buộc
        if (!data.employeeCode || !data.firstName || !data.lastName || !data.email || !data.role) {
          return {
            employee: null,
            toast: {
              message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
              type: 'error' as ToastType,
            },
          };
        }

        // Kiểm tra mật khẩu
        if (!data.password || data.password.length < 8) {
          return {
            employee: null,
            toast: {
              message: 'Mật khẩu phải có ít nhất 8 ký tự',
              type: 'error' as ToastType,
            },
          };
        }

        // Đảm bảo role là ObjectId
        if (data.role && typeof data.role === 'string' && !data.role.match(/^[0-9a-fA-F]{24}$/)) {
          console.error('Invalid role format:', data.role);
          return {
            employee: null,
            toast: {
              message: 'Role không hợp lệ. Vui lòng chọn quyền truy cập hợp lệ.',
              type: 'error' as ToastType,
            },
          };
        }

        // Log dữ liệu gửi lên để debug
        console.log('Form data before sending:', {
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          msisdn: data.msisdn,
          role: data.role,
          username: data.username || data.email, // Sử dụng email làm username nếu không có
          // Không log mật khẩu vì lý do bảo mật
          password: 'REDACTED'
        });

        const res = await createEmployee(data, user!);

        return {
          employee: res,
          toast: { 
            message: 'Thêm mới nhân sự thành công!', 
            type: 'success' as ToastType 
          },
          redirectTo: '/hrm/employees'
        };
      } catch (error: any) {
        console.error('Error creating employee:', error);
        
        // Xử lý lỗi từ API
        let errorMessage = 'Có lỗi xảy ra khi thêm nhân sự';
        
        if (error.message) {
          if (error.message.includes('Employee code already exists')) {
            errorMessage = 'Mã nhân viên đã tồn tại';
          } else if (error.message.includes('Email already exists')) {
            errorMessage = 'Email đã tồn tại trong hệ thống';
          } else if (error.message.includes('Phản hồi không hợp lệ')) {
            errorMessage = 'Lỗi từ server: Phản hồi không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'Lỗi từ server: Không thể xử lý dữ liệu. Vui lòng kiểm tra lại.';
          } else if (error.message.includes('Bad data')) {
            errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại định dạng dữ liệu.';
          } else {
            errorMessage = error.message;
          }
        }

        return {
          employee: null,
          toast: {
            message: errorMessage,
            type: 'error' as ToastType,
          },
        };
      }
    }

    default:
      return {
        employee: null,
        toast: { message: 'Method not allowed', type: 'error' as ToastType },
      };
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    return {
      roles: getRoles(user!).catch((e) => {
        console.error(e);
        return [];
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      roles: Promise.resolve([] as any[]),
    };
  }
};

export default function NewEmployee() {
  const { roles } = useLoaderData<typeof loader>();
  const [isChanged, setIsChanged] = useState(false);
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Thêm Nhân sự Mới</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='#' className='hover:text-blue-500 transition'>
              Nhân sự
            </a>
            <span className='mx-2'>/</span>
            <span>Nhân sự Mới</span>
          </div>
        </div>

        <div className='flex space-x-2'>
          <button
            className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn hủy bỏ?')) {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/hrm/employees';
              }
            }}
          >
            <span className='material-symbols-outlined text-sm mr-1'>
              cancel
            </span>
            Hủy
          </button>

          <button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form='employee-detail-form'
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Nhân sự
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
        <Defer resolve={roles}>
          {(data) => (
            <EmployeeDetailForm formId="employee-detail-form" roles={data} setIsChanged={setIsChanged} />
          )}
        </Defer>
      </div>

      {/* Bottom Action Buttons */}
      <div className='flex justify-between items-center'>
        <Link
          to='/hrm/employees'
          className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
        >
          <span className='material-symbols-outlined text-sm mr-1'>
            keyboard_return
          </span>
          Trở về Danh sách
        </Link>

        <div className='flex space-x-2'>
          {/* <button className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Bản nháp
          </button> */}
          <button
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
            type='submit'
            form='employee-detail-form'
            disabled={!isChanged}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu Nhân sự
          </button>
        </div>
      </div>
    </>
  );
}
