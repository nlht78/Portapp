import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  ICaseService,
  ICaseServiceAttrs,
  ICaseServiceFilter,
  ICaseServicePagination,
  ICaseListResponse,
  ICaseResponse,
  IUpdateCaseData,
  ISearchCasesQuery,
  ICaseStatisticsQuery,
  ICaseProgressData,
  ICasePaymentData,
  ICaseStaffData,
  IProcessStatus,
  ICaseServiceDailyReport,
} from '~/interfaces/caseService.interface';

// Helper function to get process status data, handling both old and new formats
export const getProcessStatus = (caseService: ICaseService): IProcessStatus => {
  // If case_processStatus exists, use it
  if (caseService.case_processStatus) {
    return caseService.case_processStatus;
  }

  // Otherwise, construct from individual fields
  return {
    isScanned: caseService.case_isScanned || false,
    isFullInfo: caseService.case_isFullInfo || false,
    isAnalysisSent: caseService.case_isAnalysisSent || false,
    isPdfExported: caseService.case_isPdfExported || false,
    isFullyPaid: caseService.case_isFullyPaid || false,
    isSoftFileSent: caseService.case_isSoftFileSent || false,
    isPrinted: caseService.case_isPrintedAndSent || false,
    isPhysicalCopySent: caseService.case_isPhysicalCopySent || false,
    isDeepConsulted: caseService.case_isDeepConsulted || false,
  };
};

// Helper function to get staff data, handling both old and new formats
export const getStaffInfo = (caseService: ICaseService) => {
  // If case_staff exists, use it
  if (caseService.case_staff) {
    return caseService.case_staff;
  }

  // Otherwise, construct from individual fields
  return {
    consultant: caseService.case_consultantId
      ? {
          id: caseService.case_consultantId,
          employeeId: '',
          employeeCode: '',
          fullName: caseService.case_consultantName || '',
          email: '',
        }
      : null,
    fingerprintTaker: caseService.case_fingerprintTakerId
      ? {
          id: caseService.case_fingerprintTakerId,
          employeeId: '',
          employeeCode: '',
          fullName: caseService.case_fingerprintTakerName || '',
          email: '',
        }
      : null,
    counselor: caseService.case_mainCounselorId
      ? {
          id: caseService.case_mainCounselorId,
          employeeId: '',
          employeeCode: '',
          fullName: caseService.case_counselorName || '',
          email: '',
        }
      : null,
  };
};

// Lấy danh sách case services với phân trang và lọc
const getCases = async (
  filter: ICaseServiceFilter = {},
  pagination: ICaseServicePagination = {},
  request: ISessionUser,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    let url = `/case-services?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    // Add filter parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url += `&${key}=${encodeURIComponent(String(value))}`;
      }
    });

    const response = await fetcher(url, { request });
    return response as ICaseListResponse;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
};

// Example of how to use the helper functions
export const getFormattedCaseService = (
  caseService: ICaseService,
): ICaseService => {
  const processStatus = getProcessStatus(caseService);

  return {
    ...caseService,
    case_processStatus: processStatus,
  };
};

// Lấy tất cả case services không có lọc
const getAllCaseServices = async (request: ISessionUser) => {
  try {
    const response = await fetcher('/case-services/all/direct', { request });
    const result = response as {
      data: ICaseService[];
      total: number;
      message: string;
    };

    // Format the response data to ensure it has the new structure
    const formattedData = {
      ...result,
      data: result.data.map(getFormattedCaseService),
    };

    return formattedData;
  } catch (error) {
    console.error('Error fetching all case services:', error);
    throw error;
  }
};

// Lấy thông tin một case service
const getCaseById = async (id: string, request: ISessionUser) => {
  try {
    const response = await fetcher(`/case-services/${id}`, { request });
    const result = response as ICaseService;

    // Format the case service to ensure it has the new structure
    return getFormattedCaseService(result);
  } catch (error) {
    console.error(`Error fetching case ${id}:`, error);
    throw error;
  }
};

// Tạo case service mới
const createCase = async (data: ICaseServiceAttrs, request: ISessionUser) => {
  try {
    const response = await fetcher('/case-services', {
      method: 'POST',
      body: JSON.stringify(data),
      request,
    });
    return response as ICaseService;
  } catch (error) {
    console.error('Error creating case service:', error);
    throw error;
  }
};

// Cập nhật case service
const updateCase = async (
  id: string,
  data: IUpdateCaseData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response as ICaseResponse;
  } catch (error) {
    console.error(`Error updating case ${id}:`, error);
    throw error;
  }
};

// Xóa case service
const deleteCase = async (id: string, request: ISessionUser) => {
  try {
    const response = await fetcher(`/case-services/${id}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error(`Error deleting case ${id}:`, error);
    throw error;
  }
};

