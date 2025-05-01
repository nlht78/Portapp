import Defer from '~/components/Defer';
import ContentHeader from './_components/ContentHeader';
import EmployeeProfileHeader from '../_components/EmployeeProfileHeader';
import AttendanceLog from '../_components/AttendanceLog';
import { getLast7DaysStats } from '~/services/attendance.server';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { getCurrentEmployeeByUserId } from '~/services/employee.server';
import HandsomeError from '~/components/HandsomeError';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    const attendanceStats = getLast7DaysStats(user!.user.id, user!).catch(
      (e: any) => {
        console.log(e.message || e.statusText);
        return [] as any[];
      },
    );
    const employee = getCurrentEmployeeByUserId(user!).catch((e: any) => {
      console.log(e.message || e.statusText);
      return null;
    });
    return { attendanceStats, employee };
  } catch (error: any) {
    console.log(error.message || error.statusText);
    return {
      attendanceStats: Promise.resolve([] as any[]),
      employee: Promise.resolve(null),
    };
  }
};

export default function HRMEmployees() {
  const { attendanceStats, employee } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Chấm công
          </>
        }
        actionHandler={() => navigate('/hrm/nhan-vien/cham-cong')}
      />

      <Defer resolve={employee}>
        {(data) => (data ? <EmployeeProfileHeader employee={data} /> : null)}
      </Defer>

      {/* Attendance & Performance Tabs */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-6'>
        <div className='p-6'>
          {/* Recent Attendance Log */}
          <Defer resolve={attendanceStats}>
            {(data) => <AttendanceLog attendanceStats={data} />}
          </Defer>
        </div>
      </div>
    </>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/hrm/nhan-vien' />;
