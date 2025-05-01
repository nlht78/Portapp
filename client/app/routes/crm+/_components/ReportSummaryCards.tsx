import { useEffect, useState } from 'react';
import Defer from '~/components/Defer';
import { formatCurrency } from '~/utils';

export default function ReportSummaryCards({
  currentRevenue: cRev,
  currentDebt: cDebt,
  pastRevenue: pRev,
  pastDebt: pDebt,
  type,
}: {
  currentRevenue: Promise<number>;
  currentDebt: Promise<number>;
  pastRevenue: Promise<number>;
  pastDebt: Promise<number>;
  type: string;
}) {
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [currentDebt, setCurrentDebt] = useState(0);
  const [pastRevenue, setPastRevenue] = useState(0);
  const [pastDebt, setPastDebt] = useState(0);
  const [currentActualIncome, setCurrentActualIncome] = useState(0);
  const [pastActualIncome, setPastActualIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [curRev, curDebt, pastRev, pastDebt] = await Promise.all([
        cRev,
        cDebt,
        pRev,
        pDebt,
      ]);
      setCurrentRevenue(curRev);
      setCurrentDebt(curDebt);
      setPastRevenue(pastRev);
      setPastDebt(pastDebt);
      setCurrentActualIncome(curRev - curDebt);
      setPastActualIncome(pastRev - pastDebt);
      setLoading(false);
    })();
  }, [type]);

  const revDiff = ((currentRevenue - pastRevenue) / pastRevenue) * 100 || 100;
  const debtDiff = ((currentDebt - pastDebt) / pastDebt) * 100 || 100;
  const actualIncomeDiff =
    ((currentActualIncome - pastActualIncome) / pastActualIncome) * 100 || 100;

  const unit = type === 'daily' ? 'ngày' : type === 'weekly' ? 'tuần' : 'tháng';

  return (
    <div className='p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition'>
        <div className='flex justify-between items-start mb-3'>
          <div>
            <h3 className='text-sm font-medium text-gray-500'>
              Tổng doanh thu
            </h3>
            {loading ? (
              <span className='text-2xl font-bold text-gray-800'>
                Loading...
              </span>
            ) : (
              <div className='flex items-baseline mt-1'>
                <span className='text-2xl font-bold text-gray-800'>
                  {formatCurrency(currentRevenue)}
                </span>
                <span
                  className={`ml-2 text-sm font-medium flex items-center ${
                    revDiff >= 0 ? 'text-green-500' : 'text-red-600'
                  }`}
                >
                  {revDiff >= 0 ? (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_upward
                    </span>
                  ) : (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_downward
                    </span>
                  )}
                  {revDiff.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className='p-2 pb-1 bg-blue-50 rounded-lg'>
            <span className='material-symbols-outlined text-blue-600'>
              request_quote
            </span>
          </div>
        </div>

        {loading ? (
          <p className='text-xs text-gray-500'>Loading...</p>
        ) : (
          <p className='text-xs text-gray-500'>
            So với <b>{formatCurrency(pastRevenue)}</b> {unit} trước
          </p>
        )}
      </div>

      <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition'>
        <div className='flex justify-between items-start mb-3'>
          <div>
            <h3 className='text-sm font-medium text-gray-500'>Tổng nợ</h3>

            {loading ? (
              <span className='text-2xl font-bold text-gray-800'>
                Loading...
              </span>
            ) : (
              <div className='flex items-baseline mt-1'>
                <span className='text-2xl font-bold text-gray-800'>
                  {formatCurrency(currentDebt)}
                </span>
                <span
                  className={`ml-2 text-sm font-medium flex items-center ${
                    debtDiff >= 0 ? 'text-green-500' : 'text-red-600'
                  }`}
                >
                  {debtDiff >= 0 ? (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_upward
                    </span>
                  ) : (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_downward
                    </span>
                  )}
                  {debtDiff.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className='p-2 pb-1 bg-orange-50 rounded-lg'>
            <span className='material-symbols-outlined text-orange-600'>
              credit_card
            </span>
          </div>
        </div>

        {loading ? (
          <p className='text-xs text-gray-500'>Loading...</p>
        ) : (
          <p className='text-xs text-gray-500'>
            So với <b>{formatCurrency(pastDebt)}</b> {unit} trước
          </p>
        )}
      </div>

      <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition'>
        <div className='flex justify-between items-start mb-3'>
          <div>
            <h3 className='text-sm font-medium text-gray-500'>Thực tiền</h3>

            {loading ? (
              <span className='text-2xl font-bold text-gray-800'>
                Loading...
              </span>
            ) : (
              <div className='flex items-baseline mt-1'>
                <span className='text-2xl font-bold text-gray-800'>
                  {formatCurrency(currentActualIncome)}
                </span>
                <span
                  className={`ml-2 text-sm font-medium flex items-center ${
                    debtDiff >= 0 ? 'text-green-500' : 'text-red-600'
                  }`}
                >
                  {debtDiff >= 0 ? (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_upward
                    </span>
                  ) : (
                    <span className='material-symbols-outlined text-sm'>
                      arrow_downward
                    </span>
                  )}
                  {actualIncomeDiff.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className='p-2 pb-1 bg-green-50 rounded-lg'>
            <span className='material-symbols-outlined text-green-600'>
              payments
            </span>
          </div>
        </div>

        {loading ? (
          <p className='text-xs text-gray-500'>Loading...</p>
        ) : (
          <p className='text-xs text-gray-500'>
            So với <b>{formatCurrency(pastActualIncome)}</b> {unit} trước
          </p>
        )}
      </div>
    </div>
  );
}
