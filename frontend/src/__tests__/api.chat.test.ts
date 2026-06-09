import { createChatSession, getChatSessions, getChatMessages, sendChatMessage, deleteChatSession } from '../api/chat';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('chat API', () => {
  it('createChatSession calls POST /chat/sessions', async () => {
    mockPost.mockResolvedValue({ data: { session_id: 1, record_id: null, guide_id: null, status: 'ACTIVE', created_at: '' } });
    await createChatSession({ title: '새 상담' });
    expect(mockPost).toHaveBeenCalledWith('/chat/sessions', expect.any(Object));
  });

  it('getChatSessions calls GET /chat/sessions', async () => {
    mockGet.mockResolvedValue({ data: { sessions: [] } });
    await getChatSessions();
    expect(mockGet).toHaveBeenCalledWith('/chat/sessions', expect.any(Object));
  });

  it('getChatMessages calls GET /chat/sessions/{id}/messages', async () => {
    mockGet.mockResolvedValue({ data: { messages: [] } });
    await getChatMessages(1);
    expect(mockGet).toHaveBeenCalledWith('/chat/sessions/1/messages', expect.any(Object));
  });

  it('sendChatMessage calls POST /chat/sessions/{id}/messages', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await sendChatMessage(1, { message: '안녕' });
    expect(mockPost).toHaveBeenCalledWith('/chat/sessions/1/messages', expect.any(Object));
  });

  it('deleteChatSession calls DELETE /chat/sessions/{id}', async () => {
    mockDelete.mockResolvedValue({});
    await deleteChatSession(1);
    expect(mockDelete).toHaveBeenCalledWith('/chat/sessions/1');
  });
});
