import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import CaseServiceToolbar from '../_components/CaseServiceToolbar';
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState } from 'react';
import CaseServiceBulkActionBar from '../_components/CaseServiceBulkActionBar';
import CaseServiceConfirmModal from '../_components/CaseServiceConfirmModal';
import { ICaseService } from '~/interfaces/caseService.interface';
import CaseServiceList from '../_components/CaseServiceList';
import { isAuthenticated } from '~/services/auth.server';
import { bulkDeleteCases, getCases } from '~/services/caseService.server';
import ContentHeader from '../_components/ContentHeader';

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
    const appointmentStartDate = url.searchParams.get('appointmentStartDate');
    const appointmentEndDate = url.searchParams.get('appointmentEndDate');

    // Build filter object
    const filter: any = {};

    // Thêm tham số tìm kiếm nếu có
    if (searchQuery) {
      filter.search = searchQuery;
    }

    // Thêm tham số trạng thái thanh toán nếu có
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Thêm tham số lọc theo ngày hẹn nếu có
    if (appointmentStartDate) {
      filter.appointmentStartDate = appointmentStartDate;
    }

    if (appointmentEndDate) {
      filter.appointmentEndDate = appointmentEndDate;
    }

    // Fetch case services data;
    const casesPromise = getCases(
      filter,
      { page, limit, sortBy, sortOrder },
      auth,
    ).catch((error) => {
      console.error('Error fetching cases:', error);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    });

    return {
      casesPromise,
    };
  } catch (error) {
    console.error('Loader error:', error);
    return {
      casesPromise: Promise.resolve({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    };
  }
};

export default function CaseServiceIndex() {
  const { casesPromise } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState<
    Partial<Record<keyof ICaseService, boolean>>
  >({
    case_customerId: true,
    case_consultantId: true,
    case_appointmentDate: true,
    case_price: true,
    case_progressPercent: true,
  });
  const [selectedCases, setSelectedCases] = useState<ICaseService[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleConfirmBulkDelete = () => {
    setShowDeleteModal(true);
  };

  return (
    <>
      <ContentHeader
        title='Quản lý ca dịch vụ'
        actionContent='Thêm ca dịch vụ'
        actionHandler={() => navigate('/crm/ca-dich-vu/new')}
      />

      <div className='mx-auto min-h-full bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Toolbar */}
        <CaseServiceToolbar
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedCases.length > 0 && (
          <CaseServiceBulkActionBar
            selectedCases={selectedCases}
            handleConfirmBulkDelete={handleConfirmBulkDelete}
          />
        )}

        {showDeleteModal && selectedCases.length && (
          <CaseServiceConfirmModal
            setShowDeleteModal={setShowDeleteModal}
            selectedCases={selectedCases}
            setSelectedCases={setSelectedCases}
          />
        )}

        <CaseServiceList
          casesPromise={casesPromise}
          selectedCases={selectedCases}
          setSelectedCases={setSelectedCases}
          visibleColumns={visibleColumns}
        />
      </div>
    </>
  );
}

// Action function để xử lý xóa khách hàng
export const action = async ({ request }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'DELETE':
      const auth = await isAuthenticated(request);
      if (!auth) {
        return { success: false, error: 'Unauthorized' };
      }

      const formData = await request.formData();

      try {
        const caseIdsString = formData.get('caseIds') as string;
        if (!caseIdsString) {
          return { success: false, error: 'Missing case IDs' };
        }

        const caseIds = JSON.parse(caseIdsString);
        await bulkDeleteCases(caseIds, auth);

        return {
          success: true,
          message: `Đã xóa ${caseIds.length} ca dịch vụ thành công!`,
        };
      } catch (error: any) {
        console.error('Action error:', error);
        return {
          success: false,
          error: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
        };
      }

    default:
      return {
        success: false,
        error: 'Method not allowed',
      };
  }
};
