export default function ChatPage() {
  return (
    <>
      {/* Top Navigation */}
      {/* <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div className='relative w-full md:w-[300px]'>
          <input
            type='text'
            placeholder='Search conversations...'
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
      </div> */}

      {/* Content Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h1 className='text-xl font-semibold'>Team Chat</h1>
        <div className='flex space-x-2'>
          <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            New Conversation
          </button>
          <button className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'>
            <span className='material-symbols-outlined text-sm mr-1'>
              filter_list
            </span>
            Filter
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Contacts List */}
        <div className='bg-white rounded-lg shadow-sm lg:col-span-1 h-[calc(100vh-200px)]'>
          <div className='p-4 border-b'>
            <h2 className='font-semibold'>Conversations</h2>
          </div>

          <div className='h-[calc(100%-56px)] overflow-y-auto'>
            <div className='border-b p-4 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                  <div className='absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white'></div>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Sarah Johnson</span>
                    <span className='text-xs text-gray-500'>12:45 PM</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    I'll send over the updated HR policy document shortly.
                  </p>
                </div>
              </div>
            </div>

            <div className='border-b p-4 hover:bg-gray-50 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                  <img
                    src='https://randomuser.me/api/portraits/men/32.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                  <div className='absolute bottom-0 right-0 h-3 w-3 bg-gray-300 rounded-full border-2 border-white'></div>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Michael Chen</span>
                    <span className='text-xs text-gray-500'>Yesterday</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    Can we discuss the project timeline during the next meeting?
                  </p>
                </div>
              </div>
            </div>

            <div className='border-b p-4 hover:bg-gray-50 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                  <div className='bg-purple-500 h-full w-full flex items-center justify-center text-white font-bold'>
                    TR
                  </div>
                  <div className='absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white'></div>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Tech Team</span>
                    <span className='text-xs text-gray-500'>2 days ago</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    Jane: The server maintenance is scheduled for this weekend.
                  </p>
                </div>
              </div>
            </div>

            <div className='border-b p-4 hover:bg-gray-50 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                  <img
                    src='https://randomuser.me/api/portraits/women/65.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                  <div className='absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white'></div>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Lisa Rodriguez</span>
                    <span className='text-xs text-gray-500'>2 days ago</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    I've completed the design mockups for the HR portal update.
                  </p>
                </div>
              </div>
            </div>

            <div className='border-b p-4 hover:bg-gray-50 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                  <img
                    src='https://randomuser.me/api/portraits/men/85.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                  <div className='absolute bottom-0 right-0 h-3 w-3 bg-gray-300 rounded-full border-2 border-white'></div>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>David Park</span>
                    <span className='text-xs text-gray-500'>1 week ago</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    Please review the applicant profiles I shared with you.
                  </p>
                </div>
              </div>
            </div>

            <div className='border-b p-4 hover:bg-gray-50 transition-all cursor-pointer'>
              <div className='flex items-start'>
                <div className='h-10 w-10 bg-blue-500 rounded-full overflow-hidden mr-3 relative flex items-center justify-center text-white font-bold'>
                  HR
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>HR Team</span>
                    <span className='text-xs text-gray-500'>2 weeks ago</span>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    Alex: Let's finalize the quarterly performance review
                    schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className='bg-white rounded-lg shadow-sm lg:col-span-2 flex flex-col h-[calc(100vh-200px)]'>
          {/* Chat Header */}
          <div className='p-4 border-b flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='h-10 w-10 rounded-full overflow-hidden mr-3 relative'>
                <img
                  src='https://randomuser.me/api/portraits/women/42.jpg'
                  alt='Contact'
                  className='h-full w-full object-cover'
                />
                <div className='absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white'></div>
              </div>
              <div>
                <h2 className='font-semibold'>Sarah Johnson</h2>
                <div className='text-xs text-green-500'>Online</div>
              </div>
            </div>
            <div className='flex space-x-2'>
              <button className='text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-all duration-200'>
                <span className='material-symbols-outlined'>phone</span>
              </button>
              <button className='text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-all duration-200'>
                <span className='material-symbols-outlined'>videocam</span>
              </button>
              <button className='text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-all duration-200'>
                <span className='material-symbols-outlined'>more_vert</span>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
            <div className='mb-4'>
              <div className='text-xs text-center text-gray-500 mb-4'>
                Today, 12:45 PM
              </div>

              <div className='flex mb-4'>
                <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='max-w-[70%]'>
                  <div className='bg-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      Hi Alex, I'm working on the new employee onboarding
                      documentation. Can you review it once I'm done?
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 ml-2'>
                    12:45 PM
                  </div>
                </div>
              </div>

              <div className='flex justify-end mb-4'>
                <div className='max-w-[70%]'>
                  <div className='bg-blue-500 text-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      Of course, Sarah. When do you expect to have it ready? I
                      need to coordinate with the IT team for system access
                      setup as well.
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 mr-2 text-right'>
                    12:47 PM
                  </div>
                </div>
              </div>

              <div className='flex mb-4'>
                <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='max-w-[70%]'>
                  <div className='bg-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      I should have it ready by tomorrow afternoon. I'll also
                      include the updated HR policy document that needs to be
                      shared with all new hires.
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 ml-2'>
                    12:50 PM
                  </div>
                </div>
              </div>

              <div className='flex mb-4'>
                <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='max-w-[70%]'>
                  <div className='bg-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      By the way, here's a preview of what I've worked on so
                      far.
                    </p>
                  </div>
                  <div className='bg-white rounded-lg p-3 shadow-sm mt-2'>
                    <div className='flex items-center'>
                      <span className='material-symbols-outlined text-red-500 mr-2'>
                        picture_as_pdf
                      </span>
                      <div>
                        <p className='text-sm font-medium'>
                          New_Employee_Onboarding.pdf
                        </p>
                        <p className='text-xs text-gray-500'>2.4 MB</p>
                      </div>
                      <button className='ml-4 text-blue-500 hover:text-blue-600'>
                        <span className='material-symbols-outlined'>
                          download
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 ml-2'>
                    12:53 PM
                  </div>
                </div>
              </div>

              <div className='flex justify-end mb-4'>
                <div className='max-w-[70%]'>
                  <div className='bg-blue-500 text-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      This looks great so far! I like how you've structured the
                      orientation schedule. Let's discuss a few minor changes
                      during our team meeting tomorrow.
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 mr-2 text-right'>
                    12:55 PM
                  </div>
                </div>
              </div>

              <div className='flex justify-end mb-4'>
                <div className='max-w-[70%]'>
                  <div className='bg-blue-500 text-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      I'll also need the finalized benefits package information
                      to include in the documentation. Can you coordinate with
                      Finance to get the latest figures?
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 mr-2 text-right'>
                    12:56 PM
                  </div>
                </div>
              </div>

              <div className='flex mb-4'>
                <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='max-w-[70%]'>
                  <div className='bg-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      I've already reached out to Jennifer in Finance. She
                      promised to send over the updated benefits information by
                      end of day.
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 ml-2'>
                    12:58 PM
                  </div>
                </div>
              </div>

              <div className='flex mb-4'>
                <div className='h-8 w-8 rounded-full overflow-hidden mr-2'>
                  <img
                    src='https://randomuser.me/api/portraits/women/42.jpg'
                    alt='Contact'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='max-w-[70%]'>
                  <div className='bg-white rounded-lg p-3 shadow-sm'>
                    <p className='text-sm'>
                      I'll send over the updated HR policy document shortly.
                    </p>
                  </div>
                  <div className='text-xs text-gray-500 mt-1 ml-2'>1:00 PM</div>
                </div>
              </div>

              <div className='flex items-center justify-center'>
                <div className='bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-500'>
                  Sarah is typing...
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className='p-4 border-t'>
            <div className='flex items-end'>
              <button className='p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-all duration-200 mr-1'>
                <span className='material-symbols-outlined'>add</span>
              </button>
              <button className='p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-all duration-200 mr-1'>
                <span className='material-symbols-outlined'>mood</span>
              </button>
              <button className='p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-all duration-200 mr-1'>
                <span className='material-symbols-outlined'>attach_file</span>
              </button>
              <div className='flex-1 relative'>
                <input
                  type='text'
                  placeholder='Type a message...'
                  className='w-full rounded-full border border-gray-200 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <button className='ml-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-200 transform hover:scale-105'>
                <span className='material-symbols-outlined'>send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
