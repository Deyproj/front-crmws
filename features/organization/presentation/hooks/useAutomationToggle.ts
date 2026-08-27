'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOrganization, setAutomationEnabled, type Organization } from '@/features/organization';

export function useAutomationToggle() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrganization(await getOrganization());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la organización');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggle(enabled: boolean) {
    setActionPending(true);
    setError(null);
    try {
      setOrganization(await setAutomationEnabled(enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la automatización');
    } finally {
      setActionPending(false);
    }
  }

  return { organization, loading, actionPending, error, toggle };
}
