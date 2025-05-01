import { useState } from 'react';
import { Link, useLoaderData, useActionData } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { createKPI } from '~/services/kpi.server';
import { getEmployees } from '~/services/employee.server';
import KPIForm from '../_components/KPIForm';

export const action = async ({ request }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries()) as any;
        const user = await isAuthenticated(request);

        // Format data before sending
        const formattedData = {
          ...data,
          isActive: data.isActive === 'true',
          baseGoal: parseFloat(data.baseGoal),
        };

        console.log('Submitting KPI data:', formattedData);
        const res = await createKPI(formattedData, user!);

        return {
          kpi: res,
          toast: { message: 'Thêm mới KPI thành công!', type: 'success' },
        };
      } catch (error: any) {
        console.error('Create KPI Error:', error);
        return {
          kpi: null,
          toast: {
            message: error.message || error.statusText || 'Có lỗi xảy ra',
            type: 'error',
          },
        };
      }
    }

    default:
      return {
        kpi: null,
        toast: { message: 'Method not allowed', type: 'error' },
      };
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    return {
      employees: getEmployees(user!).catch(() => []),
    };
  } catch (error) {
    console.error(error);

    return {
      employees: Promise.resolve([] as any[]),
    };
  }
};

export default function NewKPI() {
  const { employees } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isChanged, setIsChanged] = useState(false);

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>Thêm KPI Mới</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='#' className='hover:text-blue-500 transition'>
              KPI
            </a>
            <span className='mx-2'>/</span>
            <span>KPI Mới</span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
        <KPIForm employees={employees} type='create' />
      </div>

      {/* Bottom Action Buttons */}
      <div className='flex justify-between items-center'>
        <Link
          to='/hrm/kpi'
          className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
        >
          <span className='material-symbols-outlined text-sm mr-1'>
            keyboard_return
          </span>
          Trở về Danh sách
        </Link>
      </div>
    </>
  );
}
