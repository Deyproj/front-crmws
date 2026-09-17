import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

const DEFAULT_PAGE_SIZE = 50;

/** Refleja GymSoftSubscriptionResponse (api-crmws, gymsoft/presentation). */
export interface GymSoftSubscription {
  id: string;
  fullName: string | null;
  phone: string;
  /**
   * Teléfono normalizado a E.164. `null` = no contactable por WhatsApp (fijo, vacío o formato
   * irreconocible): esos clientes no reciben el recordatorio de vencimiento ni entran en una
   * difusión, y el modal lo dice en vez de mostrarlos como si fueran a recibir algo.
   */
  phoneE164: string | null;
  /** `false` cuando la última sincronización ya no trajo a este cliente (plan anulado o retirado). */
  active: boolean;
  expiresAt: string;
  /** "Días antes" de cada regla que ya avisó este vencimiento (2026-09-17, reemplaza el flag único de cuando solo existía una regla). */
  remindedDaysBefore: number[];
}

export async function listGymSoftSubscriptions(page = 0): Promise<PageResponse<GymSoftSubscription>> {
  return apiFetch<PageResponse<GymSoftSubscription>>(`/api/gymsoft/subscriptions?page=${page}&size=${DEFAULT_PAGE_SIZE}`);
}

/** Refleja GymSoftSyncResponse. Botón "Sincronizar ahora" — solo OWNER. */
export interface GymSoftSyncResult {
  synced: number;
}

export async function syncGymSoftSubscriptions(): Promise<GymSoftSyncResult> {
  return apiFetch<GymSoftSyncResult>('/api/gymsoft/subscriptions/sync', { method: 'POST' });
}

/**
 * Refleja GymSoftReminderRuleResponse (api-crmws, gymsoft/presentation) — reemplaza los campos
 * únicos que tenía Organization (2026-09-17, a pedido explícito del usuario: "poder crear 2, una
 * de 2 días y otra de 1 día"). `metaTemplateId` es obligatorio, igual que en FollowUpMessageRule.
 */
export interface GymSoftReminderRule {
  id: string;
  daysBefore: number;
  metaTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export async function listGymSoftReminderRules(): Promise<GymSoftReminderRule[]> {
  return apiFetch<GymSoftReminderRule[]>('/api/gymsoft/reminder-rules');
}

export async function createGymSoftReminderRule(daysBefore: number, metaTemplateId: string): Promise<GymSoftReminderRule> {
  return apiFetch<GymSoftReminderRule>('/api/gymsoft/reminder-rules', {
    method: 'POST',
    body: JSON.stringify({ daysBefore, metaTemplateId }),
  });
}

export async function updateGymSoftReminderRule(
  ruleId: string,
  daysBefore: number,
  metaTemplateId: string,
): Promise<GymSoftReminderRule> {
  return apiFetch<GymSoftReminderRule>(`/api/gymsoft/reminder-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ daysBefore, metaTemplateId }),
  });
}

export async function deleteGymSoftReminderRule(ruleId: string): Promise<void> {
  await apiFetch<void>(`/api/gymsoft/reminder-rules/${ruleId}`, { method: 'DELETE' });
}
