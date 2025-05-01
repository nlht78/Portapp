export default function ReportDataTable() {
  return (
    <div className='p-4 border-t border-gray-200'>
      <h2 className='text-lg font-semibold text-gray-800 mb-4'>
        Monthly Income Breakdown
      </h2>

      <div className='overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm'>
        <table className='w-full table-auto'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th
                scope='col'
                className='px-4 py-3 text-left text-sm font-medium text-gray-600'
              >
                Income Source
              </th>
              <th
                scope='col'
                className='px-4 py-3 text-right text-sm font-medium text-gray-600'
              >
                August 2023
              </th>
              <th
                scope='col'
                className='px-4 py-3 text-right text-sm font-medium text-gray-600'
              >
                July 2023
              </th>
              <th
                scope='col'
                className='px-4 py-3 text-right text-sm font-medium text-gray-600'
              >
                Change (%)
              </th>
              <th
                scope='col'
                className='px-4 py-3 text-right text-sm font-medium text-gray-600'
              >
                Change ($)
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            <tr className='hover:bg-gray-50 transition'>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-800'>
                Customer Appointments
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $18,250.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $15,600.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +17.0%
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +$2,650.00
              </td>
            </tr>
            <tr className='hover:bg-gray-50 transition'>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-800'>
                Product Sales
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $12,430.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $11,860.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +4.8%
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +$570.00
              </td>
            </tr>
            <tr className='hover:bg-gray-50 transition'>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-800'>
                Subscription Plans
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $8,400.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $7,200.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +16.7%
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +$1,200.00
              </td>
            </tr>
            <tr className='hover:bg-gray-50 transition'>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-800'>
                Other Revenue
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $3,500.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right'>
                $3,200.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +9.4%
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right text-emerald-600'>
                +$300.00
              </td>
            </tr>
            <tr className='hover:bg-gray-50 transition bg-gray-50'>
              <td className='px-4 py-3 whitespace-nowrap font-medium text-gray-900'>
                Total Revenue
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right font-bold'>
                $42,580.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right font-bold'>
                $37,860.00
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-600'>
                +12.5%
              </td>
              <td className='px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-600'>
                +$4,720.00
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
