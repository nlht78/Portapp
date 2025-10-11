// Utility functions for authentication

export const getAccessTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const accessToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('_accessToken='))
    ?.split('=')[1];
  
  return accessToken || null;
};

export const getRefreshTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const refreshToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('_refreshToken='))
    ?.split('=')[1];
  
  return refreshToken || null;
};

export const getAuthHeaders = (userId: string) => {
  const accessToken = getAccessTokenFromCookie();
  
  if (!accessToken) {
    throw new Error('No access token found');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'x-client-id': userId,
  };
};
