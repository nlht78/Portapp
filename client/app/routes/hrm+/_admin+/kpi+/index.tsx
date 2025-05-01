import { LoaderFunctionArgs } from '@remix-run/node';
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import { useState, useEffect } from 'react';
import Defer from '~/components/Defer';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { getKPIs, getKPIsWithInstances } from '~/services/kpi.server';
import ContentHeader from '../_components/ContentHeader';
import KPIList from '../_components/KPIList';
import HRMButton from '../../_components/HRMButton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const kpisPromise = getKPIs(user!).catch((error) => {
      console.error('Error fetching KPIs:', error);
      return [];
    });

    return {
      kpis: Promise.resolve(kpisPromise),
    };
  } catch (error) {
    console.error('Loader Error:', error);
    return {
      kpis: Promise.resolve([]),
    };
  }
};

export default function HRMKPI() {
  const { kpis } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || '',
  );
  const [intervalFilter, setIntervalFilter] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | null
  >(
    (searchParams.get('interval') as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'quarterly'
      | null) || null,
  );
  const [statusFilter, setStatusFilter] = useState<
    'active' | 'inactive' | null
  >((searchParams.get('status') as 'active' | 'inactive' | null) || null);

  useEffect(() => {
    console.log('Component KPIs:', kpis);
    console.log('Component Performance:', performance);
  }, [kpis, performance]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (intervalFilter) {
      params.set('interval', intervalFilter);
    }

    if (statusFilter) {
      params.set('status', statusFilter);
    }

    if (searchQuery) {
      params.set('search', searchQuery);
    }

    setSearchParams(params);
  }, [intervalFilter, statusFilter, searchQuery, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const handleStatusFilter = (status: 'active' | 'inactive' | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  const handleIntervalFilter = (
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | null,
  ) => {
    setIntervalFilter(interval === intervalFilter ? null : interval);
  };

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Quản lý KPI'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm KPI mới
          </>
        }
        actionHandler={() => navigate('/hrm/kpi/new')}
      />

      {/* Search and Filter */}
      <div className='bg-white rounded-lg shadow-sm p-4 mb-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <fetcher.Form onSubmit={handleSearch} className='flex-1'>
            <div className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm kiếm KPI...'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
              />
              <button
                type='submit'
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500'
              >
                <span className='material-symbols-outlined'>search</span>
              </button>
            </div>
          </fetcher.Form>
          <div className='flex gap-2'>
            <HRMButton
              onClick={() => handleStatusFilter(null)}
              color={statusFilter === null ? 'blue' : 'transparent'}
            >
              Tất cả
            </HRMButton>

            <HRMButton
              color={statusFilter === 'active' ? 'green' : 'transparent'}
              onClick={() => handleStatusFilter('active')}
            >
              Đang hoạt động
            </HRMButton>

            <HRMButton
              color={statusFilter === 'inactive' ? 'red' : 'transparent'}
              onClick={() => handleStatusFilter('inactive')}
            >
              Không hoạt động
            </HRMButton>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Tổng số KPI</p>
              <h3 className='text-2xl font-bold'>
                <Defer resolve={kpis}>
                  {(data) => {
                    return Array.isArray(data) ? data.length : 0;
                  }}
                </Defer>
              </h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                KPI đang hoạt động
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-500'>
                assessment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI List */}
      <KPIList kpis={kpis} status={searchParams.get('status') || ''} />
    </>
  );
}
