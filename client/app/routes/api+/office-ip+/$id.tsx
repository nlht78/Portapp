import { ActionFunctionArgs } from '@remix-run/node';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import {
  createOfficeIP,
  deleteOfficeIP,
  updateOfficeIP,
} from '~/services/officeIP.server';
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const id = params.id || '';
  const formData = await request.formData();
  let ipAddress = formData.get('ipAddress') as string;
  const officeName = formData.get('officeName') as string;

  try {
    const user = await isAuthenticated(request);

    switch (request.method) {
      case 'PUT': {
        if (!ipAddress) {
          ipAddress = getClientIPAddress(request)!;
          if (!ipAddress) {
            return {
              toast: {
                message: 'Không thể lấy địa chỉ IP',
                type: 'error',
              },
            };
          }
        }
        const officeIP = await updateOfficeIP(
          id,
          { officeName, ipAddress },
          user!,
        );

        return {
          toast: {
            message: 'Cập nhật địa chỉ IP thành công',
            type: 'success',
          },
        };
      }

      case 'DELETE': {
        const officeIP = await deleteOfficeIP(id, user!);
        return {
          toast: {
            message: 'Xóa địa chỉ IP thành công',
            type: 'success',
          },
        };
      }

      default: {
        return {
          toast: {
            message: 'Không thể thực hiện yêu cầu',
            type: 'error',
          },
        };
      }
    }
  } catch (error: any) {
    return {
      toast: {
        message: error.message || error.statusText,
        type: 'error',
      },
    };
  }
};
