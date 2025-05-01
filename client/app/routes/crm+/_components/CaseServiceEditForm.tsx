import { useFetcher, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ICaseService } from '~/interfaces/caseService.interface';
import { IEmployee } from '~/interfaces/employee.interface';
import Select from '~/widgets/Select';
import TextInput from '../../../components/TextInput';
import { format } from 'date-fns';
import CRMButton from './CRMButton';
import { action } from '../ca-dich-vu+/$id_.edit';
import { ICustomer } from '~/interfaces/customer.interface';

export default function CaseServiceServiceEditForm({
  caseService,
  employees,
}: {
  caseService: ICaseService;
  employees: IEmployee[];
}) {
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressValue, setProgressValue] = useState(
    caseService?.case_progressPercent || 0,
  );
  const [price, setPrice] = useState(caseService?.case_price || 0);
  const [amountPaid, setAmountPaid] = useState(
    caseService?.case_amountPaid || 0,
  );
  const [statusFlags, setStatusFlags] = useState({
    isScanned: caseService?.case_processStatus?.isScanned || false,
    isFullInfo: caseService?.case_processStatus?.isFullInfo || false,
    isAnalysisSent: caseService?.case_processStatus?.isAnalysisSent || false,
    isPdfExported: caseService?.case_processStatus?.isPdfExported || false,
    isFullyPaid: caseService?.case_processStatus?.isFullyPaid || false,
    isSoftFileSent: caseService?.case_processStatus?.isSoftFileSent || false,
    isPrinted: caseService?.case_processStatus?.isPrinted || false,
    isPhysicalCopySent:
      caseService?.case_processStatus?.isPhysicalCopySent || false,
    isDeepConsulted: caseService?.case_processStatus?.isDeepConsulted || false,
  });

  // Tự động tính tiến độ dựa trên các trạng thái
  useEffect(() => {
    const completedSteps = Object.values(statusFlags).filter(Boolean).length;
    const totalSteps = Object.keys(statusFlags).length;
    const calculatedProgress =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    setProgressValue(calculatedProgress);
  }, [statusFlags]);

  // Xử lý thay đổi trạng thái
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setStatusFlags((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const toastIdRef = useRef<any>(null);

  // Xử lý thông báo và chuyển hướng
  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        setIsSubmitting(true);
        toastIdRef.current = toast.loading('Loading...', {
          autoClose: false,
        });
        break;

      case 'idle':
        const actionData = fetcher.data;
        if (actionData?.success && actionData?.message) {
          toast.update(toastIdRef.current, {
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            render: actionData.message,
            type: 'success',
            isLoading: false,
          });
          // if (actionData.redirectTo) {
          //   navigate(actionData.redirectTo);
          // }
        } else if (!actionData?.success) {
          toast.update(toastIdRef.current, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            render: actionData?.message,
            type: 'error',
            isLoading: false,
          });
        }
        setIsSubmitting(false);
        break;
    }
  }, [fetcher.state]);

  // Xử lý khi hủy chỉnh sửa
  const handleCancel = () => {
    navigate(`/crm/ca-dich-vu/${caseService.id}`);
  };

  const { case_customerId: customer } = caseService;

  return (
    <fetcher.Form method='PUT'>
      <div className='mx-auto bg-white rounded-t-lg shadow-sm overflow-hidden'>
        {/* Two column details */}
        <div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Left Column - caseServiceService Info */}
            <div className='bg-white h-full border border-gray-200 rounded-md p-5 shadow-sm'>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-medium text-gray-800 mb-4'>
                  Thông tin khách hàng
                </h2>

                <CRMButton
                  tagType='link'
                  href={`/crm/khach-hang/${customer.id}/edit`}
                >
                  Sửa thông tin khách hàng
                </CRMButton>
              </div>

              <div className='space-y-4'>
                <div className='flex flex-col'>
                  <TextInput
                    label='Họ tên'
                    placeholder='Nhập họ tên khách hàng'
                    defaultValue={customer?.cus_fullName || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Ngày sinh'
                    defaultValue={format(
                      customer.cus_dateOfBirth || new Date(),
                      'dd/MM/yyyy',
                    )}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Giới tính'
                    defaultValue={customer.cus_gender || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Tên phụ huynh'
                    defaultValue={customer.cus_parentName || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Ngày sinh phụ huynh'
                    defaultValue={format(
                      customer.cus_parentDateOfBirth || new Date(),
                      'dd/MM/yyyy',
                    )}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Số điện thoại'
                    defaultValue={customer.cus_phone || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Email'
                    defaultValue={customer.cus_email || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Địa chỉ'
                    defaultValue={customer.cus_address || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Kênh liên hệ'
                    defaultValue={customer.cus_contactChannel || ''}
                    disabled
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Tên tài khoản liên hệ'
                    defaultValue={customer.cus_contactAccountName || ''}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Right Column - caseService Info */}
            <div className='bg-white border border-gray-200 rounded-md p-5 shadow-sm'>
              <h2 className='text-lg font-medium text-gray-800 mb-4'>
                Thông tin dịch vụ
              </h2>

              <div className='space-y-4'>
                <div className='flex flex-col'>
                  <TextInput
                    label='Địa điểm sự kiện'
                    id='eventLocation'
                    name='eventLocation'
                    type='text'
                    placeholder='Nhập địa điểm sự kiện'
                    defaultValue={caseService?.case_eventLocation || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Địa điểm chốt scan'
                    id='scanLocation'
                    name='scanLocation'
                    type='text'
                    placeholder='Nhập địa điểm chốt scan'
                    defaultValue={caseService?.case_scanLocation || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Đối tác / Nguồn khách hàng'
                    id='partner'
                    name='partner'
                    type='text'
                    placeholder='Nhập tên đối tác / nguồn khách hàng'
                    defaultValue={caseService?.case_partner || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Ngày hẹn'
                    id='appointmentDate'
                    name='appointmentDate'
                    type='datetime-local'
                    defaultValue={
                      caseService?.case_appointmentDate
                        ? new Date(caseService.case_appointmentDate)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Giá'
                    id='price'
                    name='price'
                    type='number'
                    min='0'
                    step='1000'
                    placeholder='0'
                    value={price}
                    onChange={(val) => {
                      const value = parseFloat(val);
                      if (!isNaN(value)) {
                        setPrice(value);
                        setStatusFlags((prev) => ({
                          ...prev,
                          isFullyPaid: amountPaid >= value,
                        }));
                      }
                    }}
                  />
                </div>

                <div className='flex flex-col'>
                  <Select
                    label='Phương thức thanh toán'
                    id='paymentMethod'
                    name='paymentMethod'
                    defaultValue={caseService?.case_paymentMethod || ''}
                    className='w-full'
                  >
                    <option value='' disabled>
                      Chọn phương thức thanh toán
                    </option>
                    <option value='Tiền mặt'>Tiền mặt</option>
                    <option value='Chuyển khoản'>Chuyển khoản</option>
                    <option value='Cà thẻ'>Cà thẻ</option>
                  </Select>
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Số tiền đã thanh toán'
                    id='amountPaid'
                    name='amountPaid'
                    type='number'
                    min='0'
                    step='1000'
                    placeholder='0'
                    value={amountPaid}
                    onChange={(val) => {
                      const value = parseFloat(val);
                      if (!isNaN(value)) {
                        setAmountPaid(value);
                        setStatusFlags((prev) => ({
                          ...prev,
                          isFullyPaid: value >= price,
                        }));
                      }
                    }}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Số tiền còn lại'
                    type='text'
                    placeholder='0'
                    readOnly
                    value={price - amountPaid}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Staff Card */}
        <div className='bg-white border border-gray-200 rounded-md p-5 shadow-sm mb-8 mt-6'>
          <h2 className='text-lg font-medium text-gray-800 mb-4'>
            Nhân viên phụ trách
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex flex-col'>
              <div className='relative'>
                <Select
                  id='consultantId'
                  name='consultantId'
                  label='Tư vấn viên'
                  className='w-full'
                  defaultValue={caseService.case_consultantId?.id || ''}
                >
                  <option value='' disabled>
                    Chọn tư vấn viên
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee?.employeeCode} -{' '}
                      {employee?.userId?.usr_lastName}{' '}
                      {employee?.userId?.usr_firstName}
                    </option>
                  ))}
                </Select>
                <span className='material-symbols-outlined text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                  person
                </span>
              </div>
            </div>

            <div className='flex flex-col'>
              <div className='relative'>
                <Select
                  id='fingerprintTakerId'
                  name='fingerprintTakerId'
                  label='Nhân viên lấy vân tay'
                  className='w-full'
                  defaultValue={caseService.case_fingerprintTakerId?.id || ''}
                >
                  <option value='' disabled>
                    Chọn nhân viên lấy vân tay
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee?.employeeCode} -{' '}
                      {employee?.userId?.usr_firstName}{' '}
                      {employee?.userId?.usr_lastName}
                    </option>
                  ))}
                </Select>
                <span className='material-symbols-outlined text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                  fingerprint
                </span>
              </div>
            </div>

            <div className='flex flex-col'>
              <div className='relative'>
                <Select
                  id='mainCounselorId'
                  name='mainCounselorId'
                  label='Tham vấn viên'
                  className='w-full'
                  defaultValue={caseService.case_mainCounselorId?.id || ''}
                >
                  <option value='' disabled>
                    Chọn tham vấn viên
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee?.employeeCode} -{' '}
                      {employee?.userId?.usr_firstName}{' '}
                      {employee?.userId?.usr_lastName}
                    </option>
                  ))}
                </Select>
                <span className='material-symbols-outlined text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                  psychology
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className='bg-white border border-gray-200 rounded-md p-5 shadow-sm mb-8'>
          <h2 className='text-lg font-medium text-gray-800 mb-4'>
            Trạng thái xử lý
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isScanned'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isScanned}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã scan</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isFullInfo'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isFullInfo}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đầy đủ thông tin</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isAnalysisSent'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isAnalysisSent}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã gửi phân tích</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isPdfExported'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isPdfExported}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã xuất PDF</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isSoftFileSent'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isSoftFileSent}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã gửi file mềm</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isPrinted'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isPrinted}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã in & gửi về văn phòng</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isPhysicalCopySent'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isPhysicalCopySent}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã gửi bản cứng</span>
            </label>

            <label className='flex items-center cursor-pointer space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors'>
              <input
                type='checkbox'
                name='isDeepConsulted'
                className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
                checked={statusFlags.isDeepConsulted}
                onChange={handleStatusChange}
              />
              <span className='text-gray-700'>Đã tư vấn sâu</span>
            </label>

            <input
              type='checkbox'
              name='isFullyPaid'
              className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
              checked={amountPaid >= price}
              hidden
            />
          </div>
        </div>

        {/* Progress */}
        <div className='bg-white border border-gray-200 rounded-t-md p-5'>
          <div className='flex items-center mb-4'>
            <h2 className='text-lg font-medium text-gray-800'>Tiến độ xử lý</h2>
            <span className='ml-3 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full'>
              Tự động tính toán
            </span>
          </div>

          <div className='space-y-6'>
            <div className='flex flex-col'>
              <div className='flex items-center justify-between mb-2 text-sm text-gray-700'>
                <span>Phần trăm tiến độ</span>
                <div className='flex items-center gap-2'>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      progressValue < 33
                        ? 'bg-red-500'
                        : progressValue < 66
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  ></span>
                  <span className='font-medium'>{progressValue}%</span>
                </div>
              </div>

              <div className='flex flex-col gap-6 relative bg-gray-50 p-4 rounded-lg border border-gray-200'>
                <div className='flex justify-between text-xs text-gray-500 px-2 mb-1'>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>

                <div className='relative w-full h-5 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                      progressValue < 33
                        ? 'bg-red-500'
                        : progressValue < 66
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${progressValue}%` }}
                  ></div>
                </div>

                <div className='flex justify-between px-2 gap-4 pt-1'>
                  <div className='text-center'>
                    <span className='block text-xs font-medium text-gray-700'>
                      Mới bắt đầu
                    </span>
                    <span className='text-xs text-gray-500'>0-32%</span>
                  </div>
                  <div className='text-center'>
                    <span className='block text-xs font-medium text-gray-700'>
                      Đang xử lý
                    </span>
                    <span className='text-xs text-gray-500'>33-65%</span>
                  </div>
                  <div className='text-center'>
                    <span className='block text-xs font-medium text-gray-700'>
                      Gần hoàn thành
                    </span>
                    <span className='text-xs text-gray-500'>66-99%</span>
                  </div>
                  <div className='text-center'>
                    <span className='block text-xs font-medium text-gray-700'>
                      Hoàn thành
                    </span>
                    <span className='text-xs text-gray-500'>100%</span>
                  </div>
                </div>

                <p className='text-xs text-gray-500 border-t border-gray-200 pt-3 mt-2'>
                  <span className='text-blue-600 font-medium'>Lưu ý:</span> Tiến
                  độ được tính tự động dựa trên số trạng thái đã hoàn thành ở
                  phần "Trạng Thái Xử Lý" ở trên.
                  <br />
                  <span className='inline-block mt-1 italic'>
                    Tiến độ = (Số trạng thái đã hoàn thành / Tổng số trạng thái)
                    × 100%
                  </span>
                </p>
              </div>
            </div>

            <div className='flex flex-col'>
              <label
                htmlFor='progressNote'
                className='text-sm font-medium text-gray-700 mb-1'
              >
                Ghi chú tiến độ
              </label>
              <textarea
                id='progressNote'
                name='progressNote'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
                placeholder='Nhập ghi chú về tiến độ xử lý'
                rows={4}
                defaultValue={caseService?.case_progressNote || ''}
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className='sticky bottom-0 right-0 z-50 bg-white border border-gray-200 px-6 py-2 sm:px-8 rounded-b'>
        <div className='flex flex-wrap justify-end gap-3 max-w-6xl mx-auto'>
          <button
            type='button'
            onClick={handleCancel}
            className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition'
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type='reset'
            className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition'
            disabled={isSubmitting}
          >
            Đặt lại
          </button>
          <button
            type='submit'
            className='px-4 py-2 text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 transition flex items-center gap-2'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </fetcher.Form>
  );
}
