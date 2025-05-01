export default function HRMTask() {
  return (
    <div className='flex-1 p-4 md:p-6 lg:ml-[240px] mt-4 lg:mt-0 overflow-y-auto'>
      {/* Top Navigation */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div className='relative w-full md:w-[300px]'>
          <input
            type='text'
            placeholder='Search tasks, employees, projects...'
            className='w-full py-2 pl-8 pr-3 rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
          />
          <span className='material-symbols-outlined text-gray-400 absolute left-2 top-2'>
            search
          </span>
        </div>

        <div className='flex items-center space-x-4 ml-auto'>
          <div className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'>
            <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
              notifications
            </span>
            <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
          </div>
          <div className='relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition duration-200 group'>
            <span className='material-symbols-outlined text-gray-500 group-hover:text-blue-500'>
              mail
            </span>
            <div className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full'></div>
          </div>
          <div className='flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-all duration-200'>
            <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold'>
              A
            </div>
            <div className='ml-2 hidden sm:block'>
              <div className='text-sm font-medium'>Alex Morgan</div>
              <div className='text-xs text-gray-500'>HR Manager</div>
            </div>
            <span className='material-symbols-outlined text-gray-500 ml-1'>
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h1 className='text-xl font-semibold'>Employee Task Management</h1>
        <div className='flex space-x-2'>
          <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            New Task
          </button>
          <details className='relative'>
            <summary className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer focus:outline-none'>
              <span className='material-symbols-outlined text-sm mr-1'>
                filter_list
              </span>
              Filter
            </summary>
            <div className='absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-20 border border-gray-200 py-1'>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                All Tasks
              </div>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                High Priority
              </div>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                Medium Priority
              </div>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                Low Priority
              </div>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                Overdue
              </div>
              <div className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'>
                Completed
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Task Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Total Tasks</p>
              <h3 className='text-2xl font-bold'>158</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                12% from last week
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-500'>
                task
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-green-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Completed Tasks</p>
              <h3 className='text-2xl font-bold'>87</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                5% completion rate
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-green-500'>
                check_circle
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-red-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Overdue Tasks</p>
              <h3 className='text-2xl font-bold'>24</h3>
              <p className='text-xs text-red-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  error
                </span>
                8 require immediate action
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-red-500'>
                schedule
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-yellow-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>In Progress</p>
              <h3 className='text-2xl font-bold'>47</h3>
              <p className='text-xs text-yellow-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  hourglass_top
                </span>
                30% of all tasks
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-yellow-500'>
                pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Listing */}
      <div className='bg-white rounded-lg shadow-sm p-6 mb-8'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='font-semibold text-lg'>Employee Tasks</h2>
          <div className='flex space-x-2'>
            <select className='text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition'>
              <option>All Departments</option>
              <option>Development</option>
              <option>Marketing</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
            <button className='text-blue-500 hover:text-blue-600 text-sm flex items-center transition-all hover:underline'>
              Detailed Report
              <span className='material-symbols-outlined text-sm ml-1'>
                chevron_right
              </span>
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Task Info
                </th>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Assigned To
                </th>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Due Date
                </th>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Priority
                </th>
                <th className='px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div>
                    <div className='text-sm font-medium'>
                      Website redesign homepage
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Update the company website with new branding
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                      <img
                        src='https://randomuser.me/api/portraits/women/42.jpg'
                        alt='Employee'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <div className='text-sm font-medium'>Sarah Johnson</div>
                      <div className='text-xs text-gray-500'>
                        UI/UX Designer
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='text-sm'>June 20, 2023</div>
                  <div className='text-xs text-red-500'>Overdue by 5 days</div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'>
                    High
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-2 w-2 rounded-full bg-yellow-400 mr-2'></div>
                    <span className='text-sm'>In Progress</span>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-right text-sm'>
                  <button className='text-blue-500 hover:text-blue-700 mr-3 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      edit
                    </span>
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div>
                    <div className='text-sm font-medium'>
                      Quarterly report preparation
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Prepare Q2 financial reports for stakeholders
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                      <img
                        src='https://randomuser.me/api/portraits/men/32.jpg'
                        alt='Employee'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <div className='text-sm font-medium'>Michael Chen</div>
                      <div className='text-xs text-gray-500'>
                        Financial Analyst
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='text-sm'>June 30, 2023</div>
                  <div className='text-xs text-green-500'>
                    10 days remaining
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800'>
                    Medium
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-2 w-2 rounded-full bg-yellow-400 mr-2'></div>
                    <span className='text-sm'>In Progress</span>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-right text-sm'>
                  <button className='text-blue-500 hover:text-blue-700 mr-3 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      edit
                    </span>
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div>
                    <div className='text-sm font-medium'>
                      Employee onboarding program
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Create new employee onboarding materials
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                      <img
                        src='https://randomuser.me/api/portraits/women/65.jpg'
                        alt='Employee'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <div className='text-sm font-medium'>Lisa Rodriguez</div>
                      <div className='text-xs text-gray-500'>HR Specialist</div>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='text-sm'>June 15, 2023</div>
                  <div className='text-xs text-green-500'>
                    Completed on time
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                    Low
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-2 w-2 rounded-full bg-green-400 mr-2'></div>
                    <span className='text-sm'>Completed</span>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-right text-sm'>
                  <button className='text-blue-500 hover:text-blue-700 mr-3 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      visibility
                    </span>
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div>
                    <div className='text-sm font-medium'>
                      Mobile app bug fixes
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Fix critical bugs in the company mobile app
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                      <img
                        src='https://randomuser.me/api/portraits/men/85.jpg'
                        alt='Employee'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <div className='text-sm font-medium'>David Park</div>
                      <div className='text-xs text-gray-500'>
                        Mobile Developer
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='text-sm'>June 22, 2023</div>
                  <div className='text-xs text-orange-500'>
                    2 days remaining
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'>
                    High
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-2 w-2 rounded-full bg-yellow-400 mr-2'></div>
                    <span className='text-sm'>In Progress</span>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-right text-sm'>
                  <button className='text-blue-500 hover:text-blue-700 mr-3 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      edit
                    </span>
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>

              <tr className='hover:bg-gray-50 transition-all'>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div>
                    <div className='text-sm font-medium'>
                      Social media content calendar
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Create content calendar for next month
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                      <img
                        src='https://randomuser.me/api/portraits/women/33.jpg'
                        alt='Employee'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div>
                      <div className='text-sm font-medium'>Emma Wilson</div>
                      <div className='text-xs text-gray-500'>
                        Marketing Specialist
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='text-sm'>June 25, 2023</div>
                  <div className='text-xs text-green-500'>5 days remaining</div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800'>
                    Medium
                  </span>
                </td>
                <td className='px-4 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='h-2 w-2 rounded-full bg-blue-400 mr-2'></div>
                    <span className='text-sm'>Not Started</span>
                  </div>
                </td>
                <td className='px-4 py-4 whitespace-nowrap text-right text-sm'>
                  <button className='text-blue-500 hover:text-blue-700 mr-3 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      edit
                    </span>
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 transition-colors'>
                    <span className='material-symbols-outlined text-sm'>
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className='flex justify-between items-center mt-6'>
          <div className='text-sm text-gray-500'>
            Showing 1 to 5 of 158 tasks
          </div>
          <div className='flex space-x-1'>
            <button
              className='px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled
            >
              Previous
            </button>
            <button className='px-3 py-1 rounded bg-blue-500 text-white text-sm'>
              1
            </button>
            <button className='px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50'>
              2
            </button>
            <button className='px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50'>
              3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
