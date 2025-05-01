import CRMButton from './CRMButton';

export default function ContentHeader({
  title,
  actionContent,
  actionHandler,
}: {
  title: string;
  actionContent?: React.ReactNode;
  actionHandler?: () => void;
}) {
  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
      <h1 className='text-xl font-semibold'>{title}</h1>
      <div className='flex space-x-2'>
        {actionContent && actionHandler && (
          <CRMButton color='blue' type='button' onClick={() => actionHandler()}>
            {actionContent}
          </CRMButton>
        )}
      </div>
    </div>
  );
}
