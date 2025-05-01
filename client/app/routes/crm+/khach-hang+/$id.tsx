import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import {
  LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
} from '@remix-run/node';

import { isAuthenticated } from '~/services/auth.server';
import {
  getCustomerById,
  getCustomerWithCaseServiceById,
} from '~/services/customer.server';
import { formatDate, calculateAge } from '~/utils';
import { getEmployees } from '~/services/employee.server';
import { fetcher } from '~/services';
import ContentHeader from '../_components/ContentHeader';
import CRMButton from '../_components/CRMButton';

// Action function để xử lý việc lưu thông tin khách hàng
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    return redirect('/login');
  }

  const { id } = params;
  if (!id) {
    return { error: 'Customer ID is required' };
  }

  try {
    const formData = await request.formData();

    // Prepare customer data
    const customerData = {
      fullName: formData.get('fullName'),
      dateOfBirth: formData.get('dateOfBirth'),
      gender: formData.get('gender'),
      parentName: formData.get('parentName'),
      parentDateOfBirth: formData.get('parentDateOfBirth'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      contactChannel: formData.get('contactChannel'),
      contactAccountName: formData.get('contactAccountName'),
    };

    try {
      // Sử dụng fetcher thay vì fetch trực tiếp
      await fetcher(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer: customerData,
        }),
        request: auth,
      });

      return {
        success: true,
        message: 'Cập nhật thông tin khách hàng thành công!',
        redirectTo: `/crm/khach-hang/${id}`,
      };
    } catch (apiError: any) {
      console.error('API Error:', apiError);

      // Kiểm tra xem lỗi có phải là 403 không
      if (apiError instanceof Response && apiError.status === 403) {
        return {
          error:
            'Bạn không có quyền chỉnh sửa thông tin khách hàng. Vui lòng liên hệ quản trị viên để được cấp quyền.',
        };
      }

      // Xử lý các lỗi khác
      return {
        error:
          apiError.statusText ||
          'Không thể cập nhật khách hàng. Vui lòng thử lại sau.',
      };
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'An error occurred while updating',
    };
  }
};

// Loader function to fetch data from API
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Xác thực người dùng trước khi tiếp tục
  const auth = await isAuthenticated(request);
  if (!auth) {
    return redirect('/crm/login');
  }

  try {
    // Lấy ID khách hàng từ URL
    const { id } = params;
    if (!id) {
      // Nếu không có ID, chuyển hướng về trang danh sách khách hàng
      return redirect('/hrm/khach-hang');
    }

    // Gọi song song các API để tăng tốc độ
    const customer = await getCustomerById(id, auth);
    // Trả về dữ liệu để component sử dụng với cache headers
    return {
      customer,
    };
  } catch (error) {
    console.error('Error loading customer data:', error);
    // Xử lý lỗi và trả về thông báo lỗi
    return {
      customer: null,
      error:
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi tải dữ liệu khách hàng',
    };
  }
};

// Hàm định dạng ngày sinh và tính tuổi
const formatDateAndAge = (dateString?: string) => {
  if (!dateString) return 'N/A';

  const formattedDate = formatDate(dateString, 'DD/MM/YYYY');
  const age = calculateAge(new Date(dateString));

  return `${formattedDate} (${age} tuổi)`;
};

