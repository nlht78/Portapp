import { LoaderFunctionArgs } from '@remix-run/node';
import {
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
} from '@remix-run/react';

import LoadingOverlay from '~/components/LoadingOverlay';
import { isAuthenticated } from '~/services/auth.server';
import TopHeader from './_components/TopHeader';
import Sidebar from './_components/SideBar';
import { getCurrentEmployeeByUserId } from '~/services/employee.server';
import HandsomeError from '~/components/HandsomeError';
import { destroySession, getSession } from '~/services/session.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);

  if (auth?.user.usr_role.slug === 'admin') {
    return redirect('/hrm');
  }

  try {
    const employee = await getCurrentEmployeeByUserId(auth!);

    return { employee };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return redirect(
      '/hrm/login' + `?redirect=${new URL(request.url).pathname}`,
    );
  }
};

export default function HRMLayout() {
  const { employee } = useLoaderData<typeof loader>();

  return (
    <main>
      <div className='h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden'>
        <Sidebar />

        <div className='flex-1 p-4 md:p-6 lg:ml-[240px] mt-4 lg:mt-0 overflow-y-auto'>
          <TopHeader employee={employee} />

          <Outlet context={{ employee }} />
        </div>
      </div>
    </main>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/hrm/nhan-vien' />;
