'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createOrganization,
  createTeamMember,
  listOrganizations,
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

  return {
    organizations,
    loading,
    actionPending,
    error,
    lastTemporaryPassword,
    dismissTemporaryPassword: () => setLastTemporaryPassword(null),
    provisionOrganization,
    provisionTeamMember,
  };
}