export default function EmpCustomerDetail() {
  // Lấy dữ liệu từ loader
  const { customer, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Kiểm tra nếu có lỗi hoặc không có dữ liệu khách hàng
  if (error || !customer) {
    return (
      <>
        {/* <ContentHeader title='Chi Tiết Khách Hàng' /> */}
        <div className='mx-auto bg-white rounded-lg shadow-sm p-6'>
          <div className='text-center text-red-500 mb-4'>
            {error || 'Không tìm thấy thông tin khách hàng'}
          </div>
          <div className='flex justify-center'>
            <Link
              to='/crm/khach-hang'
              className='px-4 py-2 text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 transition'
            >
              Quay Lại Danh Sách
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ContentHeader
        title='Chi Tiết Khách Hàng'
        actionContent='Thêm ca dịch vụ'
        actionHandler={() =>
          navigate(`/crm/ca-dich-vu/new?customerId=${customer.id}`)
        }
      />

      <div className='mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Header - Hiển thị tên và tiến độ */}
        <div className='p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div className='flex items-center gap-3'>
            {/* Hiển thị tên khách hàng */}
            <div className='font-semibold text-2xl text-gray-800'>
              {customer.cus_fullName || 'N/A'}
            </div>
            {/* Hiển thị ID khách hàng */}
            <div className='text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-md'>
              #{customer.id?.substring(0, 8) || 'N/A'}
            </div>
          </div>
        </div>

        {/* Nội dung - Hiển thị thông tin chi tiết */}
        <div className='p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
            {/* Left Column - Customer Info */}
            <div className='space-y-5 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition'>
              <h2 className='text-lg font-medium text-gray-800 border-b border-gray-100 pb-2'>
                Thông tin Khách hàng
              </h2>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>
                  Ngày sinh
                </span>
                <span className='text-gray-700'>
                  {formatDateAndAge(customer?.cus_dateOfBirth)}
                </span>
              </div>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>
                  Giới tính
                </span>
                <span className='text-gray-700'>
                  {customer?.cus_gender === 'male'
                    ? 'Nam'
                    : customer?.cus_gender === 'female'
                      ? 'Nữ'
                      : customer?.cus_gender === 'other'
                        ? 'Khác'
                        : 'N/A'}
                </span>
              </div>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>
                  Thông tin phụ huynh
                </span>
                <span className='text-gray-700'>
                  {customer?.cus_parentName
                    ? `${customer.cus_parentName}, ${formatDateAndAge(customer.cus_parentDateOfBirth)}`
                    : 'Không có thông tin'}
                </span>
              </div>
            </div>

            {/* Right Column - Case Info */}
            <div className='space-y-5 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition'>
              <h2 className='text-lg font-medium text-gray-800 border-b border-gray-100 pb-2'>
                Thông tin liên hệ
              </h2>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>
                  Số điện thoại
                </span>
                <a
                  href={`tel:${customer?.cus_phone}`}
                  className='text-blue-500 hover:text-blue-600 transition'
                >
                  {customer?.cus_phone || 'N/A'}
                </a>
              </div>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>Email</span>
                <a
                  href={`mailto:${customer?.cus_email}`}
                  className='text-blue-500 hover:text-blue-600 transition break-all'
                >
                  {customer?.cus_email || 'N/A'}
                </a>
              </div>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                <span className='text-sm text-gray-500 font-medium'>
                  Kênh liên hệ
                </span>
                <span className='text-gray-700'>
                  {customer?.cus_contactChannel || 'Không có'}{' '}
                  {customer?.cus_contactAccountName
                    ? `(${customer.cus_contactAccountName})`
                    : ''}
                </span>
              </div>

              <div className='flex flex-col bg-gray-50 p-3 rounded-md md:col-span-2'>
                <span className='text-sm text-gray-500 font-medium'>
                  Địa chỉ
                </span>
                <span className='text-gray-700'>
                  {customer?.cus_address || 'Không có địa chỉ'}
                </span>
              </div>
            </div>
          </div>

          {/* Các nút thao tác */}
          <div className='flex flex-wrap gap-3 justify-end'>
            <CRMButton
              tagType='link'
              href={`/crm/ca-dich-vu/new?customerId=${customer.id}`}
            >
              Thêm Ca Dịch Vụ
            </CRMButton>

            <CRMButton
              tagType='link'
              href={`/crm/khach-hang/${customer.id}/edit`}
              color='yellow'
            >
              Chỉnh Sửa
            </CRMButton>
          </div>
        </div>
      </div>
    </>
  );
}
