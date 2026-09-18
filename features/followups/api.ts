import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

export const FOLLOWUP_REASONS = ['APPOINTMENT_NO_SHOW', 'INTENT_WITHOUT_APPOINTMENT', 'OPPORTUNITY_FOLLOW_UP'] as const;
export type FollowUpReason = (typeof FOLLOWUP_REASONS)[number];

export const REASON_LABELS: Record<FollowUpReason, string> = {
  APPOINTMENT_NO_SHOW: 'Agendó una cortesía y no asistió',
  INTENT_WITHOUT_APPOINTMENT: 'Quiere visitar, sin cita agendada',
  OPPORTUNITY_FOLLOW_UP: 'Oportunidad marcada en seguimiento',
};

/** Refleja FollowUpTaskResponse (api-crmws, followup/presentation/FollowUpTaskResponse.java). */
export interface FollowUpTask {
  id: string;
  contactId: string;
  reason: FollowUpReason;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  detectedAt: string;
  resolvedAt: string | null;
  /** Conversación más reciente del contacto, para el botón "Ver conversación" — null si nunca tuvo una. */
  conversationId: string | null;
}

export const FOLLOW_UP_PAGE_SIZE = 25;

/** Seguimientos pendientes, más recientes primero, paginados en el backend. */
export async function listFollowUpTasks(page = 0): Promise<PageResponse<FollowUpTask>> {
  return apiFetch<PageResponse<FollowUpTask>>(`/api/followups?page=${page}&size=${FOLLOW_UP_PAGE_SIZE}`);
}

/** Escanea la organización actual y crea tareas nuevas (idempotente) — no envía ningún mensaje. */
export async function detectFollowUpTasks(): Promise<FollowUpTask[]> {
  return apiFetch<FollowUpTask[]>('/api/followups/detect', { method: 'POST' });
}

export async function dismissFollowUpTask(taskId: string): Promise<FollowUpTask> {
  return apiFetch<FollowUpTask>(`/api/followups/${taskId}/dismiss`, { method: 'POST' });
}

/**
 * Refleja FollowUpMessageRuleResponse (api-crmws, followup/presentation/FollowUpMessageRuleResponse.java).
 * `messageTemplate` desapareció (2026-09-10, a pedido explícito del usuario: "no pedir mensaje,
 * solo plantilla") — `metaTemplateId` pasó de opcional a obligatorio y es la única fuente del
 * contenido del mensaje, ver FollowUpMessageSchedulerService en el backend.
 */
export interface FollowUpMessageRule {
  id: string;
  thresholdDays: number;
  /** `null` = aplica a cualquier motivo (regla universal). */
  reason: FollowUpReason | null;
  /** Plantilla Meta ya aprobada (BR-030) — su texto es el mensaje, dentro y fuera de la ventana de 24h. */
  metaTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export async function listFollowUpMessageRules(): Promise<FollowUpMessageRule[]> {
  return apiFetch<FollowUpMessageRule[]>('/api/followups/message-rules');
}

export async function createFollowUpMessageRule(
  thresholdDays: number,
  reason: FollowUpReason | null,
  metaTemplateId: string,
): Promise<FollowUpMessageRule> {
  return apiFetch<FollowUpMessageRule>('/api/followups/message-rules', {
    method: 'POST',
    body: JSON.stringify({ thresholdDays, reason, metaTemplateId }),
  });
}

export async function updateFollowUpMessageRule(
  ruleId: string,
  thresholdDays: number,
  reason: FollowUpReason | null,
  metaTemplateId: string,
): Promise<FollowUpMessageRule> {
  return apiFetch<FollowUpMessageRule>(`/api/followups/message-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ thresholdDays, reason, metaTemplateId }),
  });
}

export async function deleteFollowUpMessageRule(ruleId: string): Promise<void> {
  await apiFetch<void>(`/api/followups/message-rules/${ruleId}`, { method: 'DELETE' });
}
