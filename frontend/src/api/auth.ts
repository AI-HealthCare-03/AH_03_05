import { apiClient } from './client';
import { tokenStore } from './tokenStore';
import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  EmailVerifySendRequest,
  EmailVerifySendResponse,
  EmailVerifyConfirmRequest,
  EmailVerifyConfirmResponse,
} from './types';

export async function signup(data: SignUpRequest): Promise<SignUpResponse> {
  const res = await apiClient.post<SignUpResponse>('/auth/signup', data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', data);
  await tokenStore.save(res.data.access_token, res.data.refresh_token);
  return res.data;
}

export async function sendVerificationCode(
  data: EmailVerifySendRequest
): Promise<EmailVerifySendResponse> {
  const res = await apiClient.post<EmailVerifySendResponse>('/auth/email-verify/send-code', data);
  return res.data;
}

export async function verifyEmailCode(
  data: EmailVerifyConfirmRequest
): Promise<EmailVerifyConfirmResponse> {
  const res = await apiClient.post<EmailVerifyConfirmResponse>(
    '/auth/email-verify/verify-code',
    data
  );
  return res.data;
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  const res = await apiClient.post<{ detail: string }>('/auth/password-reset/request', { email });
  return res.data;
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  new_password: string
): Promise<{ detail: string }> {
  const res = await apiClient.post<{ detail: string }>('/auth/password-reset/confirm', {
    email,
    code,
    new_password,
  });
  return res.data;
}

export async function refresh(refreshToken: string): Promise<{ access_token: string }> {
  const res = await apiClient.post<{ access_token: string }>('/auth/refresh', {
    refresh_token: refreshToken,
  });
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
