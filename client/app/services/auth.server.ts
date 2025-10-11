import { Authenticator } from 'remix-auth';
import { Strategy } from 'remix-auth/strategy';
import { FormStrategy } from 'remix-auth-form';

import { sessionStorage } from '~/services/session.server';
import { fetcher } from '.';
import { ISessionUser } from '~/interfaces/auth.interface';
import { parseJwt } from '~/utils';
import { redirect } from '@remix-run/react';
import { createSecretCookie } from './cookie.server';

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
const authenticator = new Authenticator<ISessionUser>();

export namespace RefreshTokenStrategy {
  /**
   * This interface declares what the developer will receive from the strategy
   * to verify the user identity in their system.
   */
  export interface VerifyOptions {
    request: Request;
  }
}

// Refresh token strategy
class RefreshTokenStrategy<U> extends Strategy<
  U,
  RefreshTokenStrategy.VerifyOptions
> {
  name = 'refresh-token';

  async authenticate(request: Request): Promise<U> {
    return this.verify({ request });
  }
}

authenticator.use(
  new RefreshTokenStrategy(async ({ request }) => {
    const res = await refreshTokenHandler(request);

    return res as ISessionUser;
  }),
  'refresh-token',
);

authenticator.use(
  new FormStrategy<ISessionUser>(async ({ form }) => {
    try {
      const username = form.get('username') as string;
      const password = form.get('password') as string;
      const fingerprint = form.get('fingerprint') as string;

      const user = await login(username, password, fingerprint);

      return user;
    } catch (error: any) {
      console.log('authenticate error: ', error.data);
      throw error;
    }
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  'user-pass',
);

const isAuthenticated = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );
  const accessToken = session.get('_accessToken');
  const user = session.get('_user');
  const refreshToken = session.get('_refreshToken');
  // const authCookie = await createSecretCookie('_auth').parse(request.headers.get('Cookie'));
  // const accessToken = authCookie.get('_accessToken');
  // const refreshToken = authCookie.get('_refreshToken');
  // const user = authCookie.get('_user');

  if (!accessToken || !user) {
    return null;
  }

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  } as ISessionUser;
};

const login = async (username: string, password: string, browserId: string) => {
  const res = await fetcher('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password, browserId }),
  });

  return res as ISessionUser;
};

const register = async (email: string, username: string, password: string) => {
  const res = await fetcher('/auth/signup-simple', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

  return res;
};

const logout = async (request: ISessionUser) => {
  await fetcher('/auth/signout', {
    method: 'POST',
    request,
  });
};

const refreshTokenHandler = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie'),
  );
  const refreshToken = session.get('_refreshToken');
  const user = session.get('_user');

  const res = await fetcher('/auth/refresh-token', {
    method: 'POST',
    headers: {
      'x-refresh-token': refreshToken || '',
      'x-client-id': user.id || '',
    },
  });

  return res as ISessionUser;
};

export { authenticator, logout, isAuthenticated, register };
