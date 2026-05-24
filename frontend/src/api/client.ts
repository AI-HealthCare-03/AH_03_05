import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './tokenStore';
import type { ApiError } from './types';

// Set EXPO_PUBLIC_API_URL in .env for non-local environments
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:80/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// interceptor를 거치지 않는 별도 인스턴스 — refresh 전용
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && config && !config._retry) {
      const refreshToken = tokenStore.refreshToken;

      if (!refreshToken) {
        await tokenStore.clear();
        tokenStore.triggerUnauthorized();
        return Promise.reject(error);
      }

      config._retry = true;

      try {
        const { data } = await refreshClient.post<{ access_token: string; refresh_token: string }>(
          '/auth/refresh',
          { refresh_token: refreshToken },
        );
        await tokenStore.save(data.access_token, data.refresh_token);
        config.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(config);
      } catch {
        await tokenStore.clear();
        tokenStore.triggerUnauthorized();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error('[API Error]', {
      status,
      url: error.config?.url,
      method: error.config?.method,
      data,
      code: error.code,
    });

    if (status === 401) return '로그인이 필요합니다.';
    if (status === 403) return '권한이 없습니다.';
    if (status === 404) return '요청한 정보를 찾을 수 없습니다.';
    if (status === 409) return '이미 존재하는 정보입니다.';
    if (status === 413) return '파일 크기가 너무 큽니다. (최대 10MB)';
    if (status === 422) return '입력값을 확인해주세요.';
    if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    if (status === 504) return '요청 시간이 초과됐습니다. 잠시 후 다시 시도해주세요.';
    if (status !== undefined && status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    if (error.code === 'ECONNABORTED') return '요청 시간이 초과되었습니다.';
    if (!error.response) return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
    return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  console.error('[Unknown Error]', error);
  return '알 수 없는 오류가 발생했습니다.';
}
