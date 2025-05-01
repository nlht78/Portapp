import { useFetcher, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Defer from '~/components/Defer';
import TextAreaInput from '~/components/TextAreaInput';
import TextInput from '~/components/TextInput';
import { IEmployee } from '~/interfaces/employee.interface';
import { IKPI } from '~/interfaces/kpi.interface';
import { action } from '~/routes/hrm+/_admin+/kpi+/new';
import Select from '~/widgets/Select';
import HRMButton from '../../_components/HRMButton';

export default function KPIForm({
  kpi,
  type,
  employees,
}: {
  kpi?: IKPI;
  type: 'create' | 'update';
  employees: Promise<IEmployee[]> | IEmployee[];
}) {
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [name, setName] = useState(kpi?.name || '');
  const [description, setDescription] = useState(kpi?.description || '');
  const [intervalType, setIntervalType] = useState(
    kpi?.intervalType || 'daily',
  );
  const [isActive, setIsActive] = useState(kpi?.isActive || (true as boolean));
  const [assigneeId, setAssigneeId] = useState(kpi?.assigneeId.id || '');
  const [baseGoal, setBaseGoal] = useState(kpi?.baseGoal || 0);
  const [isChanged, setIsChanged] = useState(false);

  const toastIdRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading(
          type === 'update' ? 'Đang cập nhật...' : 'Đang tạo...',
          {
            autoClose: false,
          },
        );
        setLoading(true);
        break;

      case 'loading':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);

          if (type === 'create') {
            navigate(`/hrm/kpi/${fetcher.data.kpi?.id}`);
          }
          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <fetcher.Form
      method={type === 'create' ? 'POST' : 'PUT'}
      action={`/hrm/kpi/${type === 'create' ? 'new' : kpi?.id}`}
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* KPI Information */}
        <div>
          <TextInput
            label='Tên KPI*'
            id='name'
            type='text'
            name='name'
            value={name}
            onChange={(value) => {
              setName(value);
              setIsChanged(kpi?.name !== value);
            }}
            required
          />
        </div>

        <div className='col-start-2 row-span-4'>
          <TextAreaInput
            label='Mô tả'
            id='description'
            name='description'
            value={description}
            className='min-h-full'
            onChange={(value) => {
              setDescription(value);
              setIsChanged(kpi?.description !== value);
            }}
          />
        </div>

        <div className='flex gap-4'>
          <div className='w-1/2'>
            <TextInput
              label='Mục tiêu KPI*'
              id='goal'
              type='number'
              min={0}
              name='baseGoal'
              value={baseGoal}
              onChange={(value) => {
                setBaseGoal(Number(value));
                setIsChanged(kpi?.baseGoal !== Number(value));
              }}
              required
            />
          </div>

          <div className='w-1/2'>
            <label
              htmlFor='isActive'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Trạng thái
            </label>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center'>
                <input
                  id='active'
                  type='radio'
                  name='isActive'
                  value='true'
                  checked={isActive}
                  onChange={() => {
                    setIsActive(true);
                    setIsChanged(kpi?.isActive !== true);
                  }}
                  className='h-4 w-4 text-red-600 focus:ring-red-500'
                />
                <label htmlFor='active' className='ml-2 text-sm text-gray-700'>
                  Hoạt động
                </label>
              </div>
              <div className='flex items-center'>
                <input
                  id='inactive'
                  type='radio'
                  name='isActive'
                  value='false'
                  checked={!isActive}
                  onChange={() => {
                    setIsActive(false);
                    setIsChanged(kpi?.isActive !== false);
                  }}
                  className='h-4 w-4 text-red-600 focus:ring-red-500'
                />
                <label
                  htmlFor='inactive'
                  className='ml-2 text-sm text-gray-700'
                >
                  Không hoạt động
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Select
            label='Loại chu kỳ'
            id='intervalType'
            name='intervalType'
            value={intervalType}
            onChange={(e) => setIntervalType(e.target.value as any)}
            className='w-full'
            required
          >
            <option value='daily'>Hàng ngày</option>
            <option value='weekly'>Hàng tuần</option>
            <option value='monthly'>Hàng tháng</option>
            <option value='quarterly'>Hàng quý</option>
            <option value='yearly'>Hàng năm</option>
          </Select>
        </div>

        <div>
          <Defer resolve={employees} fallback={<div>Nhân viên phụ trách</div>}>
            {(data) => (
              <Select
                label='Nhân viên phụ trách'
                id='assigneeId'
                name='assigneeId'
                value={assigneeId}
                onChange={(e) => {
                  setIsChanged(kpi?.assigneeId.id !== e.target.value);
                  setAssigneeId(e.target.value);
                }}
                className='w-full'
                required
              >
                {data.map((employee) => {
                  // Get user ID safely, handling both structure types
                  const userId = employee.userId.id;
                  const firstName = employee.userId?.usr_firstName;
                  const lastName = employee.userId?.usr_lastName;
                  const employeeCode = employee.employeeCode || '';
                  const position = employee.position || '';

                  return (
                    <option key={userId} value={userId}>
                      {employeeCode} - {firstName} {lastName} ({position})
                    </option>
                  );
                })}
              </Select>
            )}
          </Defer>
        </div>
      </div>

      <div className='mt-8 flex justify-end space-x-3'>
        <HRMButton
          color='transparent'
          type='button'
          onClick={() => {
            if (confirm('Bạn có chắc chắn muốn hủy bỏ không?')) {
              navigate(-1);
            }
          }}
          disabled={loading}
        >
          Hủy bỏ
        </HRMButton>

        <HRMButton color='blue' type='submit' disabled={loading || !isChanged}>
          <span className='material-symbols-outlined mr-1 text-sm'>save</span>
          {type === 'create' ? 'Tạo KPI' : 'Cập nhật KPI'}
        </HRMButton>
      </div>
    </fetcher.Form>
  );
}
