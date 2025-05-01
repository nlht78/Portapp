import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { authenticator, isAuthenticated, logout } from '~/services/auth.server';
import { sessionStorage } from '~/services/session.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    return null;
  }

  try {
    // delete keyToken in database
    await logout(auth);
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );
    session.unset('_refreshToken');
    session.unset('_accessToken');
    session.unset('_user');

    return redirect(`/cmsdesk/login`, {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return null;
  }
};
