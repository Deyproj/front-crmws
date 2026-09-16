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
  remindedForExpiresAt: string | null;
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
