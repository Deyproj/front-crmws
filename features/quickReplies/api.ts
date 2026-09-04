import { apiFetch } from '@/lib/http/apiFetch';

/** Refleja QuickReplyResponse (api-crmws, quickreply/presentation/QuickReplyResponse.java). */
export interface QuickReply {
  id: string;
  shortcut: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function listQuickReplies(): Promise<QuickReply[]> {
  return apiFetch<QuickReply[]>('/api/quick-replies');
}

export async function createQuickReply(shortcut: string, content: string): Promise<QuickReply> {
  return apiFetch<QuickReply>('/api/quick-replies', {
    method: 'POST',
    body: JSON.stringify({ shortcut, content }),
  });
}

export async function updateQuickReply(id: string, shortcut: string, content: string): Promise<QuickReply> {
  return apiFetch<QuickReply>(`/api/quick-replies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ shortcut, content }),
  });
}

export async function deleteQuickReply(id: string): Promise<void> {
  await apiFetch<void>(`/api/quick-replies/${id}`, { method: 'DELETE' });
}
