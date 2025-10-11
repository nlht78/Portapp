import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import {
  IUserTokenResponse,
  IUserTokenListResponse,
  IUserTokenCreateData,
  IUserTokenUpdateData,
} from '~/interfaces/userToken.interface';

// Lấy danh sách user tokens của user
const getUserTokens = async (
  request: ISessionUser,
  query: { page?: number; limit?: number } = {},
) => {
  const queryString = new URLSearchParams();
  if (query.page) queryString.append('page', query.page.toString());
  if (query.limit) queryString.append('limit', query.limit.toString());

  const response = await fetcher(
    `/user-tokens?${queryString.toString()}`,
    {
      method: 'GET',
      request,
    },
  );

  return response as IUserTokenListResponse;
};

// Lấy user tokens với statistics
const getUserTokensWithStats = async (request: ISessionUser) => {
  const response = await fetcher('/user-tokens/with-stats', {
    method: 'GET',
    request,
  });
  return response as IUserTokenResponse;
};

// Tạo user token mới
const createUserToken = async (
  data: IUserTokenCreateData,
  request: ISessionUser,
) => {
  const response = await fetcher('/user-tokens', {
    method: 'POST',
    body: JSON.stringify(data),
    request,
  });
  return response as IUserTokenResponse;
};

// Lấy user token theo ID
const getUserTokenById = async (
  tokenId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/user-tokens/${tokenId}`, {
    method: 'GET',
    request,
  });
  return response as IUserTokenResponse;
};

// Cập nhật user token
const updateUserToken = async (
  tokenId: string,
  data: IUserTokenUpdateData,
  request: ISessionUser,
) => {
  const response = await fetcher(`/user-tokens/${tokenId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    request,
  });
  return response as IUserTokenResponse;
};

// Xóa user token
const deleteUserToken = async (
  tokenId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/user-tokens/${tokenId}`, {
    method: 'DELETE',
    request,
  });
  return response as IUserTokenResponse;
};

// Kiểm tra token tồn tại
const checkTokenExists = async (
  tokenId: string,
  request: ISessionUser,
) => {
  const response = await fetcher(`/user-tokens/check/${tokenId}`, {
    method: 'GET',
    request,
  });
  return response as IUserTokenResponse;
};

// Lấy thống kê user tokens
const getUserTokenStatistics = async (request: ISessionUser) => {
  const response = await fetcher('/user-tokens/statistics', {
    method: 'GET',
    request,
  });
  return response as IUserTokenResponse;
};

export {
  getUserTokens,
  getUserTokensWithStats,
  createUserToken,
  getUserTokenById,
  updateUserToken,
  deleteUserToken,
  checkTokenExists,
  getUserTokenStatistics,
};
