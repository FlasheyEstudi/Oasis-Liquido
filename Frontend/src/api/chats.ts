import { get, post } from './client';

const BASE_URL = '/chats';

export async function listSessions(params?: any) {
  return get<any[]>(BASE_URL, params);
}

export async function getSessionMessages(sessionId: string) {
  return get<any[]>(`${BASE_URL}/${sessionId}/messages`);
}

export async function sendMessage(data: { sessionId: string; content: string }) {
  return post<any>(`${BASE_URL}/${data.sessionId}/messages`, { content: data.content });
}

export async function createSession(data: { type: string; targetId?: string; participantIds: string[] }) {
  return post<any>(BASE_URL, data);
}
