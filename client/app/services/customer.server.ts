import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  ICustomer,
  ICustomerAttrs,
  ICustomerInteraction,
  ICustomerListResponse,
  ICustomerSearchQuery,
  ICustomerStatisticsQuery,
  IImportResult,
  IPaginationOptions,
  IUpdateCustomerData,
} from '~/interfaces/customer.interface';

// Lấy danh sách khách hàng với phân trang và query
const getCustomers = async (
  query: any = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  let url = `/customers?page=${page}&limit=${limit}`;

  if (sortBy) url += `&sortBy=${sortBy}`;
  if (sortOrder) url += `&sortOrder=${sortOrder}`;

  // Thêm các tham số query khác nếu có
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url += `&${key}=${encodeURIComponent(String(value))}`;
    }
  });

  // Nếu lọc theo trạng thái thanh toán, thêm tham số để backend có thể join với CaseService
  if (query.paymentStatus) {
    url += `&includePaymentInfo=true`;
  }

  const response = await fetcher(url, { request });
  return response as ICustomerListResponse;
};

// Lấy danh sách khách hàng với thông tin CaseService đi kèm
const getCustomersWithCaseServices = async (
  query: any = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;
  let url = `/customers/with-case-services?page=${page}&limit=${limit}`;

  if (sortBy) url += `&sortBy=${sortBy}`;
  if (sortOrder) url += `&sortOrder=${sortOrder}`;

  // Thêm các tham số query khác nếu có
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url += `&${key}=${encodeURIComponent(String(value))}`;
    }
  });

  const response = await fetcher(url, { request });
  return response as ICustomerListResponse;
};

// Lấy thông tin một khách hàng
const getCustomerById = async (id: string, request: ISessionUser) => {
  // Thêm tham số để lấy thông tin từ CaseService
  const response = await fetcher(`/customers/${id}`, {
    request,
  });
  return response as ICustomer;
};

// Tạo khách hàng mới
const createCustomer = async (
  customerData: ICustomerAttrs,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
      request,
    });

    return response as ICustomer;
  } catch (error: any) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Cập nhật thông tin khách hàng
const updateCustomer = async (
  id: string,
  data: IUpdateCustomerData,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response as ICustomer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Xóa khách hàng
const deleteCustomer = async (customerId: string, request: ISessionUser) => {
  try {
    const response = await fetcher(`/customers/${customerId}`, {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Thêm tương tác cho khách hàng
const addCustomerInteraction = async (
  id: string,
  interaction: Omit<ICustomerInteraction, 'createdAt'>,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/customers/${id}/interactions`, {
      method: 'POST',
      body: JSON.stringify(interaction),
      request,
    });
    return response as ICustomer;
  } catch (error) {
    console.error('Error adding customer interaction:', error);
    throw error;
  }
};

// Tìm kiếm khách hàng
const searchCustomers = async (
  searchQuery: ICustomerSearchQuery,
  request: ISessionUser,
) => {
  try {
    const params = new URLSearchParams();

    if (searchQuery.keyword) params.append('keyword', searchQuery.keyword);
    if (searchQuery.status) params.append('status', searchQuery.status);
    if (searchQuery.contactChannel)
      params.append('contactChannel', searchQuery.contactChannel);
    if (searchQuery.source) params.append('source', searchQuery.source);

    if (searchQuery.dateRange) {
      params.append('startDate', searchQuery.dateRange.start);
      params.append('endDate', searchQuery.dateRange.end);
    }

    // Thêm lọc theo trạng thái thanh toán (sẽ cần join với CaseService)
    if (searchQuery.paymentStatus) {
      params.append('paymentStatus', searchQuery.paymentStatus);
      params.append('includePaymentInfo', 'true');
    }

    const response = await fetcher(`/customers/search?${params.toString()}`, {
      request,
    });
    return response as ICustomerListResponse;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// Lấy thống kê khách hàng
const getCustomerStatistics = async (
  query: ICustomerStatisticsQuery,
  request: ISessionUser,
) => {
  try {
    const params = new URLSearchParams();
    params.append('groupBy', query.groupBy);

    if (query.dateRange) {
      params.append('startDate', query.dateRange.start);
      params.append('endDate', query.dateRange.end);
    }

    const response = await fetcher(
      `/customers/statistics?${params.toString()}`,
      { request },
    );
    return response;
  } catch (error) {
    console.error('Error getting customer statistics:', error);
    throw error;
  }
};

// Import khách hàng từ file CSV
const importCustomersFromCSV = async (file: File, request: ISessionUser) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/v1/customers/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${request.tokens.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Import failed');
    }

    const data = await response.json();
    return data as IImportResult;
  } catch (error) {
    console.error('Error importing customers:', error);
    throw error;
  }
};

// Xóa tất cả dữ liệu đã import
const deleteAllImportedData = async (request: ISessionUser) => {
  try {
    const response = await fetcher('/customers/delete-all', {
      method: 'DELETE',
      request,
    });
    return response as { success: boolean; deletedCount: number };
  } catch (error) {
    console.error('Error deleting all imported data:', error);
    throw error;
  }
};

// Get customer with case service by ID
const getCustomerWithCaseServiceById = async (
  id: string,
  request: ISessionUser,
  options?: {
    includeInteractions?: boolean;
    includeHistory?: boolean;
    select?: string;
  },
) => {
  try {
    // Xây dựng URL query với các tùy chọn để tối ưu tốc độ
    let url = `/customers/${id}/with-case-service`;
    const params = new URLSearchParams();

    // Chỉ lấy những dữ liệu cần thiết để giảm kích thước JSON
    if (options?.select) {
      params.append('select', options.select);
    }

    // Tùy chọn bỏ qua lịch sử tương tác để giảm thời gian query
    if (options?.includeInteractions === false) {
      params.append('includeInteractions', 'false');
    }

    // Tùy chọn bỏ qua lịch sử để giảm thời gian query
    if (options?.includeHistory === false) {
      params.append('includeHistory', 'false');
    }

    // Thêm params vào URL nếu có
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return (await fetcher(url, {
      request,
      headers: {
        // Thêm cache control cho client
        'Cache-Control': 'max-age=30',
      },
    })) as ICustomer;
  } catch (error) {
    console.error('Error fetching customer with case service:', error);
    throw error;
  }
};

// Xóa nhiều khách hàng
const deleteMultipleCustomers = async (
  customerIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher(`/customers/delete-multiple`, {
      method: 'DELETE',
      request,
      body: JSON.stringify({ customerIds }),
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error deleting multiple customers:', error);
    throw error;
  }
};

export {
  getCustomers,
  getCustomersWithCaseServices,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerInteraction,
  searchCustomers,
  getCustomerStatistics,
  importCustomersFromCSV,
  deleteAllImportedData,
  getCustomerWithCaseServiceById,
  deleteMultipleCustomers,
};
