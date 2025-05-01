import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import Defer from '~/components/Defer';
import { isAuthenticated } from '~/services/auth.server';
import { getEmployees } from '~/services/employee.server';
import { getEmployeeKPIPerformance } from '~/services/kpi.server';
import ContentHeader from './_components/ContentHeader';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    const employeePerformances = getEmployees(user!)
      .then((employees) => {
        return Promise.allSettled(
          employees.map((employee) => {
            return {
              employee,
              performances: getEmployeeKPIPerformance(
                employee.userId.id,
                new Date('2025-04-01').toISOString(),
                new Date().toISOString(),
                user!,
              ).catch((error) => {
                console.error(
                  `Error fetching performance for employee ${employee.userId.id}:`,
                  error,
                );
                return [];
              }),
            };
          }),
        );
      })
      .then((results) => {
        return results.map((result) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error('Error fetching performance:', result.reason);
            return {
              employee: null,
              performances: null,
            };
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching employee performances:', error);
        return [] as Array<{
          employee: null;
          performances: Promise<any>;
        }>;
      });

    return {
      employeePerformances,
    };
  } catch (error) {
    console.error(error);

    return {
      employeePerformances: Promise.resolve(
        [] as {
          employee: null;
          performances: Promise<any>;
        }[],
      ),
    };
  }
};

