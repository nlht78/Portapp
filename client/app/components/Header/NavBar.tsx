import { Link } from '@remix-run/react';
import { RiArrowDownSLine } from '@remixicon/react';
import { useState } from 'react';

export default function NavBar() {
  const [openStoryDropdown, setOpenStoryDropdown] = useState(false);
  const [openProgramDropdown, setOpenProgramDropdown] = useState(false);
  const [openFacilityDropdown, setOpenFacilityDropdown] = useState(false);
  const [openSystemDropdown, setOpenSystemDropdown] = useState(false);
  const [openNewsDropdown, setOpenNewsDropdown] = useState(false);
  const [openEnrollmentDropdown, setOpenEnrollmentDropdown] = useState(false);

  return (
    <div className='hidden xl:flex z-40 items-center gap-x-4 h-full'>
      <div
        className='relative w-full'
        onMouseEnter={() => setOpenStoryDropdown(true)}
        onMouseLeave={() => setOpenStoryDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='h-8 top-2 left-0 font-bold text-[#666666d9] text-2xl'>
            <Link
              to='/cau-chuyen-ve-ilo'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Câu chuyện về ILO
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openStoryDropdown && (
          <div
            className='absolute bg-white left-0 top-[51px]
          border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'
          >
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/cau-chuyen-ve-ilo#tam-nhin-su-menh'>
                  Tầm nhìn và sứ mệnh
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/cau-chuyen-ve-ilo#gia-tri-cot-loi'>
                  Giá trị cốt lõi
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/cau-chuyen-ve-ilo#vi-sao-chon-ilo'>
                  Vì sao chọn ILO?
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className='relative w-full'
        onMouseEnter={() => setOpenProgramDropdown(true)}
        onMouseLeave={() => setOpenProgramDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='h-8 top-2 left-0 font-bold text-[#666666d9] text-[22.3px]'>
            <Link
              to='/chuong-trinh-hoc'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Chương trình học
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openProgramDropdown && (
          <div className='absolute left-0 top-[51px] bg-white border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'>
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/chuong-trinh-hoc#tinh-hoa-giao-duc'>
                  Tinh hoa giáo dục Phần Lan
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/chuong-trinh-hoc#khung-chuong-trinh'>
                  Khung chương trình
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/chuong-trinh-hoc#doi-ngu-giao-vien'>
                  Đội ngũ giáo viên
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/chuong-trinh-hoc#mot-ngay-o-ilo'>
                  Một ngày ở ILO
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className='relative w-full'
        onMouseEnter={() => setOpenFacilityDropdown(true)}
        onMouseLeave={() => setOpenFacilityDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='w-[163px] h-8 top-2 left-0 font-bold text-[#666666d9] text-[23.2px]'>
            <Link
              to='/co-so-vat-chat'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Cơ sở vật chất
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openFacilityDropdown && (
          <div className='absolute left-0 top-[51px] bg-white border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'>
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/co-so-vat-chat#phong-hoc'>Phòng học</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/co-so-vat-chat#san-choi'>Sân chơi</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/co-so-vat-chat#phong-an'>Phòng ăn</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/co-so-vat-chat#phong-tuong-tuong'>
                  Phòng tưởng tượng
                </Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/co-so-vat-chat#thu-vien'>Thư viện</Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className='relative w-full'
        onMouseEnter={() => setOpenSystemDropdown(true)}
        onMouseLeave={() => setOpenSystemDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='w-[163px] h-8 top-2 left-0 font-bold text-[#666666d9] text-[23.2px]'>
            <Link
              to='/he-thong-ilo'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Hệ thống ILO
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openSystemDropdown && (
          <div className='absolute left-0 top-[51px] bg-white border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'>
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/he-thong-ilo#ilo-go-vap'>ILO Gò Vấp</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/he-thong-ilo#ilo-tan-dinh'>ILO Tân Định</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/he-thong-ilo#ilo-tan-phu'>ILO Tân Phú</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/he-thong-ilo#ilo-binh-duong'>ILO Bình Dương</Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className='relative w-full'
        onMouseEnter={() => setOpenNewsDropdown(true)}
        onMouseLeave={() => setOpenNewsDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='h-8 top-2 left-0 font-bold text-[#666666d9] text-[23.2px]'>
            <Link
              to='/blog'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Bản tin
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openNewsDropdown && (
          <div className='absolute left-0 top-[51px] bg-white border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'>
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                Cùng con trưởng thành
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                Sự kiện
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                Hoạt động vui học
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                Tin tức
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                Multimedia
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className='relative w-full'
        onMouseEnter={() => setOpenEnrollmentDropdown(true)}
        onMouseLeave={() => setOpenEnrollmentDropdown(false)}
      >
        <div className='h-[51px] flex items-center'>
          <div className='h-8 top-2 left-0 font-bold text-[#666666d9] text-[23.2px]'>
            <Link
              to='/tuyen-sinh'
              className='w-max text-lg font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1'
            >
              Tuyển sinh
              <RiArrowDownSLine className='text-gray-700 text-xl' />
            </Link>
          </div>
        </div>
        {openEnrollmentDropdown && (
          <div className='absolute left-0 top-[51px] bg-white border border-[#ccc] shadow-lg w-[220px] rounded-lg z-20'>
            <ul className='p-2'>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/tuyen-sinh#lich-hoc'>Lịch học</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 cursor-pointer'>
                <Link to='/tuyen-sinh#hoc-bong'>Học bổng</Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
