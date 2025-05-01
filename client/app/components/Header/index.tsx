import { useMainLoaderData } from '~/lib/useMainLoaderData';
import { useState } from 'react';

export default function Header({ shadow }: { shadow?: boolean }) {
  return (
    <header className='h-[70px] bg-black  top-0 z-50 shadow-md relative'>
      <img
        src='https://placehold.co/200x50/404040/red?text=Elite+Business+Coaching'
        alt='Elite Business Coaching'
        className='h-8 w-32 m-auto'
      />
    </header>
  );
}
