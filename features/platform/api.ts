import { apiFetch } from '@/lib/http/apiFetch';

export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'SUPERVISOR', 'ADVISOR', 'VIEWER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/** Refleja PlatformOrganizationResponse (api-crmws, identity/presentation). */
export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
}

export interface ProvisionOrganizationPayload {
  ownerName: string;
  ownerEmail: string;
  organizationName: string;
  organizationSlug: string;
  timezone: string;
}

/** Refleja ProvisionOrganizationResponse — temporaryPassword solo viaja en esta respuesta. */
export interface ProvisionOrganizationResult {
  ownerUserId: string;
  organizationId: string;
  membershipId: string;
  temporaryPassword: string;
}

export interface ProvisionTeamMemberPayload {
  name: string;
  email: string;
  role: MembershipRole;
}

/** Refleja TeamMemberResponse — temporaryPassword solo viaja en esta respuesta. */
export interface ProvisionTeamMemberResult {
  membershipId: string;
  userId: string;
  role: MembershipRole;
  temporaryPassword: string;
}

export async function listOrganizations(): Promise<PlatformOrganization[]> {
  return apiFetch<PlatformOrganization[]>('/api/platform/organizations');
}

export async function createOrganization(
  payload: ProvisionOrganizationPayload
): Promise<ProvisionOrganizationResult> {
  return apiFetch<ProvisionOrganizationResult>('/api/platform/organizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createTeamMember(
  organizationId: string,
  payload: ProvisionTeamMemberPayload
): Promise<ProvisionTeamMemberResult> {
  return apiFetch<ProvisionTeamMemberResult>(`/api/platform/organizations/${organizationId}/team-members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
