import { useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useState } from 'react';
import { isAuthenticated } from '~/services/auth.server';
import {
  getCurrentEmployeeByUserId,
  updateEmployee,
} from '~/services/employee.server';
import { IUpdateEmployeeData } from '~/interfaces/employee.interface';
import HandsomeError from '~/components/HandsomeError';
import EmployeeProfileForm from '../_components/EmployeeProfileForm';
import HRMButton from '../../_components/HRMButton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);

  const employee = await getCurrentEmployeeByUserId(auth!);
  return {
    employee,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);

    const employee = await getCurrentEmployeeByUserId(auth!);

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    // Prepare update data
    const updateData: IUpdateEmployeeData = {
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      email: data.email as string,
      msisdn: data.msisdn as string,
      address: data.address as string,
      sex: data.sex as string,
      birthdate: data.birthdate as string,
      username: data.username as string,
      password: data.password as string,
      avatar: data.avatar as string,
    };

    const updatedEmployee = await updateEmployee(
      employee.id,
      updateData,
      auth!,
    );
    return {
      employee: updatedEmployee,
      toast: { message: 'Cập nhật thông tin thành công!', type: 'success' },
    };
  } catch (error: any) {
    return {
      toast: {
        message: error.message || error.statusText || 'Cập nhật thất bại!',
        type: 'error',
      },
    };
  }
};

export default function HRMProfile() {
  const { employee } = useLoaderData<typeof loader>();
  const formId = 'employee-profile-form';

  const [isChanged, setIsChanged] = useState(false);

  return (
    <>
      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold'>My Profile</h1>
          <div className='ml-3 text-gray-500 text-sm flex items-center'>
            <a href='/hrm' className='hover:text-blue-500 transition'>
              Dashboard
            </a>
            <span className='mx-2'>/</span>
            <span>Profile</span>
          </div>
        </div>
        <div className='flex space-x-2'>
          <HRMButton
            color='blue'
            type='submit'
            disabled={!isChanged}
            form={formId}
          >
            <span className='material-symbols-outlined text-sm mr-1'>save</span>
            Lưu
          </HRMButton>
        </div>
      </div>

      {/* Form Container */}
      <EmployeeProfileForm
        employee={employee}
        formId={formId}
        setIsChanged={setIsChanged}
      />
    </>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='hrm/nhan-vien' />;
