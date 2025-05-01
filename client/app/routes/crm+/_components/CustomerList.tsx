import { Link, useSearchParams } from '@remix-run/react';
import {
  ICustomer,
  ICustomerListResponse,
} from '~/interfaces/customer.interface';
import Defer from '~/components/Defer';
import CustomerPagination from './CustomerPagination';

export default function CustomerList({
  customersPromise,
  selectedCustomers,
  setSelectedCustomers,
  visibleColumns,
}: {
  customersPromise: Promise<ICustomerListResponse>;
  selectedCustomers: ICustomer[];
  setSelectedCustomers: (customers: ICustomer[]) => void;
  visibleColumns: Partial<Record<keyof ICustomer, boolean>>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSelectAll = (cases: ICustomer[]) => {
    if (selectedCustomers.length === cases.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(cases);
    }
  };

  const handleCustomerSelect = (customer: ICustomer) => {
    if (selectedCustomers.some((item) => item.id === customer.id)) {
      setSelectedCustomers(
        selectedCustomers.filter((cus) => cus.id !== customer.id),
      );
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
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

  // Define table columns for the CustomerList component
  const columns: Column<ICustomer>[] = [
    {
      key: 'cus_fullName',
      title: 'Họ tên',
      sortField: 'cus_fullName',
      visible: visibleColumns.cus_fullName,
    },
    {
      key: 'cus_phone',
      title: 'Điện thoại',
      sortField: 'cus_phone',
      visible: visibleColumns.cus_phone,
    },
    {
      key: 'cus_email',
      title: 'Email',
      sortField: 'cus_email',
      visible: visibleColumns.cus_email,
    },
    {
      key: 'cus_address',
      title: 'Địa chỉ',
      sortField: 'cus_address',
      visible: visibleColumns.cus_address,
    },
  ];

  return (
    <Defer resolve={customersPromise}>
      {(response) => {
        const { data: customers, pagination } = response;

        if (!customers || customers.length === 0) {
          // Empty State
          return (
            <div className='py-12 flex flex-col items-center justify-center'>
              <div className='bg-gray-100 rounded-full p-6 mb-4'>
                <span className='material-symbols-outlined text-5xl text-gray-400'>
                  person_off
                </span>
              </div>
              <h3 className='text-xl font-medium text-gray-800 mb-2'>
                Chưa có khách hàng nào
              </h3>
              <p className='text-gray-500 mb-6 text-center max-w-md'>
                Thêm khách hàng đầu tiên của bạn để bắt đầu quản lý thông tin và
                lịch hẹn của họ.
              </p>
              <Link
                to='/crm/khach-hang/new'
                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition shadow-sm flex items-center gap-2'
              >
                <span className='material-symbols-outlined text-sm'>add</span>
                Thêm khách hàng
              </Link>
            </div>
          );
        }

        return (
          <>
            {/* Desktop view */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <input
                        type='checkbox'
                        checked={
                          selectedCustomers.length === customers.length &&
                          customers.length > 0
                        }
                        onChange={() => handleSelectAll(customers)}
                        className='rounded text-blue-500'
                      />
                    </th>
                    {columns
                      .filter((column) => column.visible)
                      .map((column) => (
                        <th
                          key={column.key}
                          className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => {
                            // Use the sortField defined in the column definition
                            const sortKey = column.sortField || column.key;
                            handleSortChange(sortKey);
                          }}
                        >
                          <div className='flex items-center justify-between'>
                            <span>{column.title}</span>
                            <span className='w-4 h-4 inline-flex justify-center'>
                              {/* Check if this column is currently being sorted by */}
                              {sortBy === (column.sortField || column.key) && (
                                <span className='material-symbols-outlined text-xs'>
                                  {sortOrder === 'asc'
                                    ? 'arrow_upward'
                                    : 'arrow_downward'}
                                </span>
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {customers.map((customer: ICustomer) => (
                    <tr key={customer.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <input
                          type='checkbox'
                          checked={selectedCustomers.some(
                            (item) => item.id === customer.id,
                          )}
                          onChange={() => handleCustomerSelect(customer)}
                          className='rounded text-blue-500'
                        />
                      </td>
                      {visibleColumns.cus_fullName && (
                        <td className='px-4 py-4'>
                          <div className='flex items-center'>
                            <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3'>
                              {customer.cus_fullName.charAt(0)}
                            </div>
                            <div>
                              <div className='text-sm font-medium text-gray-900'>
                                <Link to={`/crm/khach-hang/${customer.id}`}>
                                  {customer.cus_fullName}
                                </Link>
                              </div>
                              <div className='text-xs text-gray-500'>
                                {customer.cus_dateOfBirth
                                  ? new Date(
                                      customer.cus_dateOfBirth,
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.cus_phone && (
                        <td className='px-4 py-4'>
                          <div className='text-sm text-gray-900'>
                            {customer.cus_phone}
                          </div>
                        </td>
                      )}
                      {visibleColumns.cus_email && (
                        <td className='px-4 py-4'>
                          <div className='text-sm text-gray-900'>
                            {customer.cus_email || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.cus_address && (
                        <td className='px-4 py-4'>
                          <div className='text-sm text-gray-900 max-w-xs truncate'>
                            {customer.cus_address || 'N/A'}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CustomerPagination pagination={pagination} />
          </>
        );
      }}
    </Defer>
  );
}

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortField?: keyof T;
  visible?: boolean;
}
