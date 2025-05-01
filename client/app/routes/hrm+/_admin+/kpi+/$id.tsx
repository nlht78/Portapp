import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import {
  deleteKPI,
  getKPIById,
  getKPIInstances,
  updateKPI,
} from '~/services/kpi.server';
import { getEmployees } from '~/services/employee.server';
import ContentHeader from '~/routes/hrm+/_admin+/_components/ContentHeader';
import { IAdminUpdateKPIData } from '~/interfaces/kpi.interface';
import KPIInstanceList from '../_components/KPIInstanceList';
import KPIForm from '../_components/KPIForm';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { id } = params;
    if (!id) {
      return redirect('/hrm/kpi');
    }

    try {
      const kpiData = await getKPIById(id, user);
      const employeesData = getEmployees(user).catch((error) => {
        console.error('Error fetching employees:', error);
        return [];
      });
      const instancesData = getKPIInstances(id, user).catch((error) => {
        console.error('Error fetching instances:', error);
        return [];
      });

      return {
        kpi: kpiData,
        employees: employeesData,
        instances: instancesData,
      };
    } catch (promiseError: any) {
      throw new Response(
        promiseError.statusText ||
          promiseError.message ||
          'Error fetching KPI data',
        {
          status: promiseError.status || 500,
        },
      );
    }
  } catch (error) {
    console.error('Loader Error:', error);
    return redirect('/hrm/kpi');
  }
};

// Define response types
type ActionResponse = {
  toast: { message: string; type: string };
  errors?: Record<string, string>;
};

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<ActionResponse | undefined> => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { id } = params;
    if (!id) {
      throw new Error('KPI ID không hợp lệ');
    }

    switch (request.method) {
      case 'DELETE':
        // Handle delete action
        await deleteKPI(id, user);
        return {
          toast: {
            message: 'Xóa KPI thành công',
            type: 'success',
          },
        };

      case 'PUT':
        const formData = await request.formData();
        // Extract KPI data
        const kpiData: IAdminUpdateKPIData = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          intervalType: formData.get('intervalType') as
            | 'daily'
            | 'weekly'
            | 'monthly'
            | 'quarterly'
            | 'yearly',
          isActive: formData.get('isActive') === 'true',
          assigneeId: formData.get('assigneeId') as string,
          baseGoal: parseFloat(formData.get('baseGoal') as string),
        };

        // Update KPI
        await updateKPI(id, kpiData, user);

        // Set a flash message and redirect
        return {
          toast: {
            message: 'Cập nhật KPI thành công',
            type: 'success',
          },
        };

      default:
        // Handle unsupported methods
        return {
          toast: {
            message: 'Phương thức không được hỗ trợ',
            type: 'error',
          },
        };
    }
  } catch (error) {
    console.error('Action Error:', error);
    // Enhanced error handling
    let errorMessage = 'Đã xảy ra lỗi khi cập nhật KPI';

    if (error instanceof Response) {
      if (error.status === 403) {
        errorMessage = 'Bạn không có quyền cập nhật KPI này';
      } else {
        errorMessage = `Lỗi từ máy chủ: ${error.statusText || error.status}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ActionResponse = {
      toast: {
        message: errorMessage,
        type: 'error',
      },
    };

    return response;
  }
};

export default function UpdateKPI() {
  const { kpi, employees, instances } = useLoaderData<typeof loader>();

  return (
    <>
      <ContentHeader title='Cập nhật KPI' />

      {/* Main form */}
      <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-semibold'>Cập nhật thông tin KPI</h3>
        </div>

        <KPIForm kpi={kpi} type='update' employees={employees} />
      </div>

      {/* KPI Instances */}
      <KPIInstanceList kpiInstances={instances} />
    </>
  );
}
