import { getEmployeeById } from '~/services/employee.server';
import EmployeeProfileHeader from '../../_components/EmployeeProfileHeader';
import { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { Link, useLoaderData } from '@remix-run/react';
import Defer from '~/components/Defer';
import AdminAttendanceLog from '../_components/AttendanceLog';
import { getLast7DaysStats } from '~/services/attendance.server';

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
export default function EmployeeDetails() {
  const { employee, last7DaysStats } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Content Header with Back Button */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <button className='mr-3 bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-gray-600'>
              arrow_back
            </span>
          </button>
          <h1 className='text-xl font-semibold'>Employee Details</h1>
        </div>
        <div className='flex space-x-2'>
          {/* <button className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>mail</span>
            Message
          </button> */}
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
        {/* <div className='border-b'>
          <div className='flex'>
            <button className='px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 focus:outline-none'>
              Attendance
            </button>
            <button className='px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none'>
              Performance
            </button>
            <button className='px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none'>
              Projects
            </button>
            <button className='px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none'>
              Leave History
            </button>
          </div>
        </div> */}

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
