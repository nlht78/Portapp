import {
  useLoaderData,
  useNavigate,
  Link,
  useSearchParams,
  Form,
  useActionData,
  useSubmit,
} from '@remix-run/react';
import {
  LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
} from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { formatDate, formatCurrency, calculateAge } from '~/utils';
// import ContentHeader from '../_components/ContentHeader';
import { useState, useEffect } from 'react';
import { getEmployees } from '~/services/employee.server';
import { IEmployee } from '~/interfaces/employee.interface';
import Select from '~/widgets/Select';
import { fetcher } from '~/services';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCaseById } from '~/services/caseService.server';

// Action function để xử lý việc lưu thông tin khách hàng
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    return redirect('/login');
  }

  const { id } = params;
  if (!id) {
    return { error: 'CaseService ID is required' };
  }

  try {
    const formData = await request.formData();
    // Prepare case service data
    const caseServiceData = {
      price: Number(formData.get('price')),
      amountPaid: Number(formData.get('amountPaid')),
      paymentMethod: formData.get('paymentMethod'),
      progressPercent: Number(formData.get('progressPercent')),
      appointmentDate: formData.get('appointmentDate'),
      consultantId: formData.get('consultantId'),
      fingerprintTakerId: formData.get('fingerprintTakerId'),
      mainCounselorId: formData.get('mainCounselorId'),
      scanLocation: formData.get('scanLocation'),
      progressNote: formData.get('progressNote'),
      partner: formData.get('partner'),
      eventLocation: formData.get('eventLocation'),
      processStatus: {
        isScanned: formData.get('isScanned') === 'on',
        isFullInfo: formData.get('isFullInfo') === 'on',
        isAnalysisSent: formData.get('isAnalysisSent') === 'on',
        isPdfExported: formData.get('isPdfExported') === 'on',
        isFullyPaid: formData.get('isFullyPaid') === 'on',
        isSoftFileSent: formData.get('isSoftFileSent') === 'on',
        isPrinted: formData.get('isPrinted') === 'on',
        isPhysicalCopySent: formData.get('isPhysicalCopySent') === 'on',
        isDeepConsulted: formData.get('isDeepConsulted') === 'on',
      },
    };

    try {
      // Sử dụng fetcher thay vì fetch trực tiếp
      await fetcher(`/ca-dich-vu/${id}/with-case-service`, {
        method: 'PUT',
        body: JSON.stringify({
          caseService: caseServiceData,
        }),
        request: auth,
      });

      return {
        success: true,
        message: 'Cập nhật thông tin khách hàng thành công!',
        redirectTo: `/crm/ca-dich-vu/${id}`,
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
    console.error('Error updating caseService:', error);
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
      return redirect('/crm/ca-dich-vu');
    }

    // Gọi song song các API để tăng tốc độ
    const [caseServiceData, employees] = await Promise.all([
      getCaseById(id, auth),
      getEmployees(auth),
    ]);
    console.log('loader case service data: ', caseServiceData);
    // Kiểm tra xem có dữ liệu hợp lệ không
    if (!caseServiceData) {
      return {
        caseService: null,
        employees: [],
        error: 'Không thể tải thông tin khách hàng. Vui lòng thử lại sau.',
      };
    }

    // Trả về dữ liệu để component sử dụng với cache headers
    return {
      caseService: caseServiceData,
      employees,
    };
  } catch (error) {
    console.error('Error loading caseService data:', error);
    // Xử lý lỗi và trả về thông báo lỗi
    return {
      caseService: null,
      employees: [],
      error:
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi tải dữ liệu khách hàng',
    };
  }
};

// Component hiển thị trạng thái quy trình
const StatusItem = ({ active, label }: { active: boolean; label: string }) => (
  <div className='bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow transition flex flex-col items-center text-center'>
    <div
      className={`h-8 w-8 rounded-full ${active ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center mb-2`}
    >
      <span
        className={`material-symbols-outlined ${active ? 'text-green-600' : 'text-gray-400'}`}
      >
        {active ? 'check_circle' : 'remove'}
      </span>
    </div>
    <span className='text-sm text-gray-700'>{label}</span>
  </div>
);

