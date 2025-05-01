import { Link } from '@remix-run/react';
import { IImage } from '~/interfaces/image.interface';

export default function ImageGridLayout({ images }: { images: IImage[] }) {
  return (
    <div className='grid grid-cols-8 gap-4'>
      {images.map((image, index) => (
        <Link
          key={index}
          to={`/cmsdesk/images/${image.id}`}
          className={`border-2 rounded-lg aspect-square cursor-pointer flex justify-center items-center transition-all
  border-gray-300`}
        >
          <img
            src={image.img_url || '/assets/placeholder.png'}
            alt={image.img_title}
            className='object-contain'
          />
        </Link>
      ))}
    </div>
  );
}
