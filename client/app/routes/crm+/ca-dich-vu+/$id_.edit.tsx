import { useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployees } from '~/services/employee.server';
import CaseServiceEditForm from '../_components/CaseServiceEditForm';
import { getCaseById, updateCase } from '~/services/caseService.server';

type ActionData = {
  success: boolean;
  message: string;
  case?: any;
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
      return {
        success: false,
        message: 'case ID is required',
      };
    }

    switch (request.method) {
      case 'PUT':
        const formData = await request.formData();

        const price = parseFloat(formData.get('price') as string) || 0;
        const amountPaid =
          parseFloat(formData.get('amountPaid') as string) || 0;
        const isFullyPaid = amountPaid >= price;
        // Xây dựng dữ liệu case service
        const caseServiceData = {
          date: formData.get('appointmentDate')
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
          mainCounselorId:
            (formData.get('mainCounselorId') as string) || undefined,
          // Staff names (fallback if IDs not available)
          consultantName: (formData.get('consultantName') as string) || '',
          fingerprintTakerName:
            (formData.get('fingerprintTakerName') as string) || '',
          counselorName: (formData.get('counselorName') as string) || '',
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

        // Gọi API tạo khách hàng cùng case service
        const response = await updateCase(id, caseServiceData, auth);

        return {
          success: true,
          message: 'Cập nhật ca dịch vụ thành công!',
          case: response,
          redirectTo: '/crm/ca-dich-vu',
        };

      default:
        return {
          success: false,
          message: 'Unsupported method',
        };
    }
  } catch (error: any) {
    console.error('Lỗi cập nhật ca dịch vụ: ', error);
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi không xác định',
    };
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);

  const { id } = params;
  if (!id) {
    throw new Response('case ID is required', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const caseService = await getCaseById(id, auth!);
  // Fetch employees for staff assignment
  const employees = await getEmployees(auth!);

  return { employees, caseService };
};

export default function EmpNewcase() {
  const { employees, caseService } = useLoaderData<typeof loader>();
  return (
    <CaseServiceEditForm caseService={caseService} employees={employees!} />
  );
}
