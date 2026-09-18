import { apiFetch } from '@/lib/http/apiFetch';

export const OPPORTUNITY_STAGES = ['QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'FOLLOW_UP'] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  QUALIFIED: 'Calificado',
  OPPORTUNITY: 'Oportunidad',
  CUSTOMER: 'Ganado',
  FOLLOW_UP: 'En seguimiento',
};

/** Refleja OpportunityResponse (api-crmws, opportunity/presentation/OpportunityResponse.java). */
export interface Opportunity {
  id: string;
  stage: OpportunityStage;
  followUpReason: string | null;
  openedAt: string;
  closedAt: string | null;
}

export async function listOpportunities(contactId: string): Promise<Opportunity[]> {
  return apiFetch<Opportunity[]>(`/api/contacts/${contactId}/opportunities`);
}
