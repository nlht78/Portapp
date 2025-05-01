import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  ICreateKPIData,
  IUpdateKPIData,
  IUpdateKPIInstanceData,
  IKPI,
  IAdminUpdateKPIData,
  IAdminUpdateKPIInstanceData,
  IKPIInstance,
} from '~/interfaces/kpi.interface';

// Lấy danh sách KPI cho admin
const getKPIs = async (request: ISessionUser) => {
  const response = await fetcher('/kpi', { request });
  return response as IKPI[];
};

// Lấy thông tin một KPI
const getKPIById = async (id: string, request: ISessionUser): Promise<IKPI> => {
  const response = await fetcher(`/kpi/${id}`, { request });
  return response as IKPI;
};

// Lấy thông tin một KPI Instance
const getKPIInstanceById = async (
  id: string,
  request: ISessionUser,
): Promise<IKPIInstance> => {
  const response = await fetcher(`/kpi/instances/${id}`, { request });
  return response as IKPIInstance;
};

// Tạo KPI mới
const createKPI = async (
  data: ICreateKPIData,
  request: ISessionUser,
): Promise<IKPI> => {
  const formattedData = {
    ...data,
    isActive:
      typeof data.isActive === 'string'
        ? data.isActive === 'true'
        : data.isActive,
  };

  const response = await fetcher('/kpi', {
    method: 'POST',
    body: JSON.stringify(formattedData),
    request,
  });
  return response as IKPI;
};

// Cập nhật KPI
const updateKPI = async (
  id: string,
  data: IUpdateKPIData,
  request: ISessionUser,
): Promise<IKPI> => {
  const response = await fetcher(`/kpi/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IKPI;
};

// Xóa KPI
const deleteKPI = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/kpi/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as { success: boolean };
};

const deleteKPIInstance = async (
  id: string,
  request: ISessionUser,
): Promise<{ success: boolean }> => {
  const response = await fetcher(`/kpi/instances/${id}`, {
    method: 'DELETE',
    request,
  });
  return response as { success: boolean };
};

// Lấy danh sách KPI Instance của một KPI
const getKPIInstances = async (kpiId: string, request: ISessionUser) => {
  const response = await fetcher(`/kpi/${kpiId}/instances`, { request });
  return response as IKPIInstance[];
};

// Cập nhật tiến độ KPI Instance
const updateKPIInstanceProgress = async (
  instanceId: string,
  data: IUpdateKPIInstanceData,
  request: ISessionUser,
) => {
  try {
    // Make sure data is properly formatted - ensuring the completed value is a number
    const formattedData = {
      completed:
        typeof data.completed === 'string'
          ? parseInt(data.completed)
          : data.completed,
    };

    // Use the exact same format as seen in the working endpoint
    const response = await fetcher(`/kpi/instances/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(formattedData),
      request,
    });
    return response as IKPI;
  } catch (error) {
    throw error;
  }
};

// Admin function to update all KPI instance fields
const updateKPIInstanceAdmin = async (
  instanceId: string,
  data: IAdminUpdateKPIInstanceData,
  request: ISessionUser,
) => {
  try {
    // Format the data properly
    const formattedData = {
      ...data,
      // Ensure numeric values are properly converted
      completed:
        typeof data.completed === 'string'
          ? parseInt(data.completed)
          : data.completed,
      goal: typeof data.goal === 'string' ? parseInt(data.goal) : data.goal,
    };

    const response = await fetcher(`/kpi/instances/${instanceId}/admin`, {
      method: 'PUT',
      body: JSON.stringify(formattedData),
      request,
    });
    return response as IKPI;
  } catch (error) {
    throw error;
  }
};

// Lấy hiệu suất KPI của nhân viên
const getEmployeeKPIPerformance = async (
  employeeId: string,
  startDate: string,
  endDate: string,
  request: ISessionUser,
) => {
  const response = await fetcher(
    `/employees/${employeeId}/kpi/performance?startDate=${startDate}&endDate=${endDate}`,
    { request },
  );
  return response as IKPIInstance[];
};

// Lọc KPI theo trạng thái
const filterKPIsByStatus = async (
  status: 'active' | 'inactive' | boolean,
  request: ISessionUser,
) => {
  // Xử lý chuyển đổi boolean thành chuỗi status nếu cần
  let statusParam: string;
  if (typeof status === 'boolean') {
    statusParam = status ? 'active' : 'inactive';
  } else {
    statusParam = status;
  }

  console.log(`Filtering KPIs by status: ${statusParam}`);
  const response = await fetcher(`/kpi?status=${statusParam}`, { request });
  return response as IKPI[];
};

// Tìm kiếm KPI
const searchKPIs = async (query: string, request: ISessionUser) => {
  const response = await fetcher(`/kpi/search?q=${query}`, { request });
  return response as IKPI[];
};

// Lấy danh sách KPI với thông tin instance
const getKPIsWithInstances = async (request: ISessionUser) => {
  const response = await fetcher('/kpi/instances', { request });
  return response as IKPI[];
};

// Lấy danh sách KPI của nhân viên với thông tin instance
const getEmployeeKPIInstances = async (
  userId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/employees/${userId}/kpi/instances`, {
    request,
  });
  return response as IKPIInstance[];
};

export {
  getKPIs,
  getKPIById,
  createKPI,
  updateKPI,
  deleteKPI,
  deleteKPIInstance,
  getKPIInstances,
  updateKPIInstanceProgress,
  updateKPIInstanceAdmin,
  getEmployeeKPIPerformance,
  filterKPIsByStatus,
  searchKPIs,
  getKPIsWithInstances,
  getEmployeeKPIInstances,
  getKPIInstanceById,
};
