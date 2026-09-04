import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/** Ventana fija sin UI de "cargar más" todavía — mismo criterio que features/contacts. */
const DEFAULT_PAGE_SIZE = 100;

export const SURVEY_STATUSES = ['SENT', 'ANSWERED'] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  SENT: 'Enviada, sin responder',
  ANSWERED: 'Respondida',
};

/** Refleja SatisfactionSurveyResponse (api-crmws, feedback/presentation/SatisfactionSurveyResponse.java). */
export interface SatisfactionSurvey {
  id: string;
  contactId: string;
  opportunityId: string | null;
  status: SurveyStatus;
  rawAnswer: string | null;
  sentAt: string;
  answeredAt: string | null;
}

export async function listSatisfactionSurveys(): Promise<SatisfactionSurvey[]> {
  const result = await apiFetch<PageResponse<SatisfactionSurvey>>(`/api/feedback/surveys?size=${DEFAULT_PAGE_SIZE}`);
  return result.content;
}
