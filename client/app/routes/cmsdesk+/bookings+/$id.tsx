import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { getBookingDetail, setViewedBooking } from '~/services/booking.server';
import BookingDetail from '~/widgets/BookingDetail';
import {
  useLoaderData,
  useNavigate,
  useOutletContext,
  useRevalidator,
} from '@remix-run/react';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await isAuthenticated(request);

  const { id } = params;
  const { viewed } = (await request.json()) as any;

  try {
    const res = await setViewedBooking(id || '', viewed, user!);
    return res;
  } catch (error) {
    console.error('Error setting viewed booking:', error);
    return new Response(null, { status: 500 });
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await isAuthenticated(request);
  if (!user) {
    return new Response(null, { status: 401 });
  }

  try {
    if (!params.id) {
      throw new Response(null, { status: 400 });
    }
    const booking = await getBookingDetail(params.id, user);
    return { booking };
  } catch (error) {
    console.error('Error loading booking detail:', error);
    return { booking: null };
  }
};

export default function BookingDetailPopup() {
  const { booking } = useLoaderData<typeof loader>() as any;
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  return (
    <BookingDetail
      booking={booking}
      popupHidder={() => {
        navigate(-1);
        revalidator.revalidate();
      }}
    />
  );
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { booking } = data || {};
  return [{ title: `${booking?.bok_name}` }];
};
