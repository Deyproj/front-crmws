import { apiFetch } from '@/lib/http/apiFetch';

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
}

export async function listFollowUpTasks(): Promise<FollowUpTask[]> {
  return apiFetch<FollowUpTask[]>('/api/followups');
}

/** Escanea la organización actual y crea tareas nuevas (idempotente) — no envía ningún mensaje. */
export async function detectFollowUpTasks(): Promise<FollowUpTask[]> {
  return apiFetch<FollowUpTask[]>('/api/followups/detect', { method: 'POST' });
}

export async function dismissFollowUpTask(taskId: string): Promise<FollowUpTask> {
  return apiFetch<FollowUpTask>(`/api/followups/${taskId}/dismiss`, { method: 'POST' });
}

/** Refleja FollowUpMessageRuleResponse (api-crmws, followup/presentation/FollowUpMessageRuleResponse.java). */
export interface FollowUpMessageRule {
  id: string;
  thresholdDays: number;
  messageTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export async function listFollowUpMessageRules(): Promise<FollowUpMessageRule[]> {
  return apiFetch<FollowUpMessageRule[]>('/api/followups/message-rules');
}

export async function createFollowUpMessageRule(thresholdDays: number, messageTemplate: string): Promise<FollowUpMessageRule> {
  return apiFetch<FollowUpMessageRule>('/api/followups/message-rules', {
    method: 'POST',
    body: JSON.stringify({ thresholdDays, messageTemplate }),
  });
}

export async function updateFollowUpMessageRule(
  ruleId: string,
  thresholdDays: number,
  messageTemplate: string,
): Promise<FollowUpMessageRule> {
  return apiFetch<FollowUpMessageRule>(`/api/followups/message-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ thresholdDays, messageTemplate }),
  });
}

export async function deleteFollowUpMessageRule(ruleId: string): Promise<void> {
  await apiFetch<void>(`/api/followups/message-rules/${ruleId}`, { method: 'DELETE' });
}
