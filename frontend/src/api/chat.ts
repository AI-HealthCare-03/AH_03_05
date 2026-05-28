import { apiClient } from './client';
import type {
  CreateSessionRequest, ChatSession,
  ChatSessionListResponse, ChatMessagesResponse,
  SendMessageRequest, SendMessageResponse,
} from './types';

interface _CreateSessionBEResponse {
  session_id: number;
  record_id: number | null;
  guide_id: number | null;
  status: string;
  created_at: string;
}

export async function createChatSession(data: CreateSessionRequest): Promise<ChatSession> {
  const res = await apiClient.post<_CreateSessionBEResponse>('/chat/sessions', data);
  return {
    session_id: res.data.session_id,
    title: data.title ?? '새 상담',
    status: res.data.status as 'active' | 'closed',
    updated_at: res.data.created_at,
  };
}

// ⚠ Backend TODO: GET /chat/sessions
export async function getChatSessions(params?: {
  page?: number;
  size?: number;
}): Promise<ChatSessionListResponse> {
  const res = await apiClient.get<ChatSessionListResponse>('/chat/sessions', { params });
  return res.data;
}

// ⚠ Backend TODO: GET /chat/sessions/{session_id}/messages
export async function getChatMessages(
  sessionId: number,
  params?: { limit?: number },
): Promise<ChatMessagesResponse> {
  const res = await apiClient.get<ChatMessagesResponse>(
    `/chat/sessions/${sessionId}/messages`,
    { params },
  );
  return res.data;
}

export async function sendChatMessage(
  sessionId: number,
  data: SendMessageRequest,
): Promise<SendMessageResponse> {
  const res = await apiClient.post<SendMessageResponse>(
    `/chat/sessions/${sessionId}/messages`,
    data,
  );
  return res.data;
}
