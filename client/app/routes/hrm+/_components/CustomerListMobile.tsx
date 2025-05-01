import { Link } from '@remix-run/react';

export default function CustomerListMobile({
  caseServices,
  selected,
}: {
  caseServices: any[];
  selected: any;
}) {
  return (
    <div className='md:hidden'>
      <div className='divide-y divide-gray-200 px-4'>
        {caseServices.map((caseService, i) => (
          <CaseServiceCard
            key={i}
            caseService={caseService}
            selected={selected.includes(caseService.id)}
          />
        ))}
      </div>
    </div>
  );
}

const CaseServiceCard = ({
  caseService,
  selected,
}: {
  caseService: any;
  selected: boolean;
}) => {
  return (
    <div
      className={`py-4 hover:bg-gray-50 transition border-b border-gray-200 ${selected ? 'bg-blue-50' : ''}`}
    >
      <div className='flex flex-col md:flex-row justify-between items-start gap-3'>
        <div className='flex-1 w-full'>
          <div className='flex items-center'>
            <input type='checkbox' className='rounded text-blue-500 mr-3' />
            <div className='flex flex-col'>
              <div className='font-medium text-gray-800'>John Smith</div>
              <div className='text-xs text-gray-500'>#CS12345</div>
            </div>
          </div>
          <div className='mt-3 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Phone:</span>
              <a
                href='https://webcrumbs.cloud/placeholder'
                className='text-blue-500'
              >
                +1 (415) 555-2671
              </a>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-gray-500'>Email:</span>
              <a
                href='https://webcrumbs.cloud/placeholder'
                className='text-blue-500 truncate max-w-[200px]'
              >
                john.smith@example.com
              </a>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-gray-500'>Appointment:</span>
              <span>15 Aug 2023</span>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-gray-500'>Progress:</span>
              <div className='flex items-center gap-2 min-w-[100px] justify-end'>
                <div className='w-16 bg-gray-200 rounded-full h-1.5'>
                  <div
                    className='bg-blue-500 h-1.5 rounded-full'
                    style={{ width: '75%' }}
                  ></div>
                </div>
                <span>75%</span>
              </div>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-gray-500'>Outstanding:</span>
              <span className='font-medium'>$300.00</span>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-gray-500'>Status:</span>
              <span className='inline-flex items-center'>
                <span className='material-symbols-outlined text-gray-400 text-sm mr-1'>
                  remove
                </span>
                Not Paid
              </span>
            </div>
          </div>
        </div>
        <div className='flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 mt-3 md:mt-0 w-full md:w-auto justify-between md:justify-start md:ml-4'>
          <a
            href='https://webcrumbs.cloud/placeholder'
            className='text-gray-600 hover:text-blue-600 transition'
          >
            <span className='material-symbols-outlined'>visibility</span>
          </a>
          <a
            href='https://webcrumbs.cloud/placeholder'
            className='text-gray-600 hover:text-blue-600 transition'
          >
            <span className='material-symbols-outlined'>edit</span>
          </a>
          <a
            href='https://webcrumbs.cloud/placeholder'
            className='text-gray-600 hover:text-red-600 transition'
          >
            <span className='material-symbols-outlined'>more_vert</span>
          </a>
        </div>
      </div>
    </div>
  );
};
