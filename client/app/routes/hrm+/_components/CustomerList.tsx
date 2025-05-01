import { Link } from '@remix-run/react';

export default function CustomerList({
  caseServices,
  selected,
}: {
  caseServices: any[];
  selected: string[];
}) {
  return (
    <div className='overflow-x-auto hidden md:block'>
      <table className='w-full table-auto'>
        <thead className='bg-gray-50 border-b border-gray-200'>
          <tr>
            <th scope='col' className='px-4 py-3 text-left'>
              <input type='checkbox' className='rounded text-blue-500' />
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Họ tên
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              SĐT
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Email
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Appointment Date
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Progress
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Outstanding
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-left text-sm font-medium text-gray-600'
            >
              Paid?
            </th>
            <th
              scope='col'
              className='px-4 py-3 text-right text-sm font-medium text-gray-600'
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200'>
          {caseServices.map((caseService, i) => (
            <tr
              key={i}
              className={`${selected.includes(caseService.id) ? 'bg-blue-50' : ''} hover:bg-blue-50 transition`}
            >
              <td className='px-4 py-3 whitespace-nowrap'>
                <input
                  type='checkbox'
                  checked
                  className='rounded text-blue-500'
                />
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                <div className='flex items-center'>
                  <div className='font-medium text-gray-800'>John Smith</div>
                  <div className='ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md'>
                    #CS12345
                  </div>
                </div>
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                <a
                  href='https://webcrumbs.cloud/placeholder'
                  className='text-blue-500 hover:text-blue-600 transition'
                >
                  +1 (415) 555-2671
                </a>
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                <Link
                  to='https://webcrumbs.cloud/placeholder'
                  className='text-blue-500 hover:text-blue-600 transition'
                >
                  john.smith@example.com
                </Link>
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-gray-700'>
                15 Aug 2023
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                <div className='flex items-center gap-2'>
                  <div className='w-16 bg-gray-200 rounded-full h-1.5'>
                    <div
                      className='bg-blue-500 h-1.5 rounded-full'
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                  <span className='text-sm text-gray-600'>75%</span>
                </div>
              </td>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-800'>
                $300.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                <span className='inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100'>
                  <span className='material-symbols-outlined text-gray-400 text-sm'>
                    remove
                  </span>
                </span>
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                <div className='flex items-center justify-end gap-2'>
                  <Link
                    to='https://webcrumbs.cloud/placeholder'
                    className='text-gray-600 hover:text-blue-600 transition'
                  >
                    <span className='material-symbols-outlined'>
                      visibility
                    </span>
                  </Link>
                  <Link
                    to='https://webcrumbs.cloud/placeholder'
                    className='text-gray-600 hover:text-blue-600 transition'
                  >
                    <span className='material-symbols-outlined'>edit</span>
                  </Link>
                  <Link
                    to='https://webcrumbs.cloud/placeholder'
                    className='text-gray-600 hover:text-red-600 transition'
                  >
                    <span className='material-symbols-outlined'>more_vert</span>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <div className='hidden md:table-row-group'></div>
      </table>
    </div>
  );
}
