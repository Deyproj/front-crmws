import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/** Ver el mismo comentario en features/contacts/api.ts — ventana fija, sin "cargar más" todavía. */
const DEFAULT_PAGE_SIZE = 100;

export const CONVERSATION_MODES = ['AI', 'HUMAN', 'HYBRID', 'PAUSED'] as const;
export type ConversationMode = (typeof CONVERSATION_MODES)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'WAITING', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const SENDER_TYPES = ['CONTACT', 'AI', 'ADVISOR', 'SYSTEM'] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'OTHER'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

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
  /** Solo presente en mensajes senderType=ADVISOR — qué asesor lo envió. */
  senderMembershipId: string | null;
  messageType: MessageType;
  /** Solo presente cuando messageType no es TEXT — archivo servido por service-whatsapp. */
  mediaUrl: string | null;
}

export interface ConversationFilters {
  mode?: ConversationMode;
  status?: ConversationStatus;
  assignedTo?: string;
}

function buildConversationFilterParams(filters: ConversationFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.mode) params.set('mode', filters.mode);
  if (filters.status) params.set('status', filters.status);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  return params;
}

export async function listConversations(filters: ConversationFilters = {}): Promise<Conversation[]> {
  const params = buildConversationFilterParams(filters);
  params.set('size', String(DEFAULT_PAGE_SIZE));
  const result = await apiFetch<PageResponse<Conversation>>(`/api/conversations?${params.toString()}`);
  return result.content;
}

/**
 * Solo el total, sin traer contenido — para badges/indicadores que no necesitan
 * la lista completa (p. ej. cuántas conversaciones están "Esperando" un asesor).
 */
export async function countConversations(filters: ConversationFilters = {}): Promise<number> {
  const params = buildConversationFilterParams(filters);
  params.set('size', '1');
  const result = await apiFetch<PageResponse<Conversation>>(`/api/conversations?${params.toString()}`);
  return result.totalElements;
}

export async function getConversation(id: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${id}`);
}

/**
 * "Nuevo chat" de la bandeja. `phone` debe llegar ya en E.164 (indicativo + número,
 * p. ej. "+573001234567") — ver PhoneNormalizer en el backend. Si el número ya tenía
 * una conversación, el backend la devuelve tal cual (sin reasignarla).
 */
export async function startConversation(phone: string): Promise<Conversation> {
  return apiFetch<Conversation>('/api/conversations/start', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const result = await apiFetch<PageResponse<Message>>(
    `/api/conversations/${conversationId}/messages?size=${DEFAULT_PAGE_SIZE}`
  );
  return result.content;
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

export async function transferConversation(conversationId: string, targetMembershipId: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${conversationId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ targetMembershipId }),
  });
}

/** Refleja ConversationStatsResponse (api-crmws, conversation/presentation/ConversationStatsResponse.java). */
export interface ConversationStats {
  total: number;
  transferred: number;
  transferredPercentage: number;
  averageFirstResponseSeconds: number | null;
  medianFirstResponseSeconds: number | null;
}

export async function getConversationStats(): Promise<ConversationStats> {
  return apiFetch<ConversationStats>('/api/conversations/stats');
}

/** Refleja ConversationSummaryResponse (api-crmws, conversation/presentation/ConversationSummaryResponse.java). */
export interface ConversationSummary {
  summary: string | null;
}

/** Resumen de traspaso bajo demanda (Paso 5) — null si no hay proveedor de IA configurado o no hay mensajes todavía. */
export async function getConversationSummary(conversationId: string): Promise<ConversationSummary> {
  return apiFetch<ConversationSummary>(`/api/conversations/${conversationId}/summary`);
}
