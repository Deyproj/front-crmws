import { apiFetch } from '@/lib/http/apiFetch';

export const CONTACT_LIFECYCLE_STAGES = ['LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'LOST'] as const;
export type ContactLifecycleStage = (typeof CONTACT_LIFECYCLE_STAGES)[number];

/** Etiquetas confirmadas con el negocio — ver docs/02-requirements/opportunity-stages-draft-dinamo-fitness.md. */
export const LIFECYCLE_STAGE_LABELS: Record<ContactLifecycleStage, string> = {
  LEAD: 'Prospecto',
  QUALIFIED: 'Calificado',
  OPPORTUNITY: 'Oportunidad',
  CUSTOMER: 'Ganado',
  LOST: 'Perdido',
};

/** Motivos de pérdida confirmados con Dinamo Fitness (lista abierta a ampliarse, BR-015). */
export const LOST_REASONS = [
  'Precio muy alto',
  'Ubicación / cercanía',
  'Ya se inscribió en otro gimnasio',
  'Dejó de responder sin explicación',
] as const;

/** Refleja ContactResponse (api-crmws, contact/presentation/ContactResponse.java). */
export interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  lifecycleStage: ContactLifecycleStage;
  lastInteractionAt: string;
}

export async function listContacts(): Promise<Contact[]> {
  return apiFetch<Contact[]>('/api/contacts');
}

/** Refleja ContactStatsResponse (api-crmws, contact/presentation/ContactStatsResponse.java). */
export interface ContactStats {
  leads: number;
  qualified: number;
  opportunities: number;
  customers: number;
  lost: number;
}

export async function getContactStats(): Promise<ContactStats> {
  return apiFetch<ContactStats>('/api/contacts/stats');
}

/** targetStage no admite LEAD (ChangeLifecycleStageRequest usa OpportunityStage) — ver ContactController. */
export async function changeLifecycleStage(
  contactId: string,
  targetStage: Exclude<ContactLifecycleStage, 'LEAD'>,
  lostReason?: string
): Promise<Contact> {
  return apiFetch<Contact>(`/api/contacts/${contactId}/lifecycle-stage`, {
    method: 'PATCH',
    body: JSON.stringify({ targetStage, lostReason }),
  });
}
