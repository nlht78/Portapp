import { useSearchParams } from '@remix-run/react';
import { useState } from 'react';
import { ICaseService } from '~/interfaces/caseService.interface';

export default function CaseServiceToolbar({
  visibleColumns,
  setVisibleColumns,
}: {
  visibleColumns: Partial<Record<keyof ICaseService, boolean>>;
  setVisibleColumns: (columns: { [key: string]: boolean }) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    string | null
  >(searchParams.get('paymentStatus') || null);
  const [startDate, setStartDate] = useState<string>(
    searchParams.get('startDate') || '',
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get('endDate') || '',
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      searchParams.set('search', searchTerm);
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleDateFilter = () => {
    if (startDate) {
      searchParams.set('startDate', startDate);
    } else {
      searchParams.delete('startDate');
    }
    if (endDate) {
      searchParams.set('endDate', endDate);
    } else {
      searchParams.delete('endDate');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePaymentStatusFilter = (status: string | null) => {
    if (status) {
      searchParams.set('paymentStatus', status);
    } else {
      searchParams.delete('paymentStatus');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
    setSelectedPaymentStatus(status);
  };

  // Add a new handler for column visibility
  const handleColumnVisibilityChange = (columnKey: keyof ICaseService) => {
    setVisibleColumns({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    });
  };

  return (
    <div className='p-4 border-b border-gray-200 flex flex-col md:flex-row md:flex-wrap gap-3 items-start md:items-center justify-between'>
      <form
        onSubmit={handleSearch}
        className='relative w-full md:flex-grow md:max-w-md'
      >
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined'>
          search
        </span>
        <input
          type='text'
          placeholder='Tìm kiếm theo tên, điện thoại, email...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </form>

      <div className='flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0'>
        <div className='relative'>
          <button
            className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'
            onClick={() => {
              const dropdown = document.getElementById('paymentStatusDropdown');
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
          >
            <span>
              Trạng thái thanh toán:{' '}
              {selectedPaymentStatus
                ? selectedPaymentStatus === 'paid'
                  ? 'Đã thanh toán đủ'
                  : 'Chưa thanh toán đủ'
                : 'Tất cả'}
            </span>
            <span className='material-symbols-outlined text-sm'>
              expand_more
            </span>
          </button>
          <div
            id='paymentStatusDropdown'
            className='hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden'
          >
            <div className='py-1'>
              <button
                onClick={() => handlePaymentStatusFilter(null)}
                className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
              >
                Tất cả
              </button>
              <button
                onClick={() => handlePaymentStatusFilter('paid')}
                className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
              >
                Đã thanh toán đủ
              </button>
              <button
                onClick={() => handlePaymentStatusFilter('unpaid')}
                className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
              >
                Chưa thanh toán đủ
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className='relative'>
          <button
            className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'
            onClick={() => {
              const dropdown = document.getElementById('dateFilterDropdown');
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
          >
            <span className='material-symbols-outlined text-sm'>
              calendar_month
            </span>
            <span>Lọc ngày hẹn</span>
          </button>
          <div
            id='dateFilterDropdown'
            className='hidden absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden'
          >
            <div className='p-3 space-y-3'>
              <div>
                <label
                  htmlFor='startDate'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Từ ngày
                </label>
                <input
                  type='date'
                  id='startDate'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label
                  htmlFor='endDate'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Đến ngày
                </label>
                <input
                  type='date'
                  id='endDate'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='flex justify-between pt-2'>
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    searchParams.delete('startDate');
                    searchParams.delete('endDate');
                    setSearchParams(searchParams);
                  }}
                  className='px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800'
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => {
                    handleDateFilter();
                    const dropdown =
                      document.getElementById('dateFilterDropdown');
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className='px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Select attributes to display */}
        <details className='relative'>
          <summary className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'>
            <span className='material-symbols-outlined text-sm'>
              view_column
            </span>
            <span>Cột</span>
          </summary>
          <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10'>
            <div className='p-3 space-y-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={visibleColumns.case_customerId}
                  onChange={() =>
                    handleColumnVisibilityChange('case_customerId')
                  }
                  className='rounded text-blue-500'
                />
                <span>Tên khách hàng</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={visibleColumns.case_price}
                  onChange={() => handleColumnVisibilityChange('case_price')}
                  className='rounded text-blue-500'
                />
                <span>Tổng quan</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={visibleColumns.case_consultantId}
                  onChange={() =>
                    handleColumnVisibilityChange('case_consultantId')
                  }
                  className='rounded text-blue-500'
                />
                <span>Nhân sự phụ trách</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={visibleColumns.case_appointmentDate}
                  onChange={() =>
                    handleColumnVisibilityChange('case_appointmentDate')
                  }
                  className='rounded text-blue-500'
                />
                <span>Ngày hẹn</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={visibleColumns.case_progressPercent}
                  onChange={() =>
                    handleColumnVisibilityChange('case_progressPercent')
                  }
                  className='rounded text-blue-500'
                />
                <span>Tiến độ</span>
              </label>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
