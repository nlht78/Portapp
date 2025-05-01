import { useState } from 'react';

import { getPosts } from '~/services/page.server';
import HandsomeError from '~/components/HandsomeError';
import { useLoaderData } from '@remix-run/react';
import { useMainLoaderData } from '~/lib/useMainLoaderData';

const sliders = [
  { img_name: 'banner.jpg' },
  { img_name: 'banner2.jpg' },
  { img_name: 'banner3.jpg' },
  { img_name: 'banner4.jpg' },
  { img_name: 'banner5.jpg' },
];

export const loader = async () => {
  const posts = getPosts();
  const limitedSliders = sliders.slice(0, 5); // Limit sliders here if needed

  return { sliders: limitedSliders, posts };
};

export default function Index() {
  const { posts, sliders: loaderSliders } = useLoaderData<typeof loader>();
  const { branches } = useMainLoaderData();
  const [isPlaying, setIsPlaying] = useState(false);
  const limitedSliders = loaderSliders || sliders.slice(0, 5); // Fallback to static sliders if loaderSliders is undefined

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  return (
    <main id='webcrumbs'>
      <div className='w-full bg-black text-white font-sans'>
        {/* Hero Section */}
        <section className='relative flex flex-col items-center pt-8 pb-16 px-12'>
          <div className='flex flex-col lg:flex-row justify-between w-full'>
            <div className='max-w-xl'>
              <p className='text-gray-400 uppercase tracking-wider text-sm mb-2'>
                TRANSFORM YOUR BUSINESS STRATEGY
              </p>
              <h1 className='text-4xl font-bold mb-4'>
                UNLOCK THE TOOLS TO{' '}
                <span className='text-red-600'>MASTERY & CONFIDENCE</span>
              </h1>
              <p className='text-gray-300 mb-6'>
                Elite Business Coaching provides entrepreneurs, business owners,
                and aspiring experts the marketing, branding, and SEO strategies
                needed to accelerate growth and thrive in today's competitive
                market.
              </p>

              <button className='bg-red-600 hover:bg-red-700 transition-colors duration-300 text-white font-bold py-3 px-8 rounded-md flex items-center group'>
                GET STARTED TODAY
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>

              <div className='flex items-center mt-6 text-sm'>
                <div className='flex'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 text-red-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <span className='ml-2 text-gray-400'>
                  5,000+ SUCCESSFUL BUSINESS TRANSFORMATIONS
                </span>
              </div>
            </div>

            <div className='relative mt-8 lg:mt-0'>
              <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-r from-red-600/30 to-red-800/30 rounded-full blur-3xl'></div>
              <img
                src='https://placehold.co/500x400/404040/red?text=Business+App'
                alt='Business Analytics Dashboard'
                className='relative z-10 h-auto max-w-full lg:h-96 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300'
              />
            </div>
          </div>

          <p className='text-gray-400 text-sm mt-12 max-w-5xl'>
            Elite Business Coaching isn't just a consulting service—it's a
            complete business transformation program. Get access to our premier
            marketing, branding, and SEO strategies,{' '}
            <span className='text-red-600 font-semibold underline'>
              specifically designed for businesses at any stage
            </span>
            . With 15+ years of industry experience, we've developed frameworks
            that walk you through exactly what's needed step by step to
            establish your brand and increase your visibility.{' '}
            <span className='underline text-red-600 font-semibold'>
              Perfect for those who want to build a sustainable business model
            </span>{' '}
            with proven strategies that deliver measurable results.
          </p>
        </section>

        {/* Who is it for section */}
        <section className='py-16 px-12 bg-gradient-to-b from-black to-gray-950'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            WHO IS ELITE BUSINESS COACHING FOR?
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='border border-gray-800 hover:border-red-700 transition-colors duration-300 p-6 rounded-lg flex flex-col items-center text-center group hover:bg-gray-900/50'>
              <div className='w-14 h-14 mb-4 bg-gray-800 group-hover:bg-red-900 transition-colors duration-300 flex items-center justify-center rounded-lg'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-7 w-7'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='font-bold mb-3'>BUSINESS OWNERS</h3>
              <p className='text-gray-400 text-sm'>
                Discover your unique market position and develop targeted
                marketing strategies that convert visitors into loyal customers.
              </p>
            </div>

            <div className='border border-gray-800 hover:border-red-700 transition-colors duration-300 p-6 rounded-lg flex flex-col items-center text-center group hover:bg-gray-900/50'>
              <div className='w-14 h-14 mb-4 bg-gray-800 group-hover:bg-red-900 transition-colors duration-300 flex items-center justify-center rounded-lg'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-7 w-7'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <h3 className='font-bold mb-3'>MARKETING PROFESSIONALS</h3>
              <p className='text-gray-400 text-sm'>
                Elevate your marketing skills with advanced SEO techniques,
                content strategies, and data-driven campaign optimization.
              </p>
            </div>

            <div className='border border-gray-800 hover:border-red-700 transition-colors duration-300 p-6 rounded-lg flex flex-col items-center text-center group hover:bg-gray-900/50'>
              <div className='w-14 h-14 mb-4 bg-gray-800 group-hover:bg-red-900 transition-colors duration-300 flex items-center justify-center rounded-lg'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-7 w-7'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
              </div>
              <h3 className='font-bold mb-3'>STARTUPS & ENTREPRENEURS</h3>
              <p className='text-gray-400 text-sm'>
                Build a strong brand foundation, develop effective go-to-market
                strategies, and establish a competitive online presence.
              </p>
            </div>

            <div className='border border-gray-800 hover:border-red-700 transition-colors duration-300 p-6 rounded-lg flex flex-col items-center text-center group hover:bg-gray-900/50'>
              <div className='w-14 h-14 mb-4 bg-gray-800 group-hover:bg-red-900 transition-colors duration-300 flex items-center justify-center rounded-lg'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-7 w-7'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
                  />
                </svg>
              </div>
              <h3 className='font-bold mb-3'>E-COMMERCE BUSINESSES</h3>
              <p className='text-gray-400 text-sm'>
                Optimize your online store, increase conversion rates, and
                implement effective digital marketing strategies for sustainable
                growth.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className='py-16 px-12 bg-gradient-to-b from-black to-gray-950'>
          <div className='max-w-7xl mx-auto'>
            <h2 className='text-3xl font-bold text-center mb-6'>
              SUCCESS STORIES FROM OUR CLIENTS
            </h2>
            <p className='text-gray-400 text-center mb-12 max-w-3xl mx-auto'>
              Hear from business owners who have transformed their companies
              through our strategic coaching and proven methodologies.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {/* Testimonial 1 */}
              <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:shadow-lg hover:shadow-red-900/20 transition-all duration-300 group border border-gray-800 hover:border-red-700'>
                <div className='flex flex-col h-full'>
                  <div className='flex-1'>
                    <div className='flex mb-4'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5 text-yellow-500'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                    <p className='text-gray-300 italic mb-4'>
                      "Elite Business Coaching completely transformed my
                      approach to marketing. Within 3 months, our e-commerce
                      sales increased by 215% and we've been able to expand into
                      two new markets."
                    </p>
                    <p className='text-gray-400 text-sm mb-6'>
                      The strategies for content creation and SEO optimization
                      were particularly valuable for our niche market. I now
                      have a framework I can apply to all future product
                      launches.
                    </p>
                  </div>
                  <div className='flex items-center mt-auto'>
                    <div className='w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-red-600 group-hover:ring-red-500 transition-colors duration-300'>
                      <img
                        src='https://placehold.co/200x200/404040/red?text=SM'
                        alt='Sarah Mitchell'
                        className='w-full h-full object-cover'
                        loading='lazy' // Lazy loading for testimonial images
                      />
                    </div>
                    <div>
                      <h4 className='font-bold text-white group-hover:text-red-400 transition-colors duration-300'>
                        Sarah Mitchell
                      </h4>
                      <p className='text-sm text-gray-400'>
                        CEO, Artisan Home Decor
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:shadow-lg hover:shadow-red-900/20 transition-all duration-300 group border border-gray-800 hover:border-red-700'>
                <div className='flex flex-col h-full'>
                  <div className='flex-1'>
                    <div className='flex mb-4'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5 text-yellow-500'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                    <p className='text-gray-300 italic mb-4'>
                      "As a startup founder, I was struggling with our brand
                      positioning. The coaching program gave me clarity and a
                      step-by-step playbook for establishing our market
                      presence."
                    </p>
                    <p className='text-gray-400 text-sm mb-6'>
                      Our website traffic increased by 450% in just 6 months,
                      and our conversion rate doubled. We've secured two major
                      partnerships directly from our improved online visibility.
                    </p>
                  </div>
                  <div className='flex items-center mt-auto'>
                    <div className='w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-red-600 group-hover:ring-red-500 transition-colors duration-300'>
                      <img
                        src='https://placehold.co/200x200/404040/red?text=JR'
                        alt='James Rodriguez'
                        className='w-full h-full object-cover'
                        loading='lazy' // Lazy loading for testimonial images
                      />
                    </div>
                    <div>
                      <h4 className='font-bold text-white group-hover:text-red-400 transition-colors duration-300'>
                        James Rodriguez
                      </h4>
                      <p className='text-sm text-gray-400'>
                        Founder, TechFlow Solutions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 hover:shadow-lg hover:shadow-red-900/20 transition-all duration-300 group border border-gray-800 hover:border-red-700'>
                <div className='flex flex-col h-full'>
                  <div className='flex-1'>
                    <div className='flex mb-4'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5 text-yellow-500'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      ))}
                    </div>
                    <p className='text-gray-300 italic mb-4'>
                      "The ROI from this program has been incredible. We
                      invested $997 and have seen a 1,200% return in the first
                      year through improved lead generation and conversion
                      strategies."
                    </p>
                    <p className='text-gray-400 text-sm mb-6'>
                      The community aspect was an unexpected bonus - connecting
                      with other business owners has led to collaborative
                      opportunities and valuable insights.
                    </p>
                  </div>
                  <div className='flex items-center mt-auto'>
                    <div className='w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-red-600 group-hover:ring-red-500 transition-colors duration-300'>
                      <img
                        src='https://placehold.co/200x200/404040/red?text=AJ'
                        alt='Alexandra Johnson'
                        className='w-full h-full object-cover'
                        loading='lazy' // Lazy loading for testimonial images
                      />
                    </div>
                    <div>
                      <h4 className='font-bold text-white group-hover:text-red-400 transition-colors duration-300'>
                        Alexandra Johnson
                      </h4>
                      <p className='text-sm text-gray-400'>
                        Director, Wellness Collective
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Metrics */}
            <div className='mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
              <div className='bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-red-700 transition-all duration-300 group'>
                <div className='text-red-600 text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300'>
                  215%
                </div>
                <div className='text-gray-300 font-semibold'>
                  Average Revenue Growth
                </div>
                <p className='text-gray-400 text-sm mt-2'>
                  For e-commerce businesses within 6 months
                </p>
              </div>

              <div className='bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-red-700 transition-all duration-300 group'>
                <div className='text-red-600 text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300'>
                  450%
                </div>
                <div className='text-gray-300 font-semibold'>
                  Traffic Increase
                </div>
                <p className='text-gray-400 text-sm mt-2'>
                  Average website traffic growth after SEO implementation
                </p>
              </div>

              <div className='bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-red-700 transition-all duration-300 group'>
                <div className='text-red-600 text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300'>
                  87%
                </div>
                <div className='text-gray-300 font-semibold'>
                  Client Satisfaction
                </div>
                <p className='text-gray-400 text-sm mt-2'>
                  Of clients report exceeding their business goals
                </p>
              </div>

              <div className='bg-gray-900/50 p-6 rounded-lg border border-gray-800 hover:border-red-700 transition-all duration-300 group'>
                <div className='text-red-600 text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300'>
                  12X
                </div>
                <div className='text-gray-300 font-semibold'>Average ROI</div>
                <p className='text-gray-400 text-sm mt-2'>
                  Return on investment within the first year
                </p>
              </div>
            </div>

            {/* Featured Success Story */}
            <div className='mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-500 group border border-gray-800 hover:border-red-700'>
              <div className='flex flex-col lg:flex-row'>
                <div className='lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center'>
                  <div className='inline-block bg-red-900/30 px-4 py-2 rounded-full text-sm font-semibold text-red-400 mb-6'>
                    FEATURED SUCCESS STORY
                  </div>
                  <h3 className='text-2xl font-bold mb-4 group-hover:text-red-400 transition-colors duration-300'>
                    From Struggling Local Business to Industry Leader
                  </h3>
                  <p className='text-gray-300 mb-6'>
                    "Before joining Elite Business Coaching, we were a small
                    local fitness studio struggling to compete. After
                    implementing the marketing and branding strategies, we've
                    expanded to 3 locations and launched a successful online
                    training platform reaching clients worldwide."
                  </p>

                  <div className='flex items-center mb-6'>
                    <div className='w-16 h-16 rounded-full overflow-hidden mr-4 ring-2 ring-red-600'>
                      <img
                        src='https://placehold.co/200x200/404040/red?text=DW'
                        alt='David Wilson'
                        className='w-full h-full object-cover'
                        loading='lazy' // Lazy loading for featured image - might be good to eager load this one as it's more prominent
                      />
                    </div>
                    <div>
                      <h4 className='font-bold text-white'>David Wilson</h4>
                      <p className='text-sm text-gray-400'>
                        Founder, FitLife Studios
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-4'>
                    <div className='flex items-center bg-gray-800/70 px-4 py-2 rounded-lg'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5 text-red-500 mr-2'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-sm'>450% Revenue Growth</span>
                    </div>
                    <div className='flex items-center bg-gray-800/70 px-4 py-2 rounded-lg'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5 text-red-500 mr-2'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
                      </svg>
                      <span className='text-sm'>20,000+ New Clients</span>
                    </div>
                    <div className='flex items-center bg-gray-800/70 px-4 py-2 rounded-lg'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5 text-red-500 mr-2'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path d='M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z' />
                      </svg>
                      <span className='text-sm'>Launched Digital Platform</span>
                    </div>
                  </div>
                </div>

                <div className='lg:w-1/2 relative overflow-hidden'>
                  <div className='absolute inset-0 bg-gradient-to-r from-black to-transparent z-10 lg:from-transparent lg:to-black'></div>
                  <img
                    src='https://placehold.co/600x400/404040/red?text=Success+Story'
                    alt='FitLife Success Story'
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
                    loading='eager' // Eager loading for featured image as it's visually important
                  />
                </div>
              </div>
            </div>

            <div className='mt-12 text-center'>
              <button className='bg-red-600 hover:bg-red-700 transition-colors duration-300 text-white font-bold py-3 px-8 rounded-md inline-flex items-center group'>
                READ MORE SUCCESS STORIES
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Two Paths Section */}
        <section className='py-16 px-12'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            TWO PATHS, ONE CHOICE
          </h2>

          <div className='flex flex-col md:flex-row gap-6 justify-center'>
            <div className='w-full md:w-1/3 border border-red-800 hover:border-red-600 transition-colors duration-300 p-8 rounded-lg bg-gradient-to-b from-black to-gray-900 group'>
              <h3 className='text-2xl font-bold mb-2'>
                <span className='text-red-600'>$10,000+</span>
              </h3>
              <p className='text-gray-300 mb-8'>
                Traditional marketing agencies with high monthly retainers,
                long-term contracts, and generic strategies that don't align
                with your specific business needs.
              </p>

              <button className='w-full border border-red-600 hover:bg-red-900/30 transition-colors duration-300 text-red-600 font-bold py-3 px-6 rounded-md flex items-center justify-center group'>
                EXPLORE THIS OPTION
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </div>

            <div className='w-full md:w-1/3 bg-gradient-to-r from-red-800 to-red-900 p-8 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors duration-300 transform hover:scale-105 duration-300 shadow-lg'>
              <h3 className='text-2xl font-bold mb-2'>$997</h3>
              <p className='text-gray-200 mb-8'>
                Get comprehensive business coaching with personalized marketing,
                branding, and SEO strategies tailored to your specific industry
                and goals.
              </p>

              <button className='w-full bg-white hover:bg-gray-100 transition-colors duration-300 text-red-800 font-bold py-3 px-6 rounded-md flex items-center justify-center group'>
                GET STARTED NOW
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                ></svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
