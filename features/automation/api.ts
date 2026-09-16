import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

const DEFAULT_PAGE_SIZE = 50;

/** Refleja AutomationKind (api-crmws, automation/domain). */
export const AUTOMATION_KINDS = [
  'COURTESY_REMINDER',
  'FOLLOW_UP',
  'SATISFACTION_SURVEY',
  'GYMSOFT_EXPIRATION_REMINDER',
  'BROADCAST',
] as const;
export type AutomationKind = (typeof AUTOMATION_KINDS)[number];

export const AUTOMATION_KIND_LABELS: Record<AutomationKind, string> = {
  COURTESY_REMINDER: 'Recordatorio de cortesía',
  FOLLOW_UP: 'Mensaje de seguimiento',
  SATISFACTION_SURVEY: 'Encuesta de satisfacción',
  GYMSOFT_EXPIRATION_REMINDER: 'Vencimiento de plan (GymSoft)',
  BROADCAST: 'Difusión masiva',
};

/** Refleja AutomationDeliveryResponse. */
export interface AutomationDelivery {
  id: string;
  contactId: string;
  kind: AutomationKind;
  messageId: string;
  sentAt: string;
}

export type AutomationDeliveryCounts = Record<AutomationKind, number>;

export interface DateRange {
  from: string;
  to: string;
}

export async function listAutomationDeliveries(
  range: DateRange,
  kind: AutomationKind | null,
  page = 0
): Promise<PageResponse<AutomationDelivery>> {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
    page: String(page),
    size: String(DEFAULT_PAGE_SIZE),
  });
  if (kind) params.set('kind', kind);
  return apiFetch<PageResponse<AutomationDelivery>>(`/api/automation-deliveries?${params.toString()}`);
}

export async function getAutomationDeliveryCounts(range: DateRange): Promise<AutomationDeliveryCounts> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return apiFetch<AutomationDeliveryCounts>(`/api/automation-deliveries/counts?${params.toString()}`);
}
