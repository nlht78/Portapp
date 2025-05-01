import { Link, useFetcher } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Defer from '~/components/Defer';
import { IKPIInstance } from '~/interfaces/kpi.interface';
import { toVnDateString } from '~/utils';
import { action } from '../kpi+/$id';
import HRMButton from '../../_components/HRMButton';

export default function KPIInstanceList({
  kpiInstances,
}: {
  kpiInstances: Promise<IKPIInstance[]> | IKPIInstance[];
}) {
  const fetcher = useFetcher<typeof action>();

  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xoá...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'loading':
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

        break;
    }
  }, [fetcher.state]);

  return (
    <div className='bg-white rounded-lg shadow-sm p-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead>
            <tr className='bg-gray-50'>
              <th className='py-2'>Ngày bắt đầu</th>
              <th className=''>Ngày kết thúc</th>
              <th className=''>Tiến độ</th>
              <th className=''>Cập nhật lúc</th>
              <th className=''>Hành động</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            <Defer
              resolve={kpiInstances}
              fallback={
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-4 text-center text-gray-500'
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              }
            >
              {(data) => {
                if (!data.length) {
                  return (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-4 text-center text-gray-500'
                      >
                        Không có dữ liệu KPI
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {data.map((instance) => {
                      const completedPercent = Math.round(
                        (instance.completed / instance.goal) * 100,
                      );

                      return (
                        <tr
                          key={instance.id}
                          className='hover:bg-gray-50 transition-colors duration-200 text-sm text-center'
                        >
                          <td>{toVnDateString(instance.startDate)}</td>
                          <td>{toVnDateString(instance.endDate)}</td>
                          <td>
                            <div className='flex items-center justify-center py-3'>
                              <div className='w-1/2'>
                                <span>{`${instance.completed}/${instance.goal}`}</span>

                                <div className='w-full bg-gray-200 rounded-full h-2 text-xs'>
                                  <div
                                    className='bg-green-600 h-2 rounded-full'
                                    style={{
                                      width: `${completedPercent}%`,
                                      maxWidth: '100%',
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <span className='ml-2 text-sm text-gray-500'>
                                {completedPercent}%
                              </span>
                            </div>
                          </td>
                          <td className=''>
                            {new Date(instance.createdAt).toLocaleTimeString(
                              'vi-VN',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </td>

                          <td className='py-3 flex justify-center gap-4'>
                            {/* <HRMButton
                              color='blue'
                              className='px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 inline-flex items-center justify-center'
                            >
                              <span className='material-symbols-outlined text-sm'>
                                edit
                              </span>
                            </HRMButton> */}

                            <HRMButton
                              color='red'
                              onClick={() => {
                                if (
                                  confirm('Bạn có chắc chắn muốn xóa KPI này?')
                                )
                                  fetcher.submit(null, {
                                    method: 'DELETE',
                                    action: `/hrm/kpi/instances/${instance.id}`,
                                  });
                              }}
                              disabled={loading}
                            >
                              <span className='material-symbols-outlined text-sm'>
                                delete
                              </span>
                            </HRMButton>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              }}
            </Defer>
          </tbody>
        </table>
      </div>
    </div>
  );
}
