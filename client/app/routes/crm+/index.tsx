import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect('/crm/ca-dich-vu');
};
