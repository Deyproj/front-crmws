import { apiFetch } from '@/lib/http/apiFetch';

export const FOLLOWUP_REASONS = ['APPOINTMENT_NO_SHOW', 'INTENT_WITHOUT_APPOINTMENT'] as const;
export type FollowUpReason = (typeof FOLLOWUP_REASONS)[number];

export const REASON_LABELS: Record<FollowUpReason, string> = {
  APPOINTMENT_NO_SHOW: 'Agendó una cortesía y no asistió',
  INTENT_WITHOUT_APPOINTMENT: 'Quiere visitar, sin cita agendada',
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

export async function resolveFollowUpTask(taskId: string): Promise<FollowUpTask> {
  return apiFetch<FollowUpTask>(`/api/followups/${taskId}/resolve`, { method: 'POST' });
}

export async function dismissFollowUpTask(taskId: string): Promise<FollowUpTask> {
  return apiFetch<FollowUpTask>(`/api/followups/${taskId}/dismiss`, { method: 'POST' });
}
