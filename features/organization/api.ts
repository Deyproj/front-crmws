import { apiFetch } from '@/lib/http/apiFetch';

export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBERSHIP_ROLES = ['OWNER', 'ADVISOR'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Refleja OrganizationResponse (api-crmws, organization/presentation/OrganizationResponse.java). */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: OrganizationStatus;
  automationEnabled: boolean;
  /** Pausa general de los envíos automáticos por WhatsApp (BR-036) — independiente de `automationEnabled`, que solo pausa las respuestas del agente. */
  automatedMessagingEnabled: boolean;
  courtesyReminderEnabled: boolean;
  followUpReminderEnabled: boolean;
  /** A diferencia de los dos anteriores, no depende de `dailyReminderHour` — se dispara al cerrar una oportunidad, no en un horario fijo. */
  satisfactionSurveyEnabled: boolean;
  /** `null` cuando la organización no lo personalizó — mostrar el texto por defecto en ese caso. */
  satisfactionSurveyMessage: string | null;
  /** Hora local (0-23, zona horaria de `timezone`) en la que corren los recordatorios automáticos. */
  dailyReminderHour: number;
  /** Plantilla Meta a usar cuando el contacto lleva más de 24h sin escribir (BR-030); `null` = sin asignar (se omite el envío en ese caso). */
  courtesyReminderTemplateId: string | null;
  /**
   * Interruptor maestro de todas las reglas de vencimiento de plan (datos de GymSoft, BR-034) —
   * nace en `false`, requiere integración GymSoft configurada. El día de anticipación y la
   * plantilla ya no son un valor único acá (2026-09-17, a pedido explícito del usuario: "poder
   * crear 2, una de 2 días y otra de 1 día") — viven en `GymSoftReminderRule`
   * (`features/gymsoft`), una lista abierta gestionada por su propio CRUD.
   */
  gymSoftReminderEnabled: boolean;
  /**
   * Liberación automática diaria de toda conversación en manos de un asesor de vuelta a la IA
   * (2026-09-17, a pedido explícito del usuario) — nace en `false`. Independiente de
   * `automatedMessagingEnabled`: no envía ningún mensaje al contacto, es una reasignación interna.
   */
  autoReleaseConversationsEnabled: boolean;
  /** Hora local (0-23, zona horaria de `timezone`), independiente de `dailyReminderHour`. */
  autoReleaseConversationsHour: number;
}

export interface ReminderScheduleInput {
  courtesyReminderEnabled: boolean;
  followUpReminderEnabled: boolean;
  satisfactionSurveyEnabled: boolean;
  satisfactionSurveyMessage: string | null;
  dailyReminderHour: number;
  courtesyReminderTemplateId: string | null;
  gymSoftReminderEnabled: boolean;
}

/**
 * Refleja MembershipResponse (api-crmws, organization/presentation). name/email pueden venir
 * null si el usuario asociado no se encontró (no debería pasar en uso normal).
 */
export interface Membership {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: MembershipRole;
  active: boolean;
}

export async function getOrganization(): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/me');
}

export async function setAutomationEnabled(enabled: boolean): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/me/automation', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export async function setAutomatedMessagingEnabled(enabled: boolean): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/me/automated-messaging', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export async function updateReminderSchedule(input: ReminderScheduleInput): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/me/reminders', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function setAutoReleaseConversationsSchedule(enabled: boolean, hour: number): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/me/auto-release-conversations', {
    method: 'PATCH',
    body: JSON.stringify({ enabled, hour }),
  });
}

/**
 * Solo lectura/administración: no existe alta de miembros desde la organización — el admin de
 * plataforma es el único que crea usuarios nuevos (ver features/platform).
 */
export async function listMembers(): Promise<Membership[]> {
  return apiFetch<Membership[]>('/api/memberships');
}

export async function changeMembershipRole(membershipId: string, role: MembershipRole): Promise<Membership> {
  return apiFetch<Membership>(`/api/memberships/${membershipId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function revokeMembership(membershipId: string): Promise<void> {
  await apiFetch<void>(`/api/memberships/${membershipId}`, { method: 'DELETE' });
}

export async function reactivateMembership(membershipId: string): Promise<Membership> {
  return apiFetch<Membership>(`/api/memberships/${membershipId}/reactivate`, { method: 'PATCH' });
}
