import { ICaseServiceDailyReport } from '~/interfaces/caseService.interface';
import { useNavigate, useRevalidator } from '@remix-run/react';
import DoubleLineChart from './DoubleLineChart';
import { useState } from 'react';
import DoughnutChart from './DoughnutChart';

export default function ReportComparitonChart({
  currentReport,
  currentReportByEventLocation,
  currentReportByPartner,
  pastReport,
  pastReportByEventLocation,
  pastReportByPartner,
  type,
  date,
}: {
  currentReport: Promise<ICaseServiceDailyReport[]>;
  currentReportByEventLocation: Promise<ICaseServiceDailyReport[]>;
  currentReportByPartner: Promise<ICaseServiceDailyReport[]>;
  pastReport: Promise<ICaseServiceDailyReport[]>;
  pastReportByEventLocation: Promise<ICaseServiceDailyReport[]>;
  pastReportByPartner: Promise<ICaseServiceDailyReport[]>;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
}) {
  const [activeIndex, setActiveIndex] = useState<
    'revenue' | 'debt' | 'actualIncome'
  >('revenue');
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const handleRotataionTypeChange = (type: 'monthly' | 'daily' | 'weekly') => {
    const params = new URLSearchParams(window.location.search);
    if (type) {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    navigate(`?${params.toString()}`, {
      replace: true,
    });
    revalidator.revalidate();
    toggleDropdown('rotationTypeDropdown');
  };

  const unit = type === 'daily' ? 'ngày' : type === 'weekly' ? 'tuần' : 'tháng';

  return (
    <div className='p-4 border-t border-gray-200'>
      <div className='mb-6'>
        <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>
              So sánh chỉ số
            </h2>

            <div className='filter'>
              <div className='flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0'>
                <div className='relative'>
                  <button
                    className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'
                    onClick={() => {
                      toggleDropdown('rotationTypeDropdown');
                    }}
                  >
                    <span>
                      Báo cáo:{' '}
                      {type === 'monthly'
                        ? 'Theo tháng'
                        : type === 'weekly'
                          ? 'Theo tuần'
                          : 'Theo ngày'}
                    </span>
                    <span className='material-symbols-outlined text-sm'>
                      expand_more
                    </span>
                  </button>
                  <div
                    id='rotationTypeDropdown'
                    className='hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden'
                  >
                    <div className='py-1'>
                      <button
                        onClick={() => handleRotataionTypeChange('monthly')}
                        className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
                      >
                        Theo tháng
                      </button>
                      <button
                        onClick={() => handleRotataionTypeChange('weekly')}
                        className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
                      >
                        Theo tuần
                      </button>
                      <button
                        onClick={() => handleRotataionTypeChange('daily')}
                        className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition'
                      >
                        Theo ngày
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className='forward'>
                <div
                  className='back'
                  onClick={() => {
                    navigate(
                      `/?type=${type}&date=${getPrevDate(
                        type,
                        new Date(date)
                      ).toISOString()}`
                    );
                    revalidator.revalidate();
                  }}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    height='1em'
                    viewBox='0 0 320 512'
                  >
                    <path d='M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z' />
                  </svg>
                </div>

                <span className='selection'>
                  {getLabelContent(type, new Date(date))}
                </span>

                <div
                  className='next'
                  onClick={() => {
                    navigate(
                      `/?type=${type}&date=${getNextDate(
                        type,
                        new Date(date)
                      ).toISOString()}`
                    );
                    revalidator.revalidate();
                  }}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    height='1em'
                    viewBox='0 0 320 512'
                  >
                    <path d='M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z' />
                  </svg>
                </div>
              </div> */}
            </div>
          </div>

          <div className='w-full flex gap-4 px-4 border-b border-gray-200 mb-4'>
            <button
              className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 ${
                activeIndex === 'revenue' ? 'border border-b-white' : ''
              }`}
              onClick={() => setActiveIndex('revenue')}
              type='button'
            >
              Doanh thu
            </button>
            <button
              className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 ${
                activeIndex === 'debt' ? 'border border-b-white' : ''
              }`}
              onClick={() => setActiveIndex('debt')}
              type='button'
            >
              Công nợ
            </button>
            <button
              className={`-mb-[1px] rounded-t px-2 py-1 border-zinc-200 ${
                activeIndex === 'actualIncome' ? 'border border-b-white' : ''
              }`}
              onClick={() => setActiveIndex('actualIncome')}
              type='button'
            >
              Thực thu
            </button>
          </div>

          <DoubleLineChart
            currentReport={currentReport}
            pastReport={pastReport}
            type={type}
            date={date}
            activeIndex={activeIndex}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        {/* By current event location */}
        <div className='h-[500px] bg-white p-4 border border-gray-200 rounded-lg shadow-sm'>
          <DoughnutChart
            id='currentReportByEventLocation'
            title={`Địa điểm sự kiện ${unit} này`}
            data={currentReportByEventLocation}
            groupName='eventLocation'
            type={type}
            activeIndex={activeIndex}
          />
        </div>

        {/* By past event location */}
        <div className='h-[500px] bg-white p-4 border border-gray-200 rounded-lg shadow-sm'>
          <DoughnutChart
            id='pastReportByEventLocation'
            title={`Địa điểm sự kiện ${unit} trước`}
            data={pastReportByEventLocation}
            groupName='eventLocation'
            type={type}
            activeIndex={activeIndex}
          />
        </div>

        {/* By current parter */}
        <div className='h-[500px] bg-white p-4 border border-gray-200 rounded-lg shadow-sm'>
          <DoughnutChart
            title={`Nguồn khách ${unit} này`}
            data={currentReportByPartner}
            groupName='partner'
            type={type}
            id={'currentReportByPartner'}
            activeIndex={activeIndex}
          />
        </div>

        {/* By past partner */}
        <div className='h-[500px] bg-white p-4 border border-gray-200 rounded-lg shadow-sm'>
          <DoughnutChart
            id={'pastReportByPartner'}
            title={`Nguồn khách ${unit} trước`}
            data={pastReportByPartner}
            groupName='partner'
            type={type}
            activeIndex={activeIndex}
          />
        </div>
      </div>
    </div>
  );
}

const toggleDropdown = (dropdownId: string) => {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
};
