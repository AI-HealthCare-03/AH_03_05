import { signup, login, sendVerificationCode, verifyEmailCode, requestPasswordReset, confirmPasswordReset, logout, refresh, revokeAllDevices } from '../api/auth';

const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: { post: (...args: any[]) => mockPost(...args), delete: (...args: any[]) => mockDelete(...args) },
}));
jest.mock('../api/tokenStore', () => ({
  tokenStore: { save: jest.fn(), clear: jest.fn(), refreshToken: 'rt' },
}));

beforeEach(() => jest.clearAllMocks());

describe('auth API', () => {
  it('signup calls POST /auth/signup', async () => {
    mockPost.mockResolvedValue({ data: { user_id: 1 } });
    await signup({ email: 'a@b.com', password: 'pw', name: '홍', nickname: '길', consents: [] });
    expect(mockPost).toHaveBeenCalledWith('/auth/signup', expect.any(Object));
  });

  it('login calls POST /auth/login', async () => {
    mockPost.mockResolvedValue({ data: { access_token: 'at', refresh_token: 'rt' } });
    await login({ email: 'a@b.com', password: 'pw' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', expect.any(Object));
  });

  it('sendVerificationCode calls POST /auth/email-verify/send-code', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await sendVerificationCode({ email: 'a@b.com' });
    expect(mockPost).toHaveBeenCalledWith('/auth/email-verify/send-code', expect.any(Object));
  });

  it('verifyEmailCode calls POST /auth/email-verify/verify-code', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await verifyEmailCode({ email: 'a@b.com', code: '123456' });
    expect(mockPost).toHaveBeenCalledWith('/auth/email-verify/verify-code', expect.any(Object));
  });

  it('requestPasswordReset calls POST /auth/password-reset/request', async () => {
    mockPost.mockResolvedValue({ data: { detail: 'ok' } });
    await requestPasswordReset('a@b.com');
    expect(mockPost).toHaveBeenCalledWith('/auth/password-reset/request', expect.any(Object));
  });

  it('confirmPasswordReset calls POST /auth/password-reset/confirm', async () => {
    mockPost.mockResolvedValue({ data: { detail: 'ok' } });
    await confirmPasswordReset('a@b.com', '123456', 'newPw!');
    expect(mockPost).toHaveBeenCalledWith('/auth/password-reset/confirm', expect.any(Object));
  });

  it('logout calls POST /auth/logout', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await logout();
    expect(mockPost).toHaveBeenCalledWith('/auth/logout', expect.any(Object));
  });

  it('refresh calls POST /auth/refresh', async () => {
    mockPost.mockResolvedValue({ data: { access_token: 'new_at' } });
    await refresh('rt');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', expect.any(Object));
  });

  it('revokeAllDevices calls DELETE /users/me/devices', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await revokeAllDevices();
    expect(mockDelete).toHaveBeenCalledWith('/users/me/devices');
  });
});
