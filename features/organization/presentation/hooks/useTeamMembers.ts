'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  changeMembershipRole,
  listMembers,
  reactivateMembership,
  revokeMembership,
  type Membership,
  type MembershipRole,
} from '@/features/organization';

export function useTeamMembers() {
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await listMembers());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el equipo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function changeRole(membershipId: string, role: MembershipRole) {
    setActionPending(true);
    setError(null);
    try {
      const updated = await changeMembershipRole(membershipId, role);
      setMembers((current) => current.map((m) => (m.id === membershipId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol');
    } finally {
      setActionPending(false);
    }
  }

  async function revoke(membershipId: string) {
    setActionPending(true);
    setError(null);
    try {
      await revokeMembership(membershipId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar la membresía');
    } finally {
      setActionPending(false);
    }
  }

  async function reactivate(membershipId: string) {
    setActionPending(true);
    setError(null);
    try {
      const updated = await reactivateMembership(membershipId);
      setMembers((current) => current.map((m) => (m.id === membershipId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reactivar la membresía');
    } finally {
      setActionPending(false);
    }
  }

  return { members, loading, actionPending, error, changeRole, revoke, reactivate };
}
