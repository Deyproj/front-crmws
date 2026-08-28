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
