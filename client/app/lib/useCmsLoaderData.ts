import { useRouteLoaderData } from '@remix-run/react';

import { loader as cmsLoader } from '~/routes/cmsdesk+/_layout';

export function useCmsLoaderData() {
  const data = useRouteLoaderData<typeof cmsLoader>(`routes/cmsdesk/_layout`);

  return data!;
}
