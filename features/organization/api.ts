import { apiFetch } from '@/lib/http/apiFetch';

export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/** Refleja OrganizationResponse (api-crmws, organization/presentation/OrganizationResponse.java). */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: OrganizationStatus;
  automationEnabled: boolean;
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
