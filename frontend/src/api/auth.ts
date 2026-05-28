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

// TODO: BE 명세 확정 후 endpoint 경로 통일 필요
// sendEmailCode → '/auth/email/verify/send'
// verifyEmailCode → '/auth/email-verify/confirm'
// 참고: PR #72 리뷰 코멘트
// TODO: [BE 대기] POST /auth/email-verify/send 미구현 — 구현 완료 후 mock 제거
// 409 → 이미 사용 중인 이메일
export async function sendEmailCode(email: string): Promise<void> {
  await apiClient.post('/auth/email-verify/send', { email });
}

// TODO: [BE 대기] POST /auth/email-verify/confirm 미구현 — 구현 완료 후 mock 제거
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  await apiClient.post('/auth/email-verify/confirm', { email, code });
}

export async function refresh(refreshToken: string): Promise<{ access_token: string }> {
  const res = await apiClient.post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken });
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
