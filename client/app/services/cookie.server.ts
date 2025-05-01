import { createCookie } from '@remix-run/node';

// export the whole sessionStorage object
export const createSecretCookie = (name: string) =>
  createCookie(name, {
    sameSite: 'strict', // this helps with CSRF
    path: '/', // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [process.env.SESSION_SECRET || 's3cr3t'], // replace this with an actual secret
    secure: process.env.NODE_ENV === 'production', // enable this in prod only
    maxAge: 7 * 60 * 24 * 30, // 7 days
  });
