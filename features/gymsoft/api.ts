import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

const DEFAULT_PAGE_SIZE = 50;

/** Refleja GymSoftSubscriptionResponse (api-crmws, gymsoft/presentation). */
export interface GymSoftSubscription {
  id: string;
  fullName: string | null;
  phone: string;
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
