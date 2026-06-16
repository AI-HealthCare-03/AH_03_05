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

  it('createChatSession title 없으면 기본값 "새 상담" 사용', async () => {
    mockPost.mockResolvedValue({ data: { session_id: 2, record_id: null, guide_id: null, status: 'ACTIVE', created_at: '' } });
    const result = await createChatSession({});
    expect(result.title).toBe('새 상담');
  });

  it('getChatSessions calls GET /chat/sessions', async () => {
    mockGet.mockResolvedValue({ data: { sessions: [] } });
    await getChatSessions();
    expect(mockGet).toHaveBeenCalledWith('/chat/sessions', expect.any(Object));
  });

  it('getChatSessions가 null/빈 title을 "새 상담"으로 폴백', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          { session_id: 1, title: null, status: 'ACTIVE' },
          { session_id: 2, title: '   ', status: 'ACTIVE' },
          { session_id: 3, title: '고혈압 질문', status: 'ACTIVE' },
        ],
        total: 3,
        limit: 20,
        offset: 0,
      },
    });
    const res = await getChatSessions();
    expect(res.items.map(s => s.title)).toEqual(['새 상담', '새 상담', '고혈압 질문']);
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
