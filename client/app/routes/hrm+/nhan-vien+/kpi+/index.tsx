import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import Defer from '~/components/Defer';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { getEmployeeKPIInstances } from '~/services/kpi.server';
import ContentHeader from '~/routes/hrm+/nhan-vien+/_components/ContentHeader';
import KPIInstanceList from '../_components/KPIInstanceList';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Error('User not authenticated');
    }

    const kpisData = getEmployeeKPIInstances(user.user.id, user);

    return {
      kpis: kpisData.catch((e) => {
        console.error('Employee KPIs Error:', e);
        return [];
      }),
    };
  } catch (error) {
    console.error('Loader Error:', error);
    return {
      kpis: Promise.resolve([]),
    };
  }
};

export default function EmployeeKPI() {
  const { kpis } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Content Header */}
      <ContentHeader title='KPI của tôi' />

      {/* KPI Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Tổng số KPI</p>
              <h3 className='text-2xl font-bold'>
                <Defer resolve={kpis}>
                  {(data) => {
                    return data.length || 0;
                  }}
                </Defer>
              </h3>
              <p className='text-xs text-blue-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  assessment
                </span>
                KPI đang hoạt động
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-500'>
                assessment
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-orange-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Hiệu suất trung bình</p>
              <h3 className='text-2xl font-bold'>
                <Defer resolve={kpis}>
                  {(data) => {
                    if (!data.length) return '0%';

                    const totalProgress = data.reduce((acc: number, curr) => {
                      const progress = (curr.completed / curr.goal) * 100;
                      return acc + progress;
                    }, 0);
                    return `${Math.round(totalProgress / data.length)}%`;
                  }}
                </Defer>
              </h3>
              <p className='text-xs text-orange-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  trending_up
                </span>
                Tổng quan hiệu suất
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-orange-500'>
                trending_up
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-purple-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>KPI hoàn thành</p>
              <h3 className='text-2xl font-bold'>
                <Defer resolve={kpis}>
                  {(data) => {
                    return (
                      data.reduce((acc: number, curr) => {
                        return acc + (+curr.completed >= +curr.goal ? 1 : 0);
                      }, 0) || 0
                    );
                  }}
                </Defer>
              </h3>
              <p className='text-xs text-purple-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  check_circle
                </span>
                Tổng số KPI hoàn thành
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-purple-500'>
                task_alt
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-green-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>KPI vượt chỉ tiêu</p>
              <h3 className='text-2xl font-bold'>
                <Defer resolve={kpis}>
                  {(data) => {
                    return (
                      data.reduce((acc: number, curr) => {
                        return acc + (+curr.completed > +curr.goal ? 1 : 0);
                      }, 0) || 0
                    );
                  }}
                </Defer>
              </h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  check_circle
                </span>
                Tổng số KPI hoàn thành
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-green-500'>
                task_alt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI List */}
      <KPIInstanceList kpiInstances={kpis} />
    </>
  );
}
