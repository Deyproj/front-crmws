import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/** Conversaciones por tanda en la bandeja ("Cargar más conversaciones"). */
export const CONVERSATIONS_PAGE_SIZE = 30;
/** Mensajes por tanda en el chat ("Cargar mensajes anteriores"); también es lo que se refresca en cada poll. */
export const MESSAGES_PAGE_SIZE = 50;

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
  /** Orden real del hilo (asignado por Postgres) y cursor para pedir mensajes anteriores. */
  sequenceNumber: number | null;
}

export interface ConversationFilters {
  mode?: ConversationMode;
  status?: ConversationStatus;
  assignedTo?: string;
  /** Búsqueda por nombre o teléfono del contacto, resuelta en el backend sobre todas las conversaciones. */
  q?: string;
}

function buildConversationFilterParams(filters: ConversationFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.mode) params.set('mode', filters.mode);
  if (filters.status) params.set('status', filters.status);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  return params;
}

export async function listConversations(
  filters: ConversationFilters = {},
  page = 0,
  size = CONVERSATIONS_PAGE_SIZE
): Promise<PageResponse<Conversation>> {
  const params = buildConversationFilterParams(filters);
  params.set('page', String(page));
  params.set('size', String(size));
  return apiFetch<PageResponse<Conversation>>(`/api/conversations?${params.toString()}`);
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
 *
 * `channelId`: obligatorio cuando la organización tiene más de un canal activo (Baileys + Meta
 * Cloud API coexistiendo, ver ADR-017 en api-crmws) — sin él, el backend no puede elegir uno solo
 * y responde 409 (`AmbiguousChannelException`).
 */
export async function startConversation(phone: string, channelId?: string): Promise<Conversation> {
  return apiFetch<Conversation>('/api/conversations/start', {
    method: 'POST',
    body: JSON.stringify({ phone, channelId }),
  });
}

/**
 * Últimos mensajes del hilo, o los anteriores a `beforeSequence` si se indica (cursor por
 * sequenceNumber — con `page` los mensajes nuevos desplazarían las páginas). Llega en orden
 * cronológico; `totalElements` cuenta los mensajes que hay antes del cursor (o del hilo).
 */
export async function listMessages(conversationId: string, beforeSequence?: number): Promise<PageResponse<Message>> {
  const params = new URLSearchParams({ size: String(MESSAGES_PAGE_SIZE) });
  if (beforeSequence != null) params.set('before', String(beforeSequence));
  return apiFetch<PageResponse<Message>>(`/api/conversations/${conversationId}/messages?${params.toString()}`);
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  return apiFetch<Message>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Único camino para reabrir una conversación de un canal Meta Cloud API fuera de la ventana de
 * servicio de 24h — `sendMessage` con texto libre falla con 422 en ese caso (BR-030,
 * OutsideServiceWindowException en api-crmws). `templateId` viene del catálogo de
 * `features/channel` (`listMessageTemplates`), `parameters` en el mismo orden que las
 * variables {{1}}, {{2}}, ... de la plantilla.
 */
export async function sendTemplateMessage(
  conversationId: string,
  templateId: string,
  parameters: string[]
): Promise<Message> {
  return apiFetch<Message>(`/api/conversations/${conversationId}/send-template`, {
    method: 'POST',
    body: JSON.stringify({ templateId, parameters }),
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

/** Refleja ConversationTransferResponse (api-crmws, conversation/presentation/ConversationTransferResponse.java). */
export interface ConversationTransfer {
  id: string;
  conversationId: string;
  contactId: string;
  contactName: string;
  fromMembershipId: string;
  fromName: string;
  toMembershipId: string;
  toName: string;
  transferredAt: string;
  /** Presente solo si el OWNER forzó esta asignación sin ser quien tenía la conversación (BR-022 ampliado). */
  forcedByMembershipId: string | null;
  forcedByName: string | null;
}

export interface AdvisorTransferCount {
  membershipId: string;
  name: string;
  /** Transferencias que este asesor entregó a otro. */
  sent: number;
  /** Transferencias que este asesor recibió de otro. */
  received: number;
}

/** Refleja ConversationTransferSummaryResponse. `byHour` siempre trae 24 posiciones (0-23) en `timezone`. */
export interface ConversationTransferSummary {
  total: number;
  timezone: string;
  byAdvisor: AdvisorTransferCount[];
  byHour: number[];
}

const TRANSFERS_PAGE_SIZE = 20;

export async function listConversationTransfers(
  range: { from: string; to: string },
  membershipId: string | null,
  page = 0
): Promise<PageResponse<ConversationTransfer>> {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
    page: String(page),
    size: String(TRANSFERS_PAGE_SIZE),
  });
  if (membershipId) params.set('membershipId', membershipId);
  return apiFetch<PageResponse<ConversationTransfer>>(`/api/conversations/transfers?${params.toString()}`);
}

export async function getConversationTransferSummary(range: { from: string; to: string }): Promise<ConversationTransferSummary> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return apiFetch<ConversationTransferSummary>(`/api/conversations/transfers/summary?${params.toString()}`);
}
