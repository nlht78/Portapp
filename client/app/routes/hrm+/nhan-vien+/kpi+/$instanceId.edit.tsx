import { Link, useLoaderData } from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import {
  deleteKPI,
  deleteKPIInstance,
  getKPIInstanceById,
  updateKPIInstanceProgress,
} from '~/services/kpi.server';
import ContentHeader from '../_components/ContentHeader';
import UpdateKPIForm from '../_components/UpdateKPIForm';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { instanceId } = params;

    // Get the employee's KPIs instead of a specific KPI
    const kpiInstance = getKPIInstanceById(instanceId!, user!).catch((e) => {
      console.error('KPI Instance Error:', e);
      return null;
    });

    return {
      kpiInstance,
    };
  } catch (error) {
    console.error('Loader Error:', error);
    return redirect('/hrm/nhan-vien/kpi');
  }
};

// Define response types
type ActionResponse = {
  toast: { message: string; type: string };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await isAuthenticated(request);
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { instanceId } = params;
  try {
    switch (request.method) {
      case 'PUT':
        const formData = await request.formData();
        const completed = Number(formData.get('completed') as string);

        if (!instanceId || isNaN(completed)) {
          const response: ActionResponse = {
            toast: {
              message: 'Dữ liệu không hợp lệ',
              type: 'error',
            },
          };
          return response;
        }

        // Update KPI instance progress with await to catch errors
        await updateKPIInstanceProgress(instanceId, { completed }, user);

        return {
          toast: {
            message: 'Cập nhật KPI thành công',
            type: 'success',
          },
        };

      case 'DELETE':
        await deleteKPIInstance(instanceId!, user);
        return {
          toast: {
            message: 'Xóa KPI thành công',
            type: 'success',
          },
        };

      default:
        const response: ActionResponse = {
          toast: {
            message: 'Phương thức không hợp lệ',
            type: 'error',
          },
        };
        return response;
    }
  } catch (updateError: any) {
    // Enhanced error handling
    let errorMessage = 'Đã xảy ra lỗi khi cập nhật KPI';

    if (updateError instanceof Response) {
      if (updateError.status === 403) {
        errorMessage = 'Bạn không có quyền cập nhật KPI này';
      } else {
        errorMessage = `Lỗi từ máy chủ: ${updateError.statusText || updateError.status}`;
      }
    } else if (updateError instanceof Error) {
      errorMessage = updateError.message;
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
  const { kpiInstance } = useLoaderData<typeof loader>();

  return (
    <>
      <ContentHeader title='Cập nhật tiến độ KPI' />

      {/* Add a link to go back if needed */}
      <div className='mb-4'>
        <Link
          to='/hrm/nhan-vien/kpi'
          className='text-red-500 hover:underline inline-flex items-center'
        >
          <span className='material-symbols-outlined text-sm mr-1'>
            arrow_back
          </span>
          Quay lại danh sách KPI
        </Link>
      </div>

      <UpdateKPIForm kpiInstance={kpiInstance} />
    </>
  );
}
