import { ActionFunctionArgs } from '@remix-run/node';
import {
  deleteAttendance,
  updateAttendance,
} from '~/services/attendance.server';
import { isAuthenticated } from '~/services/auth.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      throw new Error('User not authenticated');
    }
    if (!id) {
      throw new Error('ID not found');
    }

    switch (request.method) {
      case 'PUT': {
        await updateAttendance(
          id,
          {
            checkInTime: new Date(
              `${data.checkInDate} ${data.checkInTime} GMT+07:00`,
            ).toISOString(), // convert checkInTime to ISO format in GMT+00:00
            checkOutTime: data.checkOutTime
              ? new Date(
                  `${data.checkInDate} ${data.checkOutTime} GMT+07:00`,
                ).toISOString() // convert checkOutTime to ISO format in GMT+00:00
              : '',
            date: new Date(
              `${data.checkInDate} 00:00:00 GMT+07:00`,
            ).toISOString(), // convert checkInDate to ISO format in GMT+00:00
          },
          auth,
        );
        return {
          toast: { message: 'Cập nhật thành công', type: 'success' },
        };
      }

      case 'DELETE': {
        // Handle delete action
        await deleteAttendance(id, auth);
        return {
          toast: { message: 'Xóa thành công', type: 'success' },
        };
      }

      default: {
        return {
          toast: { message: 'Không hỗ trợ phương thức này', type: 'error' },
        };
      }
    }
  } catch (error: any) {
    console.error(error);
    return {
      toast: { message: error.message || error.statusText, type: 'error' },
    };
  }
};
