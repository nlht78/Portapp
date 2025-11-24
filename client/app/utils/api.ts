/**
 * API Configuration Utility
 * Centralized API URL management for the application
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost in development
 */
export const getApiUrl = (): string => {
  return process.env.API_URL || 'http://localhost:8080';
};

/**
 * Get the API key from environment variables
 */
export const getApiKey = (): string => {
  return process.env.API_APIKEY || '';
};

/**
 * Build a full API URL with the given path
 * @param path - API endpoint path (e.g., '/api/v1/tokens')
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get default headers for API requests
 */
export const getDefaultHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
  };
};