// Xóa nhiều case service
const bulkDeleteCases = async (caseIds: string[], request: ISessionUser) => {
  try {
    const response = await fetcher('/case-services/multiple', {
      method: 'DELETE',
      body: JSON.stringify({ caseIds }),
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error bulk deleting cases:', error);
    throw error;
  }
};

// Cập nhật tiến độ case service
const updateCaseProgress = async (
  id: string,
  data: ICaseProgressData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      request,
    });
    return response as ICaseResponse;
  } catch (error) {
    console.error(`Error updating case progress for ${id}:`, error);
    throw error;
  }
};

// Cập nhật thông tin thanh toán
const updateCasePayment = async (
  id: string,
  data: ICasePaymentData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      request,
    });
    return response as ICaseResponse;
  } catch (error) {
    console.error(`Error updating case payment for ${id}:`, error);
    throw error;
  }
};

// Cập nhật trạng thái xử lý
const updateProcessStatus = async (
  id: string,
  statusField: string,
  value: boolean,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/${id}/process-status`, {
      method: 'PATCH',
      body: JSON.stringify({ field: statusField, value }),
      request,
    });

    const result = response as ICaseResponse;

    // Format the case service to ensure it has the new structure
    result.data = getFormattedCaseService(result.data);

    return result;
  } catch (error) {
    console.error(`Error updating process status for ${id}:`, error);
    throw error;
  }
};

// Phân công nhân viên
const assignStaff = async (
  id: string,
  data: ICaseStaffData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/${id}/assign-staff`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      request,
    });
    return response as ICaseResponse;
  } catch (error) {
    console.error(`Error assigning staff for case ${id}:`, error);
    throw error;
  }
};

// Lấy case services của một khách hàng
const getCasesByCustomer = async (
  customerId: string,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/case-services/customer/${customerId}`, {
      request,
    });
    return response as ICaseService[];
  } catch (error) {
    console.error(`Error fetching cases for customer ${customerId}:`, error);
    throw error;
  }
};

// Tìm kiếm case services
const searchCases = async (
  searchQuery: ISearchCasesQuery,
  request: ISessionUser,
) => {
  try {
    // Convert searchQuery to URL params
    const params = new URLSearchParams();

    if (searchQuery.keyword) params.append('keyword', searchQuery.keyword);

    if (searchQuery.dateRange) {
      params.append('startDate', searchQuery.dateRange.start);
      params.append('endDate', searchQuery.dateRange.end);
    }

    if (searchQuery.customerId)
      params.append('customerId', searchQuery.customerId);

    if (searchQuery.paymentStatus)
      params.append('paymentStatus', searchQuery.paymentStatus);

    // Process status filters (nested object)
    if (searchQuery.processStatus) {
      Object.entries(searchQuery.processStatus).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(`processStatus[${key}]`, String(value));
        }
      });
    }

    // Staff filters (nested object)
    if (searchQuery.staff) {
      Object.entries(searchQuery.staff).forEach(([key, value]) => {
        if (value) {
          params.append(`staff[${key}]`, value);
        }
      });
    }

    if (searchQuery.appointmentDate) {
      params.append('appointmentStartDate', searchQuery.appointmentDate.start);
      params.append('appointmentEndDate', searchQuery.appointmentDate.end);
    }

    const response = await fetcher(
      `/case-services/search?${params.toString()}`,
      { request },
    );
    const results = response as ICaseService[];

    // Format each case service to ensure they have the new structure
    return results.map(getFormattedCaseService);
  } catch (error) {
    console.error('Error searching cases:', error);
    throw error;
  }
};

const getCaseStatistics = async (
  type: string,
  date: string,
  groupBy: string,
  request: ISessionUser,
) => {
  const response = await fetcher(
    `/case-services/report?type=${type}&date=${date}&groupBy=${groupBy}`,
    {
      method: 'GET',
      request,
    },
  );

  return response as ICaseServiceDailyReport[];
};

const getCaseServiceRevenue = async (
  type: string,
  date: string,
  request: ISessionUser,
) => {
  const response = await fetcher(
    `/case-services/report/revenue?type=${type}&date=${date}`,
    {
      method: 'GET',
      request,
    },
  );
  return response as number;
};

const getCaseServiceDebt = async (
  type: string,
  date: string,
  request: ISessionUser,
) => {
  const response = await fetcher(
    `/case-services/report/debt?type=${type}&date=${date}`,
    {
      method: 'GET',
      request,
    },
  );
  return response as number;
};

export {
  getCases,
  getAllCaseServices,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  bulkDeleteCases,
  updateCaseProgress,
  updateCasePayment,
  updateProcessStatus,
  assignStaff,
  getCasesByCustomer,
  searchCases,
  getCaseStatistics,
  getCaseServiceDebt,
  getCaseServiceRevenue,
};
