import { apiFetch } from '@/lib/http/apiFetch';

export const CONVERSATION_MODES = ['AI', 'HUMAN', 'HYBRID', 'PAUSED'] as const;
export type ConversationMode = (typeof CONVERSATION_MODES)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'WAITING', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const SENDER_TYPES = ['CONTACT', 'AI', 'ADVISOR', 'SYSTEM'] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export const MODE_LABELS: Record<ConversationMode, string> = {
  AI: 'IA',
  HUMAN: 'Asesor',
  HYBRID: 'Híbrido',
  PAUSED: 'Pausada',
};

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  OPEN: 'Abierta',
  WAITING: 'En espera',
  CLOSED: 'Cerrada',
};

/** Refleja ConversationResponse (api-crmws, conversation/presentation/ConversationResponse.java). */
export interface Conversation {
  id: string;
  channelId: string;
  contactId: string;
  mode: ConversationMode;
  status: ConversationStatus;
  currentAssigneeMembershipId: string | null;
  lastMessageAt: string | null;
}

/** Refleja MessageResponse (api-crmws, conversation/presentation/MessageResponse.java). */
export interface Message {
  id: string;
  conversationId: string;
  externalMessageId: string | null;
  direction: MessageDirection;
  senderType: SenderType;
  content: string;
  sentAt: string;
}

export interface ConversationFilters {
  mode?: ConversationMode;
  status?: ConversationStatus;
  assignedTo?: string;
}

export async function listConversations(filters: ConversationFilters = {}): Promise<Conversation[]> {
  const params = new URLSearchParams();
  if (filters.mode) params.set('mode', filters.mode);
  if (filters.status) params.set('status', filters.status);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  const query = params.toString();
  return apiFetch<Conversation[]>(`/api/conversations${query ? `?${query}` : ''}`);
}

export async function getConversation(id: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${id}`);
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  return apiFetch<Message>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function takeOverConversation(conversationId: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${conversationId}/take-over`, { method: 'POST' });
}

export async function releaseConversationToAi(conversationId: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${conversationId}/release-to-ai`, { method: 'POST' });
}
