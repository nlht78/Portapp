import { Link } from '@remix-run/react';
import { RiArrowDownSLine, RiCloseLine } from '@remixicon/react';
import { useState } from 'react';
import { SUB_CATEGORIES } from '~/constants/app.constant';
import { useMainLoaderData } from '~/lib/useMainLoaderData';

export default function SideBar({
  onClose,
  showSidebar,
}: {
  showSidebar: boolean;
  onClose: () => void;
}) {
  const [showingCategory, setShowingCategory] = useState(-1);

  // const { categories } = useMainLoaderData();
  return <div></div>;

  return (
    <div
      className={`absolute xl:hidden max-xl:inset-y-0 left-0 
    max-xl:h-screen max-xl:bg-black/60 flex items-center justify-start ${
      showSidebar ? 'w-full' : 'w-0'
    } overflow-hidden transition-all duration-300`}
      onClick={onClose}
    >
      <div
        className='flex z-40 items-center gap-x-4 w-2/3 bg-[--main-color] h-full 
      flex-col p-8 divide-y divide-zinc-300'
        onClick={(e) => e.stopPropagation()}
      >
        {categories.map((cat, i) => (
          <div
            className='relative w-full transition-all duration-300'
            onClick={() => setShowingCategory((prev) => (prev === i ? -1 : i))}
          >
            <div className='h-[51px] flex items-center'>
              <div className='h-8 top-2 left-0 font-bold text-[#666666d9] text-2xl w-full'>
                <button
                  className='w-full text-lg font-semibold text-gray-700 hover:text-green-700 flex 
                items-center justify-between'
                >
                  {cat.cat_name}
                  <RiArrowDownSLine className='text-gray-700 text-xl' />
                </button>
              </div>
            </div>

            <div
              className={`w-[220px] rounded-lg z-20 ${showingCategory === i ? 'h-full' : 'h-0'} 
                overflow-hidden transition-all duration-300`}
            >
              <ul className='p-2'>
                {SUB_CATEGORIES[cat.cat_page.pst_slug].map((sub, i) => (
                  <li
                    key={i}
                    className='py-2 px-3 hover:bg-gray-200 cursor-pointer'
                  >
                    <Link
                      to={`/${cat.cat_page.pst_slug}/#${sub.slug}`}
                      onClick={onClose}
                    >
                      {sub.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className='absolute top-4 right-4 h-8 w-8'>
        <button
          className='flex items-center justify-center bg-[#666666d9] 
          text-white rounded-full hover:bg-white/10'
          onClick={onClose}
        >
          <RiCloseLine />
        </button>
      </div>
    </div>
  );
}