export default function IndexHRM() {
  const { employeePerformances } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm nhân sự
          </>
        }
        actionHandler={() => navigate('/hrm/employees/new')}
      />

      {/* Dashboard Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Total Employees</p>
              <h3 className='text-2xl font-bold'>387</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                8% from last month
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-500'>
                people
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-green-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Attendance Rate</p>
              <h3 className='text-2xl font-bold'>94.3%</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                2.1% from last month
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-green-500'>
                fact_check
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-purple-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Open Positions</p>
              <h3 className='text-2xl font-bold'>23</h3>
              <p className='text-xs text-purple-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                5 new this week
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-purple-500'>
                work
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-orange-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Leave Requests</p>
              <h3 className='text-2xl font-bold'>38</h3>
              <p className='text-xs text-orange-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  priority_high
                </span>
                12 require approval
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-orange-500'>
                pending_actions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Attendance Overview */}
        <div className='bg-white rounded-lg shadow-sm p-6 lg:col-span-2'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='font-semibold text-lg'>Hiệu suất làm việc</h2>
            <div className='flex space-x-2'>
              <select className='text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition'>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Quarter</option>
              </select>
              <button className='text-blue-500 hover:text-blue-600 text-xs flex items-center transition-all hover:underline'>
                Detailed Report
                <span className='material-symbols-outlined text-sm ml-1'>
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between mb-6'>
            <div className='flex items-center space-x-4 mb-4 sm:mb-0'>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-sm bg-green-400 mr-1'></div>
                <span className='text-xs text-gray-500'>Vượt KPI</span>
              </div>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-sm bg-blue-400 mr-1'></div>
                <span className='text-xs text-gray-500'>Đạt KPI</span>
              </div>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-sm bg-red-400 mr-1'></div>
                <span className='text-xs text-gray-500'>Chưa đạt KPI</span>
              </div>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-sm bg-zinc-400 mr-1'></div>
                <span className='text-xs text-gray-500'>Không có dữ liệu</span>
              </div>
            </div>

            {/* <div className='flex space-x-2'>
              <button className='bg-white border border-gray-200 hover:border-blue-500 px-3 py-1 rounded-md text-xs flex items-center transition-all duration-300'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  download
                </span>
                Export
              </button>
              <button className='bg-white border border-gray-200 hover:border-blue-500 px-3 py-1 rounded-md text-xs flex items-center transition-all duration-300'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  print
                </span>
                Print
              </button>
            </div> */}
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead>
                <tr>
                  <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Tên nhân viên
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T2
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T3
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T4
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T5
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T6
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    T7
                  </th>
                  <th className='px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    CN
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                <Defer
                  resolve={employeePerformances}
                  fallback={
                    <tr className='hover:bg-gray-50 transition-all'>
                      <td
                        colSpan={8}
                        className='text-center py-4 text-gray-500'
                      >
                        Loading...
                      </td>
                    </tr>
                  }
                >
                  {(data) => {
                    if (!data || data.length === 0) {
                      return (
                        <tr className='hover:bg-gray-50 transition-all'>
                          <td
                            colSpan={8}
                            className='text-center py-4 text-gray-500'
                          >
                            không có dữ liệu
                          </td>
                        </tr>
                      );
                    }

                    return data.map(({ employee, performances }) => {
                      if (!employee) {
                        return (
                          <tr className='hover:bg-gray-50 transition-all'>
                            <td
                              colSpan={8}
                              className='text-center py-4 text-gray-500'
                            >
                              không có dữ liệu
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={employee.id}
                          className='hover:bg-gray-50 transition-all'
                        >
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                                <img
                                  src={
                                    employee.userId.usr_avatar?.img_url || ''
                                  }
                                  alt='Employee'
                                  className='h-full w-full object-cover'
                                />
                              </div>
                              <div>
                                <div className='text-sm font-medium'>
                                  {employee.userId.usr_lastName}{' '}
                                  {employee.userId.usr_firstName}
                                </div>
                                <div className='text-xs text-gray-500'>
                                  {employee.position}
                                </div>
                              </div>
                            </div>
                          </td>

                          <Defer
                            resolve={performances}
                            fallback={new Array(7).map((_, i) => (
                              <td
                                key={i}
                                className='px-4 py-3 whitespace-nowrap text-center'
                              >
                                <div className='h-6 w-6 rounded-full bg-zinc-400 mx-auto'></div>
                              </td>
                            ))}
                          >
                            {(data) => {
                              if (!data || data.length === 0) {
                                return new Array(7).fill(null).map((_, i) => (
                                  <td
                                    key={i}
                                    className='px-4 py-3 whitespace-nowrap text-center'
                                  >
                                    <div className='h-6 w-6 rounded-full bg-zinc-400 mx-auto'></div>
                                  </td>
                                ));
                              }
                              if (data.length < 7) {
                                const emptyCells = 7 - data.length;
                                return new Array(emptyCells)
                                  .fill(null)
                                  .map((_, i) => (
                                    <td
                                      key={i}
                                      className='px-4 py-3 whitespace-nowrap text-center'
                                    >
                                      <div className='h-6 w-6 rounded-full bg-zinc-400 mx-auto'></div>
                                    </td>
                                  ));
                              }
                              return data.slice(0, 7).map((performance, i) =>
                                performance?.goal ? (
                                  <td
                                    key={i}
                                    className='px-4 py-3 whitespace-nowrap text-center'
                                  >
                                    <div
                                      className={`h-6 w-6 rounded-full ${
                                        +performance.completed >
                                        +performance.goal
                                          ? 'bg-green-400'
                                          : +performance.completed ===
                                              +performance.goal
                                            ? 'bg-blue-400'
                                            : 'bg-red-400'
                                      } mx-auto`}
                                    ></div>
                                  </td>
                                ) : (
                                  <td
                                    key={i}
                                    className='px-4 py-3 whitespace-nowrap text-center'
                                  >
                                    <div className='h-6 w-6 rounded-full bg-zinc-400 mx-auto'></div>
                                  </td>
                                ),
                              );
                            }}
                          </Defer>
                        </tr>
                      );
                    });
                  }}
                </Defer>
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Notifications */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='font-semibold text-lg'>Admin Notifications</h2>
            <button className='text-blue-500 hover:text-blue-600 text-xs flex items-center transition-all hover:underline'>
              View All
              <span className='material-symbols-outlined text-sm ml-1'>
                chevron_right
              </span>
            </button>
          </div>

          <div className='space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin'>
            <div className='bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5'>
              <div className='flex justify-between items-start'>
                <div className='flex'>
                  <span className='material-symbols-outlined text-blue-500 mr-2'>
                    info
                  </span>
                  <div>
                    <p className='text-sm font-medium'>All-Hands Meeting</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      Quarterly company meeting scheduled for June 15th at 10:00
                      AM in the main conference room.
                    </p>
                  </div>
                </div>
                <span className='text-xs text-gray-400'>Just now</span>
              </div>
              <div className='flex items-center justify-end mt-3 space-x-2'>
                <button className='text-xs text-blue-500 hover:text-blue-600 hover:underline'>
                  Add to Calendar
                </button>
                <button className='text-xs text-gray-500 hover:text-gray-600 hover:underline'>
                  Dismiss
                </button>
              </div>
            </div>

            <div className='bg-green-50 p-4 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5'>
              <div className='flex justify-between items-start'>
                <div className='flex'>
                  <span className='material-symbols-outlined text-green-500 mr-2'>
                    check_circle
                  </span>
                  <div>
                    <p className='text-sm font-medium'>New Policy Approved</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      Updated remote work policy has been approved and will be
                      effective starting next month.
                    </p>
                  </div>
                </div>
                <span className='text-xs text-gray-400'>2 hours ago</span>
              </div>
              <div className='flex items-center justify-end mt-3 space-x-2'>
                <button className='text-xs text-blue-500 hover:text-blue-600 hover:underline'>
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
