import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { clearAuthToken, readAuthToken } from '@/services/authStorage';
import { getErrorMessage } from '@/utils/errorMessage';

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  traceId?: string | null;
  timestamp: string;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const useMockApi = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000),
});

apiClient.interceptors.request.use((config) => {
  if (!useMockApi) {
    const token = readAuthToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown> | undefined;
    if (payload?.code && payload.code !== '0') {
      return Promise.reject(
        new ApiRequestError(
          getErrorMessage(
            { message: payload.message || '请求失败，请稍后重试', code: payload.code },
            '请求失败，请稍后重试。',
          ),
          response.status,
          payload.code,
        ),
      );
    }

    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const rawMessage = error.response?.data?.message || error.message || '请求失败，请稍后重试';
    const message =
      error.code === 'ECONNABORTED' || rawMessage.toLowerCase().includes('timeout')
        ? '请求超时：AI 生成可能需要更长时间，请稍后重试或减少生成数量。'
        : getErrorMessage({ message: rawMessage, status, code }, '请求失败，请稍后重试。');

    if (!useMockApi && status === 401) {
      clearAuthToken();
      window.dispatchEvent(new CustomEvent('mindmark:auth-expired'));
    }
    return Promise.reject(new ApiRequestError(message, status, code));
  },
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });

  return response.data.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config);

  return response.data.data;
}

export async function apiPatch<T, B = unknown>(url: string, body: B): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body);

  return response.data.data;
}

export async function apiPut<T, B = unknown>(url: string, body: B): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body);

  return response.data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url);

  return response.data.data;
}

export async function apiDownloadBlob(url: string): Promise<Blob> {
  const response = await apiClient.get(url, { responseType: 'blob' });

  return response.data as Blob;
}
