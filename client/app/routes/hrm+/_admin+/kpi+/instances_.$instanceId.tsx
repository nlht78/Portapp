import { ActionFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { deleteKPIInstance } from '~/services/kpi.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { instanceId } = params;
    if (!instanceId) {
      throw new Error('KPI ID không hợp lệ');
    }

    switch (request.method) {
      case 'DELETE':
        // Handle delete action
        await deleteKPIInstance(instanceId, user);
        return {
          toast: {
            message: 'Xóa KPI thành công',
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

    return {
      toast: {
        message: errorMessage,
        type: 'error',
      },
    };
  }
};
