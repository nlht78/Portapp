import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployees } from '~/services/employee.server';
import { getCustomerById } from '~/services/customer.server';
import { useLoaderData } from '@remix-run/react';
import CaseServiceCreateForm from '../_components/CaseServiceCreateForm';
import { createCase } from '~/services/caseService.server';

type ActionData = {
  success: boolean;
  message: string;
  caseService?: any;
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

    const price = parseFloat(formData.get('price') as string);
    const amountPaid = parseFloat(formData.get('amountPaid') as string);
    const isFullyPaid = price > 0 && amountPaid >= price;
    // Xây dựng dữ liệu case service
    const caseServiceData = {
      customerId: formData.get('customerId') as string,
      appointmentDate: formData.get('appointmentDate')
        ? new Date(formData.get('appointmentDate') as string).toISOString()
        : new Date().toISOString(),
      eventLocation: formData.get('eventLocation') as string,
      scanLocation: formData.get('scanLocation') as string,
      partner: formData.get('partner') as string,
      price,
      amountPaid,
      paymentMethod: formData.get('paymentMethod') as
        | 'cash'
        | 'transfer'
        | 'card'
        | 'other',
      // Staff IDs
      consultantId: (formData.get('consultantId') as string) || undefined,
      fingerprintTakerId:
        (formData.get('fingerprintTakerId') as string) || undefined,
      mainCounselorId: (formData.get('mainCounselorId') as string) || undefined,
      // Process status flags
      isScanned: formData.get('isScanned') === 'on',
      isFullInfo: formData.get('isFullInfo') === 'on',
      isAnalysisSent: formData.get('isAnalysisSent') === 'on',
      isPdfExported: formData.get('isPdfExported') === 'on',
      isFullyPaid,
      isSoftFileSent: formData.get('isSoftFileSent') === 'on',
      isPrintedAndSent: formData.get('isPrintedAndSent') === 'on',
      isPhysicalCopySent: formData.get('isPhysicalCopySent') === 'on',
      isDeepConsulted: formData.get('isDeepConsulted') === 'on',
      // Progress info
      progressNote: (formData.get('progressNote') as string) || '',
    };
    console.log(caseServiceData);
    // Gọi API tạo khách hàng cùng case service
    const response = await createCase(caseServiceData, auth);

    if (!response) {
      return {
        success: false,
        message: 'Lỗi khi tạo ca dịch vụ',
      };
    }

    return {
      success: true,
      message: 'Thêm mới ca dịch vụ thành công!',
      caseService: response,
      redirectTo: `/crm/ca-dich-vu/${response.id}`,
    };
  } catch (error: any) {
    console.error('Lỗi tạo ca dịch vụ:', error);
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi không xác định',
    };
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const customerId = searchParams.get('customerId');

  // Fetch employees for staff assignment
  const employees = await getEmployees(auth);
  if (!customerId) {
    return { employees };
  }
  const customer = await getCustomerById(customerId, auth);

  return { employees, customer };
};

export default function NewCaseService() {
  const { employees, customer } = useLoaderData<typeof loader>();
  return (
    <>
      <CaseServiceCreateForm employees={employees} customer={customer} />
    </>
  );
}
