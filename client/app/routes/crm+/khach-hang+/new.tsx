import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { useLoaderData } from '@remix-run/react';
import { createCustomer } from '~/services/customer.server';
import CustomerCreateForm from '../_components/CustomerCreateForm';

type ActionData = {
  success: boolean;
  message: string;
  customer?: any;
  redirectTo?: string;
};

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ActionData> => {
  try {
    // Xác thực người dùng
    const auth = await isAuthenticated(request);
    if (!auth) {
      return { success: false, message: 'Unauthorized' };
    }

    const formData = await request.formData();

    // Xây dựng dữ liệu khách hàng
    const customerData = {
      fullName: formData.get('fullName') as string,
      dateOfBirth: formData.get('dateOfBirth')
        ? new Date(formData.get('dateOfBirth') as string).toISOString()
        : undefined,
      gender:
        formData.get('gender') && formData.get('gender') !== ''
          ? (formData.get('gender') as 'male' | 'female' | 'other')
          : undefined,
      parentName: formData.get('parentName') as string,
      parentDateOfBirth: formData.get('parentDateOfBirth')
        ? new Date(formData.get('parentDateOfBirth') as string).toISOString()
        : undefined,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      contactChannel: (formData.get('contactChannel') as string) || undefined,
      contactAccountName:
        (formData.get('contactAccountName') as string) || undefined,
      status: 'active' as 'potential' | 'active' | 'completed' | 'inactive',
      type: 'regular' as 'regular' | 'vip' | 'premium',
      source: 'direct' as
        | 'referral'
        | 'social_media'
        | 'website'
        | 'direct'
        | 'other',
    };

    // Gọi API tạo khách hàng cùng case service
    const response = await createCustomer(customerData, auth);

    if (!response) {
      return {
        success: false,
        message: 'Lỗi khi tạo khách hàng',
      };
    }

    return {
      success: true,
      message: 'Thêm mới khách hàng thành công!',
      customer: response,
      redirectTo: `/crm/khach-hang/${response.id}`,
    };
  } catch (error: any) {
    console.error('Lỗi tạo khách hàng:', error);
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi không xác định',
    };
  }
};

export default function NewCaseService() {
  return (
    <>
      <CustomerCreateForm />
    </>
  );
}
