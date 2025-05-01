import { useEffect, useRef, useState } from 'react';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs } from '@remix-run/node';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import { toast } from 'react-toastify';

import Timer from '../_components/Timer';
import CheckInCard from '../_components/CheckInCard';
import CheckOutCard from '../_components/CheckOutCard';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import HandsomeError from '~/components/HandsomeError';
import {
  checkIn,
  checkOut,
  getLast7DaysStats,
  getTodayAttendance,
} from '~/services/attendance.server';
import AskForGeoPermissionPopup from '../_components/AskForGeoPermissionPopup';
import Defer from '~/components/Defer';
import AttendanceLog from '../../_components/AttendanceLog';

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await isAuthenticated(request);
  const ipAddress = getClientIPAddress(request);
  // console.log(ipAddress);
  if (['production'].includes(process.env.NODE_ENV as string)) {
    if (!ipAddress) {
      return {
        toast: { type: 'error', message: 'IP address not found' },
        status: 400,
      };
    }
  }

  switch (request.method) {
    case 'POST': {
      const body = await request.formData();
      const type = body.get('type') || 'check-in';
      const fingerprint = (body.get('fingerprint') as string) || '';
      const longitude = parseFloat(body.get('longitude') as string) || 106;
      const latitude = parseFloat(body.get('latitude') as string) || 10;

      if (!ipAddress) {
        return {
          toast: { type: 'error', message: 'Không tìm thấy địa chỉ IP' },
          status: 404,
        };
      }

      const data = {
        fingerprint,
        ip: ipAddress || '1.1.1.1',
        geolocation: { longitude, latitude },
        userId: user!.user.id,
      };

      try {
        if (type === 'check-in') {
          await checkIn(data, user!);
        } else if (type === 'check-out') {
          await checkOut(data, user!);
        }

        return {
          toast: {
            type: 'success',
            message:
              type === 'check-in'
                ? 'Điểm danh thành công!'
                : 'Kết thúc ca làm việc thành công!',
          },
        };
      } catch (error: any) {
        console.error(error);
        return {
          toast: { type: 'error', message: error.message || error.statusText },
          status: error.status || 500,
        };
      }
    }

    default:
      return {
        toast: { type: 'error', message: 'Method not allowed' },
        status: 405,
      };
  }
};

export const loader = async ({ request }: ActionFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    const last7DaysStats = getLast7DaysStats(user!.user.id, user!).catch(
      (error) => {
        console.error(error.message || error.statusText);
        return [];
      },
    );

    return { last7DaysStats };
  } catch (error: any) {
    console.error(error.message || error.statusText);
    return { last7DaysStats: Promise.resolve([]) };
  }
};

export default function Attendance() {
  const [fingerprint, setFingerprint] = useState('');
  // const [longitude, setLongitude] = useState(0);
  // const [latitude, setLatitude] = useState(0);
  // const [hasPermission, setHasPermission] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const { last7DaysStats } = useLoaderData<typeof loader>();

  useEffect(() => {
    import('@thumbmarkjs/thumbmarkjs').then((module) => {
      module
        .getFingerprint()
        .then((result) => {
          setFingerprint(result);
        })
        .catch((error) => {
          console.error('Error getting fingerprint:', error);
        });
    });

    // function checkPermission() {
    //   navigator.permissions.query({ name: 'geolocation' }).then((result) => {
    //     const handlePermission = () => {
    //       if (result.state === 'granted') {
    //         setHasPermission(true);
    //         navigator.geolocation.getCurrentPosition((position) => {
    //           setLongitude(position.coords.longitude);
    //           setLatitude(position.coords.latitude);
    //         });
    //       } else if (result.state === 'prompt') {
    //         navigator.geolocation.getCurrentPosition(
    //           (position) => {
    //             setLongitude(position.coords.longitude);
    //             setLatitude(position.coords.latitude);
    //             setHasPermission(true);
    //           },
    //           (error) => {
    //             console.error('Error getting geolocation:', error);
    //             setHasPermission(false);
    //             toast.error(
    //               'Vui lòng cấp quyền truy cập vị trí để chấm công.',
    //               {
    //                 autoClose: 3000,
    //               },
    //             );
    //             setTimeout(() => {
    //               window.location.reload();
    //             }, 3000);
    //           },
    //         );
    //       } else if (result.state === 'denied') {
    //         setHasPermission(false);
    //       }
    //     };

    //     handlePermission();

    //     result.onchange = handlePermission;
    //   });
    // }

    // checkPermission();
  }, []);

  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Loading...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'idle':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);
          break;
        }

        toast.update(toastIdRef.current, {
          render: fetcher.data?.toast.message,
          autoClose: 3000,
          isLoading: false,
          type: 'error',
        });
        setLoading(false);
        break;
    }
  }, [fetcher.state]);

  return (
    <>
      {/* Clock In/Out Card */}
      <div className='bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8'>
        <div className='flex flex-col md:flex-row justify-between items-center mb-6'>
          <div className='text-center md:text-left mb-4 md:mb-0'>
            <h2 className='text-lg font-semibold mb-1'>Theo dõi chấm công</h2>

            <p className='text-sm text-gray-500'>
              Điểm danh ngày làm việc hôm nay,{' '}
              {new Date().toLocaleDateString('vi', {
                weekday: 'long',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })}
            </p>
          </div>

          <Timer />
        </div>

        <fetcher.Form
          method='POST'
          className='flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-6'
        >
          <Defer resolve={last7DaysStats}>
            {(data) => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const today = data.find(
                (item) => item.date === now.toISOString(),
              );

              return (
                <>
                  <CheckInCard attendance={today} loading={loading} />
                  <CheckOutCard attendance={today} loading={loading} />
                </>
              );
            }}
          </Defer>

          <input type='hidden' name='fingerprint' defaultValue={fingerprint} />
          {/* <input type='hidden' name='longitude' defaultValue={longitude} />
          <input type='hidden' name='latitude' defaultValue={latitude} /> */}
        </fetcher.Form>
      </div>

      <Defer resolve={last7DaysStats}>
        {(data) => <AttendanceLog attendanceStats={data} />}
      </Defer>

      {/* {!hasPermission && <AskForGeoPermissionPopup />} */}
    </>
  );
}

export const ErrorBoundary = () => <HandsomeError basePath='/diem-danh' />;
