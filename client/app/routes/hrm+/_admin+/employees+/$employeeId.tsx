import { getEmployeeById, deleteEmployee } from '~/services/employee.server';
import EmployeeProfileHeader from '../../_components/EmployeeProfileHeader';
import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { Link, useLoaderData } from '@remix-run/react';
import Defer from '~/components/Defer';
import AdminAttendanceLog from '../_components/AttendanceLog';
import { getLast7DaysStats } from '~/services/attendance.server';

// Define response types
type ActionResponse = {
  success: boolean;
  message: string;
  redirectTo?: string;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    // Fetch employee details from the API
    const employeeId = params.employeeId as string;
    const employee = await getEmployeeById(employeeId, user!);
    const last7DaysStats = getLast7DaysStats(employee.userId.id, user!).catch(
      (error) => {
        console.error(error);
        return [];
      },
    );

    return { employee, last7DaysStats };
  } catch (error) {
    console.error(error);
    return { employee: null, last7DaysStats: Promise.resolve([]) };
  }
};

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const sessionUser = await isAuthenticated(request);
    if (!sessionUser) {
      throw new Response('Bạn không có quyền thực hiện hành động này', { status: 403 });
    }

    if (request.method.toLowerCase() === 'delete') {
      const { employeeId } = params;
      if (!employeeId) {
        throw new Response('ID nhân viên không hợp lệ', { status: 400 });
      }

      await deleteEmployee(employeeId, sessionUser);
      
      return redirect('/hrm/employees');
    }

    throw new Response('Phương thức không được hỗ trợ', { status: 405 });

  } catch (error) {
    console.error('Action Error:', error);
    let errorMessage = 'Đã xảy ra lỗi khi xóa nhân viên';
    let status = 500;

    if (error instanceof Response) {
      status = error.status;
      errorMessage = error.statusText || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Response(errorMessage, { status });
  }
}

export default function EmployeeDetails() {
  const { employee, last7DaysStats } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Content Header with Back Button */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <Link 
            to="/hrm/employees"
            className='mr-3 bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5'
          >
            <span className='material-symbols-outlined text-gray-600'>
              arrow_back
            </span>
          </Link>
          <h1 className='text-xl font-semibold'>Employee Details</h1>
        </div>
        <div className='flex space-x-2'>
          <Link
            to={`/hrm/employees/${employee?.id}/edit`}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'
          >
            <span className='material-symbols-outlined text-sm mr-1'>edit</span>
            Sửa thông tin
          </Link>
        </div>
      </div>

      {/* Employee Profile Header */}
      {employee && <EmployeeProfileHeader employee={employee} />}

      <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-6'>
        <div className='p-6'>
          {/* Recent Attendance Log */}
          <Defer resolve={last7DaysStats}>
            {(data) =>
              data ? <AdminAttendanceLog attendanceStats={data} /> : null
            }
          </Defer>
        </div>
      </div>
    </>
  );
}
