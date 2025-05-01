import { useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import ContentHeader from '~/routes/crm+/_components/ContentHeader';
import { isAuthenticated } from '~/services/auth.server';
import CustomerList from '../_components/CustomerList';
import {
  getCustomers,
  deleteMultipleCustomers,
} from '~/services/customer.server';
import { ICustomer } from '~/interfaces/customer.interface';
import CustomerToolbar from '../_components/CustomerToolbar';
import CustomerBulkActionBar from '../_components/CustomerBulkActionBar';
import CustomerConfirmModal from '../_components/CustomerConfirmModal';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      throw new Error('Unauthorized');
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const searchQuery = url.searchParams.get('search') || '';
    const paymentStatus = url.searchParams.get('paymentStatus') as
      | 'paid'
      | 'unpaid'
      | undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder =
      (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build a clean query object that matches the expected API format
    const query: any = {};

    // Search query - used for name, phone, email search
    if (searchQuery) {
      query.search = searchQuery;
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter for appointment date
    if (startDate) {
      query.startDate = startDate;
    }

    if (endDate) {
      query.endDate = endDate;
    }

    // Pagination options
    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    // Fetch customers data with case services
    const customersPromise = getCustomers(query, options, auth).catch(
      (fallbackError) => {
        console.error('Fallback error:', fallbackError);
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        };
      },
    );

    return {
      customersPromise,
    };
  } catch (error) {
    console.error('Loader error:', error);
    return {
      customersPromise: Promise.resolve({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    };
  }
};

// Action function để xử lý xóa khách hàng
export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await isAuthenticated(request);
  if (!auth) {
    return { success: false, error: 'Unauthorized' };
  }
  const formData = await request.formData();

  try {
    switch (request.method) {
      case 'DELETE':
        const customerIdsString = formData.get('customerIds') as string;
        if (!customerIdsString) {
          return { success: false, error: 'Missing customer IDs' };
        }

        const customerIds = JSON.parse(customerIdsString);
        await deleteMultipleCustomers(customerIds, auth);

        return {
          success: true,
          message: `Đã xóa ${customerIds.length} khách hàng thành công`,
        };

      default:
        return { success: false, error: 'Method not allowed' };
    }
  } catch (error: any) {
    console.error('Action error:', error);
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
    };
  }
};

export default function CustomerIndex() {
  const { customersPromise } = useLoaderData<typeof loader>();

  const [selectedCustomers, setSelectedCustomers] = useState<ICustomer[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    Partial<Record<keyof ICustomer, boolean>>
  >({
    cus_fullName: true,
    cus_phone: true,
    cus_email: true,
    cus_address: true,
  });

  const navigate = useNavigate();

  return (
    <>
      <ContentHeader
        title='Khách hàng'
        actionContent='Thêm khách hàng'
        actionHandler={() => navigate('/crm/khach-hang/new')}
      />

      <div className='mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Toolbar */}
        <CustomerToolbar
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedCustomers.length > 0 && (
          <CustomerBulkActionBar
            selectedCustomers={selectedCustomers}
            handleConfirmBulkDelete={() => setShowDeleteModal(true)}
          />
        )}

        {showDeleteModal && selectedCustomers.length && (
          <CustomerConfirmModal
            setShowDeleteModal={setShowDeleteModal}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
          />
        )}

        <CustomerList
          customersPromise={customersPromise}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          visibleColumns={visibleColumns}
        />
      </div>
    </>
  );
}
