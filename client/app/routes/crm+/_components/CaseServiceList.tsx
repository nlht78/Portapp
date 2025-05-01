import { Link, useSearchParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import {
  ICaseListResponse,
  ICaseService,
} from '~/interfaces/caseService.interface';
import { formatCurrency, formatDate } from '~/utils';
import CaseServiceStatusDetail from './CaseServiceStatusDetail';
import Defer from '~/components/Defer';
import CaseServicePagination from './CaseServicePagination';

export default function CaseServiceList({
  casesPromise,
  selectedCases,
  setSelectedCases,
  visibleColumns,
}: {
  casesPromise: Promise<ICaseListResponse>;
  selectedCases: ICaseService[];
  setSelectedCases: (cases: ICaseService[]) => void;
  visibleColumns: Partial<Record<keyof ICaseService, boolean>>;
}) {
  const [showStatusModal, setShowStatusModal] = useState<null | ICaseService>(
    null,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSelectAll = (cases: ICaseService[]) => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(cases);
    }
  };

  const handleCaseSelect = (caseService: ICaseService) => {
    if (selectedCases.some((item) => item.id === caseService.id)) {
      setSelectedCases(
        selectedCases.filter((item) => item.id !== caseService.id),
      );
    } else {
      setSelectedCases([...selectedCases, caseService]);
    }
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      searchParams.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      searchParams.set('sortBy', column);
      searchParams.set('sortOrder', 'desc');
    }
    setSearchParams(searchParams);
  };

  const columns: Column<ICaseService>[] = [
    {
      key: 'customer',
      header: 'Tên khách hàng',
      sortField: 'case_customerId',
      render: (item) => (
        <Link
          to={`/crm/ca-dich-vu/${item.id}`}
          className='text-blue-600 hover:underline'
        >
          {typeof item.case_customerId === 'object'
            ? item.case_customerId.cus_fullName
            : 'Khách hàng'}
        </Link>
      ),
      visible: visibleColumns.case_customerId,
    },
    {
      key: 'overview',
      header: 'Tổng quan',
      sortField: 'case_price',
      render: (item) => (
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <span className='text-gray-500'>Giá:</span>
            <span className='font-medium'>
              {formatCurrency(item.case_price)}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-500'>Công nợ:</span>
            <span className='font-medium'>
              {formatCurrency(item.case_debt)}
              {item.case_debt === 0 && (
                <span className='material-symbols-outlined text-green-500 text-sm ml-1'>
                  check_circle
                </span>
              )}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-500'>Thanh toán:</span>
            <span className='font-medium'>
              {item.case_paymentMethod === 'cash'
                ? 'Tiền mặt'
                : item.case_paymentMethod === 'transfer'
                  ? 'Chuyển khoản'
                  : item.case_paymentMethod === 'card'
                    ? 'Thẻ'
                    : item.case_paymentMethod === 'other'
                      ? 'Khác'
                      : item.case_paymentMethod}
            </span>
          </div>
          <div className='text-xs text-gray-500'>
            Đã thanh toán: {formatCurrency(item.case_amountPaid)}
          </div>
        </div>
      ),
      visible: visibleColumns.case_price,
    },
    {
      key: 'staff',
      header: 'Nhân sự phụ trách',
      sortField: 'case_consultantId',
      render: (item) => (
        <div className='space-y-1'>
          {(item.case_consultantId || item.case_consultantName) && (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Tư vấn:</span>
              <span className='font-medium'>
                {item.case_consultantId
                  ? item.case_consultantId.userId.usr_firstName
                  : item.case_consultantName}
              </span>
            </div>
          )}
          {(item.case_fingerprintTakerId || item.case_fingerprintTakerName) && (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Lấy dấu:</span>
              <span className='font-medium'>
                {item.case_fingerprintTakerId
                  ? item.case_fingerprintTakerId.userId.usr_firstName
                  : item.case_fingerprintTakerName}
              </span>
            </div>
          )}
          {(item.case_mainCounselorId || item.case_counselorName) && (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Tư vấn chính:</span>
              <span className='font-medium'>
                {item.case_mainCounselorId
                  ? item.case_mainCounselorId.userId.usr_firstName
                  : item.case_counselorName}
              </span>
            </div>
          )}
        </div>
      ),
      visible: visibleColumns.case_consultantId,
    },
    {
      key: 'schedule',
      header: 'Lịch hẹn',
      sortField: 'case_appointmentDate',
      render: (item) => (
        <div className='space-y-1'>
          {item.case_appointmentDate && (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Ngày hẹn:</span>
              <span className='font-medium'>
                {formatDate(item.case_appointmentDate)}
              </span>
            </div>
          )}
          {item.case_eventLocation && (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Địa điểm:</span>
              <span className='font-medium'>{item.case_eventLocation}</span>
            </div>
          )}
        </div>
      ),
      visible: visibleColumns.case_appointmentDate,
    },
    {
      key: 'progress',
      header: 'Tiến độ',
      sortField: 'case_progressPercent',
      render: (item) => {
        // Tạo đối tượng processStatus nếu chưa có
        const processStatus = item.case_processStatus || {
          isScanned: item.case_isScanned,
          isFullInfo: item.case_isFullInfo,
          isAnalysisSent: item.case_isAnalysisSent,
          isPdfExported: item.case_isPdfExported,
          isFullyPaid: item.case_isFullyPaid,
          isSoftFileSent: item.case_isSoftFileSent,
          isPrinted: item.case_isPrintedAndSent,
          isPhysicalCopySent: item.case_isPhysicalCopySent,
          isDeepConsulted: item.case_isDeepConsulted,
        };

        // Đếm số bước đã hoàn thành
        const completedSteps =
          Object.values(processStatus).filter(Boolean).length;
        const totalSteps = Object.keys(processStatus).length;
        const progressPercent = Math.round((completedSteps / totalSteps) * 100);

        return (
          <div className='space-y-2'>
            <div className='w-full'>
              <div className='flex justify-between mb-1 text-xs'>
                <span>
                  {completedSteps}/{totalSteps} bước
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full ${
                    progressPercent < 33
                      ? 'bg-red-500'
                      : progressPercent < 66
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-x-2 gap-y-1 mt-1'>
              <StatusItem
                label='Lấy dấu'
                isCompleted={!!processStatus.isScanned}
              />
              <StatusItem
                label='Hoàn thông tin'
                isCompleted={!!processStatus.isFullInfo}
              />
              <StatusItem
                label='Gửi phân tích'
                isCompleted={!!processStatus.isAnalysisSent}
              />
              <StatusItem
                label='Xuất PDF'
                isCompleted={!!processStatus.isPdfExported}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusModal(item);
              }}
              className='text-xs text-blue-500 hover:underline mt-1'
            >
              Xem tất cả
            </button>
            {item.case_progressNote && (
              <div className='text-sm text-gray-600 truncate max-w-xs'>
                {item.case_progressNote}
              </div>
            )}
          </div>
        );
      },
      visible: visibleColumns.case_progressPercent,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStatusModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Defer resolve={casesPromise}>
      {({ data: cases, pagination }) => {
        if (!cases || cases.length === 0) {
          return (
            <div className='py-12 flex flex-col items-center justify-center'>
              <div className='bg-gray-100 rounded-full p-6 mb-4'>
                <span className='material-symbols-outlined text-5xl text-gray-400'>
                  description
                </span>
              </div>
              <h3 className='text-xl font-medium text-gray-800 mb-2'>
                Chưa có ca dịch vụ nào
              </h3>
              <p className='text-gray-500 mb-6 text-center max-w-md'>
                Thêm ca dịch vụ đầu tiên của bạn để bắt đầu quản lý thông tin và
                tiến độ.
              </p>
            </div>
          );
        }

        return (
          <>
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <input
                        type='checkbox'
                        checked={
                          selectedCases.length === cases.length &&
                          cases.length > 0
                        }
                        onChange={() => handleSelectAll(cases)}
                        className='rounded text-blue-500'
                      />
                    </th>
                    {columns
                      .filter((col) => col.visible)
                      .map((column, i) => (
                        <th
                          key={i}
                          className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => {
                            if (column.sortField) {
                              handleSortChange(column.sortField as string);
                            }
                          }}
                        >
                          <div className='flex items-center justify-between'>
                            <span>{column.header}</span>
                            {column.sortField && (
                              <span className='w-4 h-4 inline-flex justify-center'>
                                {sortBy === column.sortField && (
                                  <span className='material-symbols-outlined text-xs'>
                                    {sortOrder === 'asc'
                                      ? 'arrow_upward'
                                      : 'arrow_downward'}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {cases.map((caseService, i) => (
                    <tr key={i} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <input
                          type='checkbox'
                          checked={selectedCases.some(
                            (item) => item.id === caseService.id,
                          )}
                          onChange={() => handleCaseSelect(caseService)}
                          className='rounded text-blue-500'
                        />
                      </td>
                      {columns
                        .filter((col) => col.visible)
                        .map((column) => (
                          <td
                            key={column.key as string}
                            className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'
                          >
                            {column.render(caseService)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {showStatusModal && (
                <CaseServiceStatusDetail
                  caseService={showStatusModal}
                  onClose={() => setShowStatusModal(null)}
                />
              )}
            </div>

            <CaseServicePagination pagination={pagination} />
          </>
        );
      }}
    </Defer>
  );
}

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortField?: keyof T;
  render: (item: T) => React.ReactNode;
  visible?: boolean;
}

// Component hiển thị chi tiết trạng thái với hover tooltip
const StatusItem = ({
  label,
  isCompleted,
}: {
  label: string;
  isCompleted: boolean;
}) => {
  return (
    <div
      className='flex items-center gap-1 text-xs'
      title={isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
    >
      <span
        className={`w-3 h-3 rounded-full flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
      ></span>
      <span className={`${isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
};
