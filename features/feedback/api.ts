import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/** Encuestas por página (paginación Anterior/Siguiente en la vista). */
const DEFAULT_PAGE_SIZE = 20;

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

export async function listSatisfactionSurveys(page = 0): Promise<PageResponse<SatisfactionSurvey>> {
  return apiFetch<PageResponse<SatisfactionSurvey>>(`/api/feedback/surveys?page=${page}&size=${DEFAULT_PAGE_SIZE}`);
}
