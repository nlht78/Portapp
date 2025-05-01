import { useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { isAuthenticated } from '~/services/auth.server';
import { getEmployees } from '~/services/employee.server';
import { getCustomerById, updateCustomer } from '~/services/customer.server';
import CustomerEditForm from '../_components/CustomerEditForm';

type ActionData = {
  success: boolean;
  message: string;
  customer?: any;
  redirectTo?: string;
};

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<ActionData> => {
  try {
    // Xác thực người dùng
    const auth = await isAuthenticated(request);
    if (!auth) {
      return { success: false, message: 'Unauthorized' };
    }

    const { id } = params;
    if (!id) {
      return { success: false, message: 'Customer ID is required' };
    }

    switch (request.method) {
      case 'PUT':
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
            ? new Date(
                formData.get('parentDateOfBirth') as string,
              ).toISOString()
            : undefined,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string,
          address: formData.get('address') as string,
          contactChannel:
            (formData.get('contactChannel') as string) || undefined,
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

        // Kiểm tra dữ liệu bắt buộc
        if (!customerData.fullName) {
          return { success: false, message: 'Tên khách hàng là bắt buộc' };
        }

        // Gọi API tạo khách hàng cùng case service
        const response = await updateCustomer(id, customerData, auth);

        if (!response) {
          return {
            success: false,
            message: 'Lỗi khi cập nhật khách hàng',
          };
        }

        return {
          success: true,
          message: 'Cập nhật khách hàng thành công',
          customer: response,
          redirectTo: '/crm/khach-hang',
        };

      default:
        return {
          success: false,
          message: 'Phương thức không hợp lệ',
        };
    }
  } catch (error: any) {
    console.error('Lỗi cập nhật khách hàng:', error);
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi không xác định',
    };
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { id } = params;
  if (!id) {
    throw new Response('Customer ID is required', { status: 400 });
  }

  const customer = await getCustomerById(id, auth);

  return { customer };
};

export default function EmpNewCustomer() {
  const { customer } = useLoaderData<typeof loader>();
  return <CustomerEditForm customer={customer} />;
}
