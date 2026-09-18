import { apiFetch } from '@/lib/http/apiFetch';

export const OPPORTUNITY_STAGES = ['QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'FOLLOW_UP'] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  QUALIFIED: 'Calificado',
  OPPORTUNITY: 'Oportunidad',
  CUSTOMER: 'Ganado',
  /** "Pausado", no "En seguimiento" (2026-09-18) — para no competir con el título de /followups, una
   *  lista operativa completamente distinta (ver BR-021 en business-rules.md). */
  FOLLOW_UP: 'Pausado',
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
