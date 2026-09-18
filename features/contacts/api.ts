import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

/** Tamaño de cada lote al resolver contactos por id (`getContactsByIds`). */
const IDS_BATCH_SIZE = 100;

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
  /** true si el contacto pidió no recibir más mensajes automáticos (recordatorio, seguimiento, encuesta). */
  followUpOptedOut: boolean;
}

export interface ContactFilters {
  /** Nombre, nombre de WhatsApp o dígitos del teléfono — se resuelve en el backend sobre todo el catálogo. */
  q?: string;
  stage?: ContactLifecycleStage;
}

/** Contactos por página en la tabla de Clientes. */
export const CONTACTS_PAGE_SIZE = 25;

/**
 * Una página del catálogo (los contactos con interacción más reciente primero), filtrada en el
 * backend. `size` por defecto es el de la tabla de Clientes; el buscador de "Fusionar contacto"
 * pide una sola página más grande porque solo muestra coincidencias de la búsqueda.
 */
export async function searchContacts(
  filters: ContactFilters = {},
  page = 0,
  size = CONTACTS_PAGE_SIZE
): Promise<PageResponse<Contact>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.stage) params.set('stage', filters.stage);
  return apiFetch<PageResponse<Contact>>(`/api/contacts?${params.toString()}`);
}

/**
 * Contactos puntuales por id, sin depender de que caigan en la primera página del
 * catálogo (p. ej. los de las conversaciones visibles en la bandeja). Se parte en
 * lotes para no pasarse del tamaño de página ni alargar demasiado la URL.
 */
export async function getContactsByIds(ids: string[]): Promise<Contact[]> {
  const unique = [...new Set(ids)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += IDS_BATCH_SIZE) chunks.push(unique.slice(i, i + IDS_BATCH_SIZE));
  const pages = await Promise.all(
    chunks.map((chunk) => {
      const params = new URLSearchParams({ size: String(chunk.length) });
      chunk.forEach((id) => params.append('ids', id));
      return apiFetch<PageResponse<Contact>>(`/api/contacts?${params.toString()}`);
    })
  );
  return pages.flatMap((p) => p.content);
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

/**
 * Da de baja (o reactiva) los mensajes automáticos de este contacto — recordatorio de cortesía,
 * seguimiento y encuesta de satisfacción. No afecta la respuesta reactiva del agente de IA ni los
 * mensajes manuales del asesor. Ver ContactController#recordConsent / RecordConsentHandler.
 */
export async function setFollowUpOptedOut(contactId: string, optedOut: boolean, source: string): Promise<void> {
  await apiFetch(`/api/contacts/${contactId}/consent`, {
    method: 'POST',
    body: JSON.stringify({ type: 'FOLLOW_UP', granted: !optedOut, source }),
  });
}

/** Refleja FollowUpOptOutResponse (api-crmws, contact/presentation/FollowUpOptOutResponse.java). */
export interface FollowUpOptOut {
  contactId: string;
  contactName: string | null;
  contactPhone: string;
  optedOutAt: string;
  source: string;
  performedByMembershipId: string | null;
  performedByName: string | null;
  conversationId: string | null;
}

/**
 * Contactos con los mensajes automáticos desactivados ahora mismo — solo OWNER (Configuración →
 * Organización → Notificaciones). Ver ContactController#notificationsOptOut / GetFollowUpOptOutsHandler.
 */
export async function listFollowUpOptOuts(page = 0, size = 25): Promise<PageResponse<FollowUpOptOut>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<PageResponse<FollowUpOptOut>>(`/api/contacts/notifications-opt-out?${params.toString()}`);
}
