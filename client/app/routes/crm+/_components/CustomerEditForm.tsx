import { useFetcher, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import TextInput from '~/components/TextInput';
import { ICustomer } from '~/interfaces/customer.interface';
import Select from '~/widgets/Select';
import { action } from '../khach-hang+/$id_.edit';
import CRMButton from './CRMButton';

export default function CustomerEditForm({
  customer,
}: {
  customer: ICustomer;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetcher = useFetcher<typeof action>();
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
    navigate(`/crm/khach-hang/${customer.id}`);
  };

  return (
    <fetcher.Form method='PUT'>
      <div className='mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Two column details */}
        <div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Left Column - Customer Info */}
            <div className='bg-white h-full border border-gray-200 rounded-md p-5 shadow-sm'>
              <h2 className='text-lg font-medium text-gray-800 mb-4'>
                Thông tin khách hàng
              </h2>

              <div className='space-y-4'>
                <div className='flex flex-col'>
                  <TextInput
                    label='Họ tên'
                    id='fullName'
                    name='fullName'
                    type='text'
                    placeholder='Nhập họ tên khách hàng'
                    autoFocus
                    defaultValue={customer?.cus_fullName}
                    required
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Ngày sinh'
                    id='dateOfBirth'
                    name='dateOfBirth'
                    type='date'
                    defaultValue={
                      customer?.cus_dateOfBirth
                        ? new Date(customer.cus_dateOfBirth)
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                  />
                </div>

                <div className='flex flex-col'>
                  <Select
                    label='Giới tính'
                    id='gender'
                    name='gender'
                    className='w-full'
                    defaultValue={customer?.cus_gender || ''}
                  >
                    <option value=''>Chọn giới tính</option>
                    <option value='male'>Nam</option>
                    <option value='female'>Nữ</option>
                    <option value='other'>Khác</option>
                  </Select>
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Tên phụ huynh'
                    id='parentName'
                    name='parentName'
                    type='text'
                    placeholder='Nhập tên phụ huynh'
                    defaultValue={customer?.cus_parentName || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Ngày sinh phụ huynh'
                    id='parentDateOfBirth'
                    name='parentDateOfBirth'
                    type='date'
                    defaultValue={
                      customer?.cus_parentDateOfBirth
                        ? new Date(customer.cus_parentDateOfBirth)
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Case Info */}
            <div className='bg-white border border-gray-200 rounded-md p-5 shadow-sm'>
              <h2 className='text-lg font-medium text-gray-800 mb-4'>
                Thông tin liên hệ
              </h2>

              <div className='space-y-4'>
                <div className='flex flex-col'>
                  <TextInput
                    label='Số điện thoại'
                    id='phone'
                    name='phone'
                    type='tel'
                    placeholder='Ví dụ: 0912345678'
                    defaultValue={customer?.cus_phone || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Email'
                    id='email'
                    name='email'
                    type='email'
                    placeholder='khachhang@example.com'
                    defaultValue={customer?.cus_email || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Địa chỉ'
                    id='address'
                    name='address'
                    type='text'
                    placeholder='Nhập địa chỉ đầy đủ'
                    defaultValue={customer?.cus_address || ''}
                  />
                </div>

                <div className='flex flex-col'>
                  <Select
                    label='Kênh liên hệ'
                    id='contactChannel'
                    name='contactChannel'
                    className='w-full'
                    defaultValue={customer?.cus_contactChannel || ''}
                  >
                    <option value=''>Chọn kênh liên hệ</option>
                    <option value='FB'>Facebook</option>
                    <option value='Zalo'>Zalo</option>
                    <option value='FB + Zalo'>Facebook + Zalo</option>
                    <option value='Chỉ SĐT'>Chỉ số điện thoại</option>
                    <option value='Khác'>Khác</option>
                  </Select>
                </div>

                <div className='flex flex-col'>
                  <TextInput
                    label='Tên tài khoản liên hệ'
                    id='contactAccountName'
                    name='contactAccountName'
                    type='text'
                    placeholder='Nhập tên tài khoản liên hệ'
                    defaultValue={customer?.cus_contactAccountName || ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className='flex justify-between border-t border-gray-200 pt-4 px-6 sm:px-8 -mx-6 mt-8'>
        <CRMButton type='button' color='gray'>
          Quay lại
        </CRMButton>

        <div className='flex flex-wrap justify-end gap-3 max-w-6xl'>
          <CRMButton
            type='button'
            onClick={handleCancel}
            color='red'
            disabled={isSubmitting}
          >
            Hủy
          </CRMButton>
          <CRMButton type='reset' color='transparent' disabled={isSubmitting}>
            Đặt lại
          </CRMButton>
          <CRMButton type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </CRMButton>
        </div>
      </div>
    </fetcher.Form>
  );
}
