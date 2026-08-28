'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  activateMember,
  changeMemberRole,
  changeOrganizationStatus,
  createOrganization,
  createTeamMember,
  listMembers,
  listOrganizations,
  revokeMember,
  type MembershipRole,
  type OrganizationStatus,
  type PlatformMember,
  type PlatformOrganization,
  type ProvisionOrganizationPayload,
  type ProvisionTeamMemberPayload,
} from '@/features/platform';

export function usePlatformDashboard() {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Contraseña temporal recién emitida — se muestra una sola vez, nunca se vuelve a consultar. */
  const [lastTemporaryPassword, setLastTemporaryPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrganizations(await listOrganizations());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las organizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function provisionOrganization(payload: ProvisionOrganizationPayload) {
    setActionPending(true);
    setError(null);
    setLastTemporaryPassword(null);
    try {
      const result = await createOrganization(payload);
      setLastTemporaryPassword(result.temporaryPassword);
      await load();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la organización');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  async function provisionTeamMember(organizationId: string, payload: ProvisionTeamMemberPayload) {
    setActionPending(true);
    setError(null);
    setLastTemporaryPassword(null);
    try {
      const result = await createTeamMember(organizationId, payload);
      setLastTemporaryPassword(result.temporaryPassword);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el miembro de equipo');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  const loadMembers = useCallback(async (organizationId: string): Promise<PlatformMember[]> => {
    return listMembers(organizationId);
  }, []);

  async function changeRole(organizationId: string, membershipId: string, role: MembershipRole) {
    setActionPending(true);
    setError(null);
    try {
      return await changeMemberRole(organizationId, membershipId, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  async function revoke(organizationId: string, membershipId: string) {
    setActionPending(true);
    setError(null);
    try {
      await revokeMember(organizationId, membershipId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar el miembro');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  async function changeStatus(organizationId: string, status: OrganizationStatus) {
    setActionPending(true);
    setError(null);
    try {
      const result = await changeOrganizationStatus(organizationId, status);
      await load();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la organización');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  async function activate(organizationId: string, membershipId: string) {
    setActionPending(true);
    setError(null);
    try {
      return await activateMember(organizationId, membershipId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reactivar el miembro');
      throw err;
    } finally {
      setActionPending(false);
    }
  }

  return {
    organizations,
    loading,
    actionPending,
    error,
    lastTemporaryPassword,
    dismissTemporaryPassword: () => setLastTemporaryPassword(null),
    provisionOrganization,
    provisionTeamMember,
    loadMembers,
    changeRole,
    revoke,
    activate,
    changeStatus,
  };
}
