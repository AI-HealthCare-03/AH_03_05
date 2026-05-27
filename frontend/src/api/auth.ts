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

// TODO: [BE 대기] POST /auth/email-verify/send 미구현 — 구현 완료 후 mock 제거
// 409 → 이미 사용 중인 이메일
export async function sendEmailCode(email: string): Promise<void> {
  await apiClient.post('/auth/email-verify/send', { email });
}

// TODO: [BE 대기] POST /auth/email-verify/confirm 미구현 — 구현 완료 후 mock 제거
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  await apiClient.post('/auth/email-verify/confirm', { email, code });
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
