import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Outlet, useNavigation } from '@remix-run/react';
import HandsomeError from '~/components/HandsomeError';
import LoadingOverlay from '~/components/LoadingOverlay';
import { isAuthenticated, logout } from '~/services/auth.server';
import { destroySession, getSession } from '~/services/session.server';
import { isExpired } from '~/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const auth = await isAuthenticated(request);
  try {
    if (['/hrm/login', '/hrm/logout'].includes(url.pathname)) {
      return {};
    }

    if (!auth) {
      return redirect('/hrm/login' + `?redirect=${url.pathname}`);
    }

    const { user, tokens } = auth;

    if (isExpired(tokens.accessToken)) {
      console.log('access token expired');

      return redirect('/hrm/login' + `?redirect=${url.pathname}`);
    }

    if (
      !url.pathname.includes('/hrm/nhan-vien') &&
      !['admin'].includes(user.usr_role.slug)
    )
      return redirect('/hrm/nhan-vien');
  } catch (error) {
    console.log(error);
    // delete keyToken in database
    if (auth)
      await logout(auth).catch((error) => {
        console.error('Logout error:', error);
      });

    const session = await getSession(request.headers.get('Cookie'));

    // Clear session data
    return redirect(`/hrm/login`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  }

  return {};
};

export const ErrorBoundary = () => <HandsomeError basePath='/hrm' />;

export default function RootHRMLayout() {
  const navigation = useNavigation();

  return (
    <>
      <Outlet />

      {navigation.state === 'loading' && <LoadingOverlay />}
    </>
  );
}