export default function EmpCaseServiceDetail() {
  // Lấy dữ liệu từ loader
  const { caseService, employees, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // // Kiểm tra nếu có lỗi hoặc không có dữ liệu khách hàng
  if (error || !caseService) {
    return (
      <>
        {/* <ContentHeader title='Chi Tiết Khách Hàng' /> */}
        <div className='mx-auto bg-white rounded-lg shadow-sm p-6'>
          <div className='text-center text-red-500 mb-4'>
            {error || 'Không tìm thấy thông tin khách hàng'}
          </div>
          <div className='flex justify-center'>
            <button
              onClick={() => navigate('/crm/ca-dich-vu')}
              className='px-4 py-2 text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 transition'
            >
              Quay Lại Danh Sách
            </button>
          </div>
        </div>
      </>
    );
  }
  // // Hiển thị thông tin nhân viên từ dữ liệu API
  const getStaffDisplay = (
    staffId?: string,
    staffName?: string,
    staffData?: any,
  ) => {
    // Nếu có dữ liệu chi tiết nhân viên từ API (đã được populate)
    if (staffData) {
      return staffData.fullName || `${staffData.employeeCode}`;
    }

    // Nếu có tên nhân viên nhưng không có ID (trường hợp import)
    if (staffName && !staffId) {
      return staffName;
    }

    // Nếu có ID nhưng không có tên
    if (staffId && !staffName) {
      return `ID: ${staffId}`;
    }

    // Nếu có cả ID và tên
    if (staffId && staffName) {
      return `${staffName} (ID: ${staffId})`;
    }

    // Nếu không có dữ liệu gì
    return 'Chưa chỉ định';
  };

  const {
    case_processStatus: processStatus = {} as Record<string, boolean>,
    case_customerId: customer,
  } = caseService;
  console.log(processStatus);
  const progressPercent = Math.round(
    (Object.values(processStatus).reduce(
      (acc, status) => acc + (status ? 1 : 0),
      0 as number,
    ) /
      Object.keys(processStatus).length) *
      100,
  );

  return (
    <>
      <div className='mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Header - Hiển thị tên và tiến độ */}
        <div className='p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div className='flex items-center gap-3'>
            {/* Hiển thị tên khách hàng */}
            <div className='font-semibold text-2xl text-gray-800'>
              {`${customer.cus_fullName}`}
            </div>
            {/* Hiển thị ID khách hàng */}
            <div className='text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-md'>
              #{caseService.id?.substring(0, 8) || 'N/A'}
            </div>
          </div>

          {/* Hiện thị biểu đồ tiến độ tròn */}
          <div className='relative w-14 h-14 flex items-center justify-center'>
            <div className='absolute inset-0 rounded-full bg-gray-300 overflow-hidden'>
              <div
                className='absolute bottom-0 left-0 w-full bg-blue-500'
                style={{ height: `${progressPercent}%` }}
              ></div>
            </div>
            <div className='absolute inset-0 rounded-full border-4 border-gray-100'></div>
            <span className='relative text-sm font-medium text-white'>
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Nội dung - Hiển thị thông tin chi tiết */}
        <div className='p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
            {/* Left Column - CaseService Info */}
            <div className='space-y-5 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition'>
              <h2 className='text-lg font-medium text-gray-800 border-b border-gray-100 pb-2'>
                Thông tin Khách hàng
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                    {customer.cus_gender === 'male'
                      ? 'Nam'
                      : customer.cus_gender === 'female'
                        ? 'Nữ'
                        : customer.cus_gender === 'other'
                          ? 'Khác'
                          : 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Thông tin phụ huynh
                  </span>
                  <span className='text-gray-700'>
                    {customer.cus_parentName
                      ? `${customer.cus_parentName}, ${formatDateAndAge(customer.cus_parentDateOfBirth)}`
                      : 'Không có thông tin'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Số điện thoại
                  </span>
                  <a
                    href={`tel:${customer.cus_phone}`}
                    className='text-blue-500 hover:text-blue-600 transition'
                  >
                    {customer.cus_phone || 'N/A'}
                  </a>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Email
                  </span>
                  <a
                    href={`mailto:${customer.cus_email}`}
                    className='text-blue-500 hover:text-blue-600 transition break-all'
                  >
                    {customer.cus_email || 'N/A'}
                  </a>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Kênh liên hệ
                  </span>
                  <span className='text-gray-700'>
                    {customer.cus_contactChannel || 'Không có'}{' '}
                    {customer.cus_contactAccountName
                      ? `(${customer.cus_contactAccountName})`
                      : ''}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md md:col-span-2'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Địa chỉ
                  </span>
                  <span className='text-gray-700'>
                    {customer.cus_address || 'Không có địa chỉ'}
                  </span>
                </div>
              </div>
              {/* Next: "Add contact preference options" */}
            </div>

            {/* Right Column - Case Info */}

            <div className='space-y-5 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition'>
              <h2 className='text-lg font-medium text-gray-800 border-b border-gray-100 pb-2'>
                Ca dịch vụ
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Nguồn khách
                  </span>
                  <span className='text-gray-700'>
                    {caseService?.case_partner || 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Địa điểm sự kiện
                  </span>
                  <span className='text-gray-700'>
                    {caseService?.case_eventLocation || 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Địa điểm chốt
                  </span>
                  <span className='text-gray-700'>
                    {caseService?.case_scanLocation || 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Người Demo
                  </span>
                  <span className='text-gray-700'>
                    {getStaffDisplay(
                      caseService?.case_consultantId?.id,
                      caseService?.case_consultantName,
                      caseService?.case_consultantId,
                    )}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Người lấy dấu
                  </span>
                  <span className='text-gray-700'>
                    {getStaffDisplay(
                      caseService?.case_fingerprintTakerId?.id,
                      caseService?.case_fingerprintTakerName,
                      caseService?.case_fingerprintTakerId,
                    )}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Người tham vấn
                  </span>
                  <span className='text-gray-700 font-medium'>
                    {getStaffDisplay(
                      caseService?.case_mainCounselorId?.id,
                      caseService?.case_counselorName,
                      caseService?.case_mainCounselorId,
                    )}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Ngày hẹn
                  </span>
                  <span className='text-gray-700'>
                    {caseService?.case_appointmentDate
                      ? formatDate(
                          caseService.case_appointmentDate,
                          'dddd, DD/MM/YYYY • HH:mm',
                        )
                      : 'Chưa đặt lịch hẹn'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>Giá</span>
                  <span className='text-gray-700'>
                    {caseService?.case_price !== undefined
                      ? formatCurrency(caseService.case_price)
                      : 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Đã thanh toán
                  </span>
                  <span className='text-gray-700'>
                    {caseService?.case_amountPaid !== undefined
                      ? formatCurrency(caseService.case_amountPaid)
                      : 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Còn lại
                  </span>
                  <span className='text-gray-700 font-medium text-red-500'>
                    {caseService?.case_debt !== undefined
                      ? formatCurrency(caseService.case_debt)
                      : 'N/A'}
                  </span>
                </div>

                <div className='flex flex-col bg-gray-50 p-3 rounded-md'>
                  <span className='text-sm text-gray-500 font-medium'>
                    Hình thức thanh toán
                  </span>
                  <span className='text-gray-700 font-medium'>
                    {caseService?.case_paymentMethod || 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Next: "Add case timeline visualization" */}
            </div>
          </div>

          {/* Lưới trạng thái - Hiển thị từng trạng thái quy trình */}
          <div className='mb-8'>
            <h2 className='text-lg font-medium text-gray-800 mb-4'>
              Trạng thái
            </h2>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
              <StatusItem active={!!processStatus?.isScanned} label='Đã Scan' />
              <StatusItem
                active={!!processStatus?.isFullInfo}
                label='Đủ thông tin'
              />
              <StatusItem
                active={!!processStatus?.isAnalysisSent}
                label='Gửi phân tích'
              />
              <StatusItem
                active={!!processStatus?.isPdfExported}
                label='Xuất PDF'
              />
              <StatusItem
                active={!!processStatus?.isFullyPaid}
                label='Thanh toán đủ'
              />
              <StatusItem
                active={!!processStatus?.isSoftFileSent}
                label='Gửi file mềm'
              />
              <StatusItem
                active={!!processStatus?.isPrinted}
                label='In bản cứng'
              />
              <StatusItem
                active={!!processStatus?.isPhysicalCopySent}
                label='Gửi bản cứng'
              />
              <StatusItem
                active={!!processStatus?.isDeepConsulted}
                label='Tham vấn'
              />
            </div>
          </div>

          {/* Ghi chú tiến độ */}
          <div className='mb-8'>
            <h2 className='text-lg font-medium text-gray-800 mb-4'>Ghi chú</h2>
            <div className='bg-white border border-gray-200 rounded-md p-4 shadow-sm'>
              <p className='text-gray-700'>
                {caseService?.case_progressNote || 'Không có ghi chú'}
              </p>
            </div>
          </div>

          {/* Các nút thao tác */}
          <div className='flex flex-wrap gap-3 justify-end'>
            <button
              className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={!processStatus?.isPdfExported}
            >
              Xuất PDF
            </button>
            <button
              className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={!processStatus?.isFullyPaid}
            >
              Gửi File Mềm
            </button>

            <button
              onClick={() => navigate(`/crm/ca-dich-vu/${caseService.id}/edit`)}
              className='px-4 py-2 text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 transition'
            >
              Chỉnh Sửa
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hàm định dạng ngày sinh và tính tuổi
const formatDateAndAge = (dateString?: string) => {
  if (!dateString) return 'N/A';

  const formattedDate = formatDate(dateString, 'DD/MM/YYYY');
  const age = calculateAge(new Date(dateString));

  return `${formattedDate} (${age} tuổi)`;
};
