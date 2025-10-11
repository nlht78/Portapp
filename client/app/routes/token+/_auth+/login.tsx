import { useState } from 'react';
import { Form, useActionData, useNavigation, Link } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { sessionStorage } from '~/services/session.server';
import { isExpired } from '~/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect') || '/token/dashboard';

  // If the user is already authenticated
  if (auth) {
    const { user, tokens } = auth;

    // Check if the access token is expired
    if (isExpired(tokens.accessToken)) {
      console.log('access token expired');
      const session = await sessionStorage.getSession(
        request.headers.get('Cookie'),
      );

      // If the refresh token is also expired, destroy the session and redirect to login
      if (isExpired(tokens.refreshToken)) {
        console.log('refresh token expired');
        return new Response(null, {
          headers: {
            'Set-Cookie': await sessionStorage.destroySession(session),
          },
          status: 302,
          statusText: 'Redirecting to login',
        });
      }

      try {
        // If the access token is expired but the refresh token is valid, handle refresh token
        const tokenRefresh = await authenticator.authenticate(
          'refresh-token',
          request,
        );

        session.set('_refreshToken', tokenRefresh.tokens.refreshToken);
        session.set('_accessToken', tokenRefresh.tokens.accessToken);
        session.set('_user', tokenRefresh.user);
        return redirect(redirectUrl, {
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        });
      } catch (err: any) {
        console.error('Error refreshing token:', err);
        return new Response(err.message, {
          headers: {
            'Set-Cookie': await sessionStorage.destroySession(session),
          },
          status: err.status || 500,
          statusText: err.statusText || 'Internal Server Error',
        });
      }
    }

    // If the user is authenticated and the access token is valid, redirect to the specified URL
    throw redirect(redirectUrl);
  }
  // If the user is not authenticated, return an empty object
  // This will allow the login page to render without any data
  return {};
};

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect') || '/token/dashboard';
  try {
    const { user, tokens } = await authenticator.authenticate(
      'user-pass',
      request,
    );

    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );
    session.set('_refreshToken', tokens.refreshToken);
    session.set('_accessToken', tokens.accessToken);
    session.set('_user', user);

    return redirect(redirectUrl, {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  } catch (err: any) {
    console.log('login error: ', err);

    return {
      toast: {
        message: err.statusText || err.message,
        type: 'error',
      },
    };
  }
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Token Research Platform
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="fingerprint" value={fingerprint} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {actionData?.toast && (
            <div className={`p-4 rounded-md ${
              actionData.toast.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {actionData.toast.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/token/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create one here
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;