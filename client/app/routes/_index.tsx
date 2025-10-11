import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Redirect to /token route when accessing root URL
  return redirect('/token');
};

export default function Index() {
  // This component will never render due to the redirect in loader
  return null;
}
