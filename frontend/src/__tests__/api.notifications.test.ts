import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead, deleteNotification } from '../api/notifications';

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

describe('notifications API', () => {
  it('getNotifications calls GET /notifications', async () => {
    mockGet.mockResolvedValue({ data: { items: [] } });
    await getNotifications();
    expect(mockGet).toHaveBeenCalledWith('/notifications', expect.any(Object));
  });

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    mockGet.mockResolvedValue({ data: { count: 0 } });
    await getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('markAllNotificationsRead calls PATCH /notifications/read-all', async () => {
    mockPatch.mockResolvedValue({});
    await markAllNotificationsRead();
    expect(mockPatch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('markNotificationRead calls PATCH /notifications/{id}/read', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await markNotificationRead(1);
    expect(mockPatch).toHaveBeenCalledWith('/notifications/1/read');
  });

  it('deleteNotification calls DELETE /notifications/{id}', async () => {
    mockDelete.mockResolvedValue({});
    await deleteNotification(1);
    expect(mockDelete).toHaveBeenCalledWith('/notifications/1');
  });
});
