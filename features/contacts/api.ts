import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/**
 * Ventana fija sin UI de "cargar más" todavía (ver mvp-roadmap.md, "Trabajo condicional"):
 * el backend sí pagina de verdad (page/size), pero mientras el piloto no demuestre más
 * volumen que esto en una sola organización, alcanza con pedir la primera página grande.
 */
const DEFAULT_PAGE_SIZE = 100;

export const CONTACT_LIFECYCLE_STAGES = ['LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'FOLLOW_UP'] as const;
export type ContactLifecycleStage = (typeof CONTACT_LIFECYCLE_STAGES)[number];

/** Etiquetas confirmadas con el negocio — ver docs/02-requirements/opportunity-stages-draft-dinamo-fitness.md. */
export const LIFECYCLE_STAGE_LABELS: Record<ContactLifecycleStage, string> = {
  LEAD: 'Prospecto',
  QUALIFIED: 'Calificado',
  OPPORTUNITY: 'Oportunidad',
  CUSTOMER: 'Ganado',
  FOLLOW_UP: 'En seguimiento',
};

/** Motivos de seguimiento confirmados con Dinamo Fitness (lista abierta a ampliarse, BR-015). */
export const FOLLOW_UP_REASONS = [
  'Precio muy alto',
  'Ubicación / cercanía',
  'Ya se inscribió en otro gimnasio',
  'Dejó de responder sin explicación',
] as const;

/** Refleja ContactResponse (api-crmws, contact/presentation/ContactResponse.java). */
export interface Contact {
  id: string;
  name: string | null;
  /** Nombre autodeclarado en el perfil de WhatsApp — señal débil, nunca verificada (el usuario lo pone a su gusto). */
  pushName: string | null;
  phone: string;
  email: string | null;
  lifecycleStage: ContactLifecycleStage;
  lastInteractionAt: string;
  qualificationGoal: string | null;
  qualificationPlanOfInterest: string | null;
  qualificationIntent: string | null;
}

export async function listContacts(): Promise<Contact[]> {
  const result = await apiFetch<PageResponse<Contact>>(`/api/contacts?size=${DEFAULT_PAGE_SIZE}`);
  return result.content;
}

/** Refleja ContactStatsResponse (api-crmws, contact/presentation/ContactStatsResponse.java). */
export interface ContactStats {
  leads: number;
  qualified: number;
  opportunities: number;
  customers: number;
  followUp: number;
}

export async function getContactStats(): Promise<ContactStats> {
  return apiFetch<ContactStats>('/api/contacts/stats');
}

/** targetStage no admite LEAD (ChangeLifecycleStageRequest usa OpportunityStage) — ver ContactController. */
/** Actualiza nombre/correo del contacto — invocable desde el panel del asesor (ver ContactController#update). */
export async function updateContactProfile(contactId: string, name: string, email?: string | null): Promise<Contact> {
  return apiFetch<Contact>(`/api/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, email: email ?? null }),
  });
}

export async function changeLifecycleStage(
  contactId: string,
  targetStage: Exclude<ContactLifecycleStage, 'LEAD'>,
  followUpReason?: string
): Promise<Contact> {
  return apiFetch<Contact>(`/api/contacts/${contactId}/lifecycle-stage`, {
    method: 'PATCH',
    body: JSON.stringify({ targetStage, followUpReason }),
  });
}

/**
 * Fusiona `duplicateContactId` dentro de `keepContactId` — mismo cliente real dividido en dos
 * contactos (típicamente porque su primer mensaje llegó identificado solo por LID de WhatsApp,
 * sin teléfono). `keepContactId` es el que sobrevive; `duplicateContactId` desaparece.
 */
export async function mergeContacts(keepContactId: string, duplicateContactId: string): Promise<Contact> {
  return apiFetch<Contact>(`/api/contacts/${keepContactId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ duplicateContactId }),
  });
}
