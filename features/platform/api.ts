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

export const PLAN_BILLING_CYCLES = ['MONTHLY', 'BIWEEKLY'] as const;
export type PlanBillingCycle = (typeof PLAN_BILLING_CYCLES)[number];

export const PLAN_BILLING_CYCLE_LABELS: Record<PlanBillingCycle, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
};

/** Refleja CurrentUsageResponse (api-crmws, usage/presentation) — administración de IA por organización (BR-031). */
export interface OrganizationAiUsage {
  planConfigured: boolean;
  billingCycle: PlanBillingCycle | null;
  periodStart: string;
  periodEnd: string;
  includedInteractions: number;
  usedInteractions: number;
  remainingInteractions: number;
  usagePercentage: number;
  overageInteractions: number;
  overageEnabled: boolean;
  overageUnitPrice: number | null;
  overageAmount: number | null;
  llmCalls: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCost: number | null;
}

/** Refleja PlatformOrganizationUsageResponse. */
export interface PlatformOrganizationUsage {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  usage: OrganizationAiUsage;
}

export interface OrganizationAiPlanPayload {
  billingCycle: PlanBillingCycle;
  includedInteractions: number;
  overageEnabled: boolean;
  overageUnitPrice: number | null;
}

/** Refleja OrganizationAiPlanResponse. */
export interface OrganizationAiPlan {
  organizationId: string;
  billingCycle: PlanBillingCycle;
  includedInteractions: number;
  overageEnabled: boolean;
  overageUnitPrice: number | null;
}

/** Refleja AiModelPriceResponse. */
export interface AiModelPrice {
  id: string;
  provider: string;
  model: string;
  inputTokenPrice: number;
  outputTokenPrice: number;
  cachedTokenPrice: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface AiModelPricePayload {
  provider: string;
  model: string;
  inputTokenPrice: number;
  outputTokenPrice: number;
  cachedTokenPrice: number | null;
}

export async function listOrganizationsUsage(): Promise<PlatformOrganizationUsage[]> {
  return apiFetch<PlatformOrganizationUsage[]>('/api/platform/usage/organizations');
}

export async function upsertOrganizationAiPlan(
  organizationId: string,
  payload: OrganizationAiPlanPayload
): Promise<OrganizationAiPlan> {
  return apiFetch<OrganizationAiPlan>(`/api/platform/organizations/${organizationId}/ai-plan`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listAiModelPrices(): Promise<AiModelPrice[]> {
  return apiFetch<AiModelPrice[]>('/api/platform/ai-model-prices');
}

export async function createAiModelPrice(payload: AiModelPricePayload): Promise<AiModelPrice> {
  return apiFetch<AiModelPrice>('/api/platform/ai-model-prices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
