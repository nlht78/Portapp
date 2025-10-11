import { Outlet, useLoaderData } from '@remix-run/react';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated, authenticator } from '~/services/auth.server';
import { sessionStorage } from '~/services/session.server';
import { isExpired } from '~/utils';
import TokenNavBar from '~/components/Header/TokenNavBar';
import TokenSideBar from '~/components/Header/TokenSideBar';
import { PortfolioProvider } from '~/contexts/PortfolioContext';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Skip authentication check for login, logout, register, and history routes
  if (['/token/login', '/token/logout', '/token/register'].includes(url.pathname) || url.pathname.includes('/history')) {
    return { user: null };
  }

  const auth = await isAuthenticated(request);
  if (!auth) {
    return redirect('/token/login' + `?redirect=${url.pathname}`);
  }

  const { user, tokens } = auth;

  // Check if the access token is expired
  if (isExpired(tokens.accessToken)) {
    console.log('access token expired in layout');
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie'),
    );

    // If the refresh token is also expired, destroy the session and redirect to login
    if (isExpired(tokens.refreshToken)) {
      console.log('refresh token expired in layout');
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
      
      return redirect(url.pathname, {
        headers: {
          'Set-Cookie': await sessionStorage.commitSession(session),
        },
      });
    } catch (err: any) {
      console.error('Error refreshing token in layout:', err);
      return new Response(err.message, {
        headers: {
          'Set-Cookie': await sessionStorage.destroySession(session),
        },
        status: err.status || 500,
        statusText: err.statusText || 'Internal Server Error',
      });
    }
  }

  return { user, tokens };
};

export default function TokenLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-gray-50">
        <TokenNavBar user={user} />
        {user && (
          <div className="flex">
            <TokenSideBar />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        )}
        {!user && (
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        )}
      </div>
    </PortfolioProvider>
  );
}