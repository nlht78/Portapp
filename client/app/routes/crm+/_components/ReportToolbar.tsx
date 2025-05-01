export default function ReportToolbar() {
  return (
    <div className='p-4 border-b border-gray-200 flex flex-col md:flex-row md:flex-wrap gap-3 items-start md:items-center justify-between'>
      <div className='flex flex-wrap gap-3 w-full md:w-auto'>
        <div className='relative w-full md:w-48'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined'>
            calendar_month
          </span>
          <select className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'>
            <option>August 2023</option>
            <option>July 2023</option>
            <option>June 2023</option>
            <option>May 2023</option>
            <option>April 2023</option>
          </select>
          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined pointer-events-none'>
            expand_more
          </span>
        </div>

        <div className='relative w-full md:w-48'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined'>
            compare_arrows
          </span>
          <select className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'>
            <option>July 2023</option>
            <option>June 2023</option>
            <option>May 2023</option>
            <option>April 2023</option>
            <option>March 2023</option>
          </select>
          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined pointer-events-none'>
            expand_more
          </span>
        </div>
      </div>

      <div className='flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0'>
        <details className='relative'>
          <summary className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'>
            <span className='material-symbols-outlined text-sm'>
              filter_list
            </span>
            <span>Filter Data</span>
            <span className='material-symbols-outlined text-sm'>
              expand_more
            </span>
          </summary>
          <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden'>
            <div className='py-1'>
              <div className='px-4 py-2 border-b border-gray-100'>
                <p className='font-medium text-sm text-gray-700'>
                  Income Categories
                </p>
              </div>
              <div className='p-3 space-y-2'>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked
                    className='rounded text-blue-500'
                  />
                  <span>All Categories</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='rounded text-blue-500' />
                  <span>Services</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='rounded text-blue-500' />
                  <span>Products</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='rounded text-blue-500' />
                  <span>Subscriptions</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input type='checkbox' className='rounded text-blue-500' />
                  <span>Other</span>
                </label>
              </div>
              <div className='px-3 py-2 bg-gray-50 flex justify-end border-t border-gray-100'>
                <button className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition'>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </details>

        <button className='px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition'>
          <span className='material-symbols-outlined text-sm'>refresh</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
