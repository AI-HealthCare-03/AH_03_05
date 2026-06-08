import { getMe, updateMe, changePassword, deleteAccount, getConsents, updateConsent } from '../api/users';

const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    patch: (...args: any[]) => mockPatch(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('users API', () => {
  it('getMe calls GET /users/me', async () => {
    mockGet.mockResolvedValue({ data: { user_id: 1 } });
    await getMe();
    expect(mockGet).toHaveBeenCalledWith('/users/me');
  });

  it('updateMe calls PATCH /users/me', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await updateMe({ nickname: '새닉네임' });
    expect(mockPatch).toHaveBeenCalledWith('/users/me', expect.any(Object));
  });

  it('changePassword calls PATCH /users/me/password', async () => {
    mockPatch.mockResolvedValue({ data: { message: 'ok' } });
    await changePassword({ current_password: 'old', new_password: 'new' });
    expect(mockPatch).toHaveBeenCalledWith('/users/me/password', expect.any(Object));
  });

  it('deleteAccount calls DELETE /users/me', async () => {
    mockDelete.mockResolvedValue({ data: { detail: 'ok' } });
    await deleteAccount('pw');
    expect(mockDelete).toHaveBeenCalledWith('/users/me', expect.any(Object));
  });

  it('getConsents calls GET /users/me/consents', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getConsents();
    expect(mockGet).toHaveBeenCalledWith('/users/me/consents');
  });

  it('updateConsent calls PATCH /users/me/consents/{type}', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await updateConsent('terms', true);
    expect(mockPatch).toHaveBeenCalledWith('/users/me/consents/terms', expect.any(Object));
  });
});
