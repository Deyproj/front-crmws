import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

const DEFAULT_PAGE_SIZE = 50;

/** Mismos valores por defecto que Broadcast.java (api-crmws, broadcast/domain). */
export const DEFAULT_DAILY_LIMIT = 250;
export const DEFAULT_ADVISOR_REPLY_WINDOW_HOURS = 48;

/** Refleja BroadcastReplyHandling (api-crmws, broadcast/domain). */
export const BROADCAST_REPLY_HANDLINGS = ['AI', 'ADVISOR'] as const;
export type BroadcastReplyHandling = (typeof BROADCAST_REPLY_HANDLINGS)[number];

export const BROADCAST_REPLY_HANDLING_LABELS: Record<BroadcastReplyHandling, string> = {
  AI: 'Responde la IA',
  ADVISOR: 'Atiende un asesor',
};

/** Refleja BroadcastStatus. */
export type BroadcastStatus = 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';

export const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  SCHEDULED: 'Programada',
  SENDING: 'Enviando',
  COMPLETED: 'Terminada',
  CANCELLED: 'Cancelada',
};

/** Refleja BroadcastRecipientStatus. */
export type BroadcastRecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED_OPTED_OUT' | 'CANCELLED';

export const BROADCAST_RECIPIENT_STATUS_LABELS: Record<BroadcastRecipientStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  FAILED: 'Falló',
  SKIPPED_OPTED_OUT: 'Omitido (pidió no recibir mensajes)',
  CANCELLED: 'Cancelado',
};

/**
 * Refleja BroadcastAudiencePreview. Los excluidos se muestran con su motivo: la diferencia entre
 * "tengo N clientes" y "les llega a M" tiene que ser explicable antes de confirmar.
 */
export interface BroadcastAudiencePreview {
  currentPlanClients: number;
  excludedWithoutPhone: number;
  excludedDuplicatePhone: number;
  recipients: number;
  estimatedDays: number;
}

/** Refleja BroadcastResponse. */
export interface Broadcast {
  id: string;
  name: string;
  templateId: string;
  channelId: string;
  replyHandling: BroadcastReplyHandling;
  advisorReplyWindowHours: number;
  dailyLimit: number;
  scheduledAt: string;
  status: BroadcastStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

/** Refleja BroadcastRecipientResponse. */
export interface BroadcastRecipient {
  id: string;
  fullName: string | null;
  phoneE164: string;
  contactId: string | null;
  conversationId: string | null;
  status: BroadcastRecipientStatus;
  errorReason: string | null;
  processedAt: string | null;
  repliedAt: string | null;
  replyRoutedTo: BroadcastReplyHandling | null;
}

export interface CreateBroadcastInput {
  name: string;
  templateId: string;
  replyHandling: BroadcastReplyHandling;
  advisorReplyWindowHours: number;
  dailyLimit: number;
  /** `null` = enviar ya. */
  scheduledAt: string | null;
}

/**
 * Refleja BroadcastTestResponse. Responde 200 aunque el mensaje no salga: el motivo del rechazo de
 * Meta es justamente lo que la prueba viene a averiguar.
 */
export interface BroadcastTestResult {
  sent: boolean;
  conversationId: string | null;
  failureReason: string | null;
}

/** Envía la plantilla a un solo número, sin crear ninguna campaña. */
export async function sendBroadcastTest(templateId: string, phone: string): Promise<BroadcastTestResult> {
  return apiFetch<BroadcastTestResult>('/api/broadcasts/test', {
    method: 'POST',
    body: JSON.stringify({ templateId, phone }),
  });
}

export async function previewBroadcastAudience(dailyLimit: number): Promise<BroadcastAudiencePreview> {
  return apiFetch<BroadcastAudiencePreview>(`/api/broadcasts/audience/preview?dailyLimit=${dailyLimit}`);
}

export async function listBroadcasts(page = 0): Promise<PageResponse<Broadcast>> {
  return apiFetch<PageResponse<Broadcast>>(`/api/broadcasts?page=${page}&size=20`);
}

export async function createBroadcast(input: CreateBroadcastInput): Promise<Broadcast> {
  return apiFetch<Broadcast>('/api/broadcasts', { method: 'POST', body: JSON.stringify(input) });
}

export async function getBroadcast(id: string): Promise<Broadcast> {
  return apiFetch<Broadcast>(`/api/broadcasts/${id}`);
}

export async function listBroadcastRecipients(id: string, page = 0): Promise<PageResponse<BroadcastRecipient>> {
  return apiFetch<PageResponse<BroadcastRecipient>>(
    `/api/broadcasts/${id}/recipients?page=${page}&size=${DEFAULT_PAGE_SIZE}`
  );
}

/** Solo detiene lo que todavía no salió — lo ya enviado no se puede deshacer. */
export async function cancelBroadcast(id: string): Promise<Broadcast> {
  return apiFetch<Broadcast>(`/api/broadcasts/${id}/cancel`, { method: 'POST' });
}
