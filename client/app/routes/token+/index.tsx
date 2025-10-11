import { redirect } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request }: { request: Request }) => {
  const auth = await isAuthenticated(request);
  
  if (auth) {
    return redirect('/token/dashboard');
  } else {
    return redirect('/token/login');
  }
};

export default function TokenIndex() {
  return null;
}