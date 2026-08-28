'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAgentConfig, updateAgentConfig, type AgentConfig, type UpdateAgentConfigInput } from '@/features/agent';

export function useAgentConfig() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await getAgentConfig());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la personalización del agente');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function save(input: UpdateAgentConfigInput): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      setConfig(await updateAgentConfig(input));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la personalización del agente');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { config, loading, saving, error, save };
}
