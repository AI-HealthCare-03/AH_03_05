import { apiClient } from './client';
import { tokenStore } from './tokenStore';
import type { SignUpRequest, SignUpResponse, LoginRequest, LoginResponse, LogoutResponse } from './types';

export async function signup(data: SignUpRequest): Promise<SignUpResponse> {
  const res = await apiClient.post<SignUpResponse>('/auth/signup', data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', data);
  await tokenStore.save(res.data.access_token, res.data.refresh_token);
  return res.data;
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const res = await apiClient.post<LogoutResponse>('/auth/logout', {
      refresh_token: tokenStore.refreshToken ?? '',
    });
    return res.data;
  } finally {
    await tokenStore.clear();
  }
}
