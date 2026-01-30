
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getBearerToken } from '@/lib/auth';

const API_URL = Constants.expoConfig?.extra?.backendUrl || '';

console.log('[API] Backend URL:', API_URL);

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;

  // Add query parameters if provided
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  console.log(`[API] ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log('[API] Request body:', options.body);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  console.log(`[API] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] Error response:`, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[API] Response data:', data);
  return data;
}

async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getBearerToken();
  
  console.log(`[API] Authenticated request to ${endpoint}, token present: ${!!token}`);
  if (token) {
    console.log(`[API] Sending Authorization header: Bearer ${token.substring(0, 10)}...`);
  }

  return request<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

// Public API methods (no authentication required)
export const apiGet = <T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> =>
  request<T>(endpoint, { method: 'GET', params });

export const apiPost = <T>(endpoint: string, data?: unknown): Promise<T> =>
  request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data?: unknown): Promise<T> =>
  request<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T>(endpoint: string): Promise<T> =>
  request<T>(endpoint, { method: 'DELETE' });

// Authenticated API methods (require bearer token)
export const authenticatedGet = <T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> =>
  authenticatedRequest<T>(endpoint, { method: 'GET', params });

export const authenticatedPost = <T>(endpoint: string, data?: unknown): Promise<T> =>
  authenticatedRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const authenticatedPut = <T>(endpoint: string, data?: unknown): Promise<T> =>
  authenticatedRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const authenticatedDelete = <T>(endpoint: string): Promise<T> =>
  authenticatedRequest<T>(endpoint, { 
    method: 'DELETE',
    headers: {
      // DELETE requests should not have Content-Type header if no body
    }
  });
