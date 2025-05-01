import { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { authenticator, isAuthenticated } from '~/services/auth.server';
import { getBookings } from '~/services/booking.server';
import HandsomeError from '~/components/HandsomeError';
import BookingList from '~/widgets/BookingList';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      throw new Response(null, { status: 401 });
    }
    const bookings = await getBookings(user);

    return {
      bookings,
    };
  } catch (error) {
    console.error('Error loading bookings:', error);
    return { bookings: [] };
  }
};

export default function BookingManager() {
  const { bookings } = useLoaderData<typeof loader>();

  return (
    <div className='container grid grid-cols-12 gap-4'>
      <BookingList bookings={bookings} />

      <Outlet />
    </div>
  );
}

export const ErrorBoundary = () => <HandsomeError />;
