import { Link } from '@remix-run/react';

import { useMainLoaderData } from '~/lib/useMainLoaderData';
import React, { useEffect } from 'react';
import { RiFacebookFill, RiTiktokFill, RiYoutubeFill } from '@remixicon/react';

export default function Footer() {
  const {} = useMainLoaderData();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const script = document.createElement('script');

    script.src =
      'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v21.0&appId=950974113535167';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

  return <footer></footer>;

  return (
    <footer className='w-full min-h-[439px] bg-[#f5f8f5]'>
      <div className='w-full bg-[--sub2-text] py-4 cursor-pointer hover:bg-[#839e71] transition-colors'>
        <div
          className='flex items-center justify-center gap-2 text-white'
          onClick={scrollToTop}
        >
          <span className='text-lg'>Trở về đầu trang</span>
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 10l7-7m0 0l7 7m-7-7v18'
            />
          </svg>
        </div>
      </div>

      <div className='py-16'>
        {/* Menu Links */}
        <div className='container flex flex-wrap justify-center gap-x-8 gap-y-6 mb-12'>
          {categories.map((cat, i) => (
            <React.Fragment key={i}>
              {i === 0 || i === 3 || (
                <span className='text-[--sub1-text]'>|</span>
              )}
              <Link
                to={cat.cat_page.pst_slug}
                className='text-[--sub1-text] hover:text-[#55713C] transition-colors'
              >
                {cat.cat_name}
              </Link>

              {i === 2 && <hr className='w-full border-none' />}
            </React.Fragment>
          ))}

          <span className='text-[--sub1-text]'>|</span>
          <Link
            to='/blog'
            className='text-[--sub1-text] hover:text-[#55713C] transition-colors'
          >
            Bản tin
          </Link>

          <span className='text-[--sub1-text]'>|</span>
          <Link
            to='/chinh-sach-du-lieu'
            className='text-[--sub1-text] hover:text-[#55713C] transition-colors'
          >
            Chính sách dữ liệu
          </Link>
        </div>
        {/* 
          <div className="container mx-auto flex justify-center gap-8 mb-12">
            <Link 
              to="/he-thong-ilo" 
              className="text-[--sub1-text] hover:text-[#55713C] transition-colors"
            >
              Hệ thống ILO
            </Link>
            <span className="text-[--sub1-text]">|</span>
            <Link 
              to="/ban-tin-ilo" 
              className="text-[--sub1-text] hover:text-[#55713C] transition-colors"
            >
              Bản tin ILO
            </Link>
            <span className="text-[--sub1-text]">|</span>
            <Link 
              to="/tuyen-sinh" 
              className="text-[--sub1-text] hover:text-[#55713C] transition-colors"
            >
              Tuyển sinh
            </Link>
            <span className="text-[--sub1-text]">|</span>
            <Link 
              to="/chinh-sach-du-lieu" 
              className="text-[--sub1-text] hover:text-[#55713C] transition-colors"
            >
              Chính sách dữ liệu
            </Link>
          </div> */}

        {/* Logo */}
        <div className='flex justify-center mb-8'>
          <img
            src={app.app_logo?.img_url}
            alt='ILO Logo'
            className='h-12 object-contain'
          />
        </div>

        {/* Copyright */}
        <div className='text-center text-[--sub1-text] text-base'>
          Copyright © 2022 all rights reserved
        </div>

        {/* Social Media Icons */}
        <div className='flex justify-center gap-4 mt-8'>
          {app.app_social.facebook && (
            <a
              href={app.app_social.facebook}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[#1877F2] hover:text-[#55713C] transition-colors'
            >
              <RiFacebookFill size={24} />
            </a>
          )}

          {app.app_social.tiktok && (
            <a
              href={app.app_social.tiktok}
              target='_blank'
              rel='noopener noreferrer'
              className='text-black hover:text-[#55713C] transition-colors'
            >
              <RiTiktokFill size={24} />
            </a>
          )}

          {app.app_social.youtube && (
            <a
              href={app.app_social.youtube}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[#CE1312] hover:text-[#55713C] transition-colors'
            >
              <RiYoutubeFill size={24} />
            </a>
          )}

          {app.app_social.zalo && (
            <a
              href={app.app_social.zalo}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[--sub1-text] hover:text-[#55713C] transition-colors'
            >
              <img src='/assets/zalo.png' alt='Zalo icon' className='w-6 h-6' />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
