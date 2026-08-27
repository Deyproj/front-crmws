import { apiFetch } from '@/lib/http/apiFetch';

export const OPPORTUNITY_STAGES = ['QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'LOST'] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  QUALIFIED: 'Calificado',
  OPPORTUNITY: 'Oportunidad',
  CUSTOMER: 'Ganado',
  LOST: 'Perdido',
};

/** Refleja OpportunityResponse (api-crmws, opportunity/presentation/OpportunityResponse.java). */
export interface Opportunity {
  id: string;
  stage: OpportunityStage;
  lostReason: string | null;
  openedAt: string;
  closedAt: string | null;
}

export async function listOpportunities(contactId: string): Promise<Opportunity[]> {
  return apiFetch<Opportunity[]>(`/api/contacts/${contactId}/opportunities`);
}
