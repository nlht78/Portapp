import { LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
} from '@remix-run/react';

import { isAuthenticated } from '~/services/auth.server';
import { getCurrentUser } from '~/services/user.server';
import Sidebar from './_components/SideBar';
import HandsomeError from '~/components/HandsomeError';
import { destroySession, getSession } from '~/services/session.server';
import HRMButton from '../_components/HRMButton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  try {
    const user = await getCurrentUser(auth!);

    return { user };
  } catch (error) {
    const url = new URL(request.url);
    console.error('Error fetching user:', error);
    return redirect('/hrm/login' + `?redirect=${url.pathname}`);
  }
};

export default function HRMLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <main>
      <div className='h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden'>
        <Sidebar />

        <div className='flex-1 p-4 md:p-6 lg:ml-[240px] mt-4 lg:mt-0 overflow-y-auto'>
          {/* Top Navigation */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
            <HRMButton
              color='red'
              tagType='link'
              href='/crm'
              target='_blank'
              className='w-fit'
            >
              Quản lý khách hàng
              <span className='material-symbols-outlined text-sm ml-1'>
                open_in_new
              </span>
            </HRMButton>

            <div className='flex items-center space-x-4 ml-auto'>
              {/* <div className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'>
                  <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
                    notifications
                  </span>
                  <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
                </div>
              
                <div className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'>
                  <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
                    mail
                  </span>
                  <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
                </div> */}

              <Link
                to='/hrm/profile'
                className='flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-all duration-200'
              >
                <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold uppercase'>
                  {user?.usr_firstName[0]}
                </div>

                <div className='ml-2 hidden sm:block overflow-hidden'>
                  <div className='text-sm font-medium truncate'>{`${user?.usr_firstName} ${user?.usr_lastName}`}</div>
                  <div className='text-xs text-gray-500 truncate'>
                    {user?.usr_role.name}
                  </div>
                </div>

                {/* <span className='material-symbols-outlined text-gray-500 ml-1'>
            expand_more
          </span> */}
              </Link>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </main>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/hrm' />;
