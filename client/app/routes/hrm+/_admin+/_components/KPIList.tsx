import { IKPI } from '~/interfaces/kpi.interface';
import Defer from '@components/Defer';
import { Link, useFetcher, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { action } from '../kpi+/$id';
import HRMButton from '../../_components/HRMButton';

export default function KPIList({
  kpis,
  status,
}: {
  kpis: Promise<IKPI[]>;
  status: string;
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
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h3 className='text-lg font-semibold'>Danh sách KPI</h3>
        <div className='flex space-x-2 mt-2 sm:mt-0'>
          <button className='px-3 py-1 text-xs border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
            Tuần
          </button>
          <button className='px-3 py-1 text-xs border border-transparent rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-200'>
            Tháng
          </button>
          <button className='px-3 py-1 text-xs border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
            Quý
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='font-normal text-gray-700 bg-gray-50'>
            <tr className='text-left'>
              <th className='px-6 py-3'>Tên KPI</th>
              <th>Nhân viên</th>
              <th className='text-center'>Trạng thái</th>
              <th className='text-center'>Chu kỳ</th>
              <th className='text-center'>Cập nhật</th>
              <th className='text-center'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            <Defer
              resolve={kpis}
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

                // Filter KPIs based on status
                const filteredKPIs = data.filter((kpi) => {
                  if (!status) return true; // Show all if no status filter
                  return status === 'active' ? kpi.isActive : !kpi.isActive;
                });

                if (filteredKPIs.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-4 text-center text-gray-500'
                      >
                        {status
                          ? `Không tìm thấy KPI ${status === 'active' ? 'đang hoạt động' : 'không hoạt động'}`
                          : 'Không tìm thấy KPI nào'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {filteredKPIs.map((kpi) => (
                      <tr
                        key={kpi.id}
                        className='hover:bg-gray-50 transition-colors duration-200 text-center'
                      >
                        <td className='px-6 text-start'>
                          <div className='text-sm font-medium text-gray-900'>
                            {kpi.name}
                          </div>
                          <div className='text-xs text-gray-500 truncate'>
                            {kpi.description}
                          </div>
                        </td>
                        <td>
                          <div className='text-sm text-gray-900 text-start'>
                            {kpi.assigneeId.usr_firstName}{' '}
                            {kpi.assigneeId.usr_lastName}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              kpi.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {kpi.isActive
                              ? 'Đang hoạt động'
                              : 'Không hoạt động'}
                          </span>
                        </td>
                        <td>
                          <div className='text-sm text-gray-900'>
                            {(() => {
                              switch (kpi.intervalType) {
                                case 'daily':
                                  return 'Hàng ngày';
                                case 'weekly':
                                  return 'Hàng tuần';
                                case 'monthly':
                                  return 'Hàng tháng';
                                case 'quarterly':
                                  return 'Hàng quý';
                                case 'yearly':
                                  return 'Hàng năm';
                                default:
                                  return 'Không xác định';
                              }
                            })()}
                          </div>
                        </td>
                        <td>
                          {new Date(kpi.updatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm flex gap-4 justify-center'>
                          <HRMButton
                            color='red'
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa KPI này?'))
                                fetcher.submit(null, {
                                  method: 'DELETE',
                                  action: `/hrm/kpi/${kpi.id}`,
                                });
                            }}
                            disabled={loading}
                          >
                            <span className='material-symbols-outlined text-sm'>
                              delete
                            </span>
                          </HRMButton>

                          <HRMButton tagType='link' href={`/hrm/kpi/${kpi.id}`}>
                            <span className='material-symbols-outlined text-sm'>
                              edit
                            </span>
                          </HRMButton>
                        </td>
                      </tr>
                    ))}
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
