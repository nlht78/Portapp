import { Outlet } from '@remix-run/react';

import Footer from '~/components/Footer';
import HandsomeError from '~/components/HandsomeError';
import Header from '~/components/Header';
import { getBranches } from '~/services/branch.server';

export const loader = async () => {
  const branches = await getBranches();

  return {
    branches,
  };
};

export default function MainLayout() {
  return (
    <>
      <Header shadow />

      <Outlet />

      <Footer />
    </>
  );
}

export const ErrorBoundary = () => <HandsomeError />;
