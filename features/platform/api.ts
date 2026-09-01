import { apiFetch } from '@/lib/http/apiFetch';

export const MEMBERSHIP_ROLES = ['OWNER', 'ADVISOR'] as const;
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

/** Refleja ResetTeamMemberPasswordResponse — temporaryPassword solo viaja en esta respuesta. */
export interface ResetPasswordResult {
  temporaryPassword: string;
}

/** Refleja PlatformMembershipResponse (api-crmws, identity/presentation). */
export interface PlatformMember {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: MembershipRole;
  active: boolean;
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

export async function listMembers(organizationId: string): Promise<PlatformMember[]> {
  return apiFetch<PlatformMember[]>(`/api/platform/organizations/${organizationId}/members`);
}

export async function changeMemberRole(
  organizationId: string,
  membershipId: string,
  role: MembershipRole
): Promise<PlatformMember> {
  return apiFetch<PlatformMember>(`/api/platform/organizations/${organizationId}/members/${membershipId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function revokeMember(organizationId: string, membershipId: string): Promise<void> {
  await apiFetch<void>(`/api/platform/organizations/${organizationId}/members/${membershipId}`, {
    method: 'DELETE',
  });
}

export async function activateMember(organizationId: string, membershipId: string): Promise<PlatformMember> {
  return apiFetch<PlatformMember>(`/api/platform/organizations/${organizationId}/members/${membershipId}/activate`, {
    method: 'PATCH',
  });
}

export async function resetMemberPassword(
  organizationId: string,
  membershipId: string
): Promise<ResetPasswordResult> {
  return apiFetch<ResetPasswordResult>(
    `/api/platform/organizations/${organizationId}/members/${membershipId}/reset-password`,
    { method: 'POST' }
  );
}

export async function changeOrganizationStatus(
  organizationId: string,
  status: OrganizationStatus
): Promise<PlatformOrganization> {
  return apiFetch<PlatformOrganization>(`/api/platform/organizations/${organizationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
