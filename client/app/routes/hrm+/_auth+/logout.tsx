import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated, logout } from '~/services/auth.server';
import { destroySession, getSession } from '~/services/session.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    return null;
  }

  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect');
  const session = await getSession(request.headers.get('Cookie'));

  try {
    // delete keyToken in database
    await logout(auth).catch((error) => {
      console.error('Logout error:', error);
    });

    // Clear session data
    return redirect(`/hrm/login?redirect=${redirectUrl}`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    throw redirect(`/hrm/login?redirect=${redirectUrl}`, {
      headers: {
        'Set-Cookie': await destroySession(session),
      },
    });
  }
};
