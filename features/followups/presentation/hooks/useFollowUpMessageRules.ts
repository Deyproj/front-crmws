'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listFollowUpMessageRules,
  createFollowUpMessageRule,
  updateFollowUpMessageRule,
  deleteFollowUpMessageRule,
  type FollowUpMessageRule,
} from '@/features/followups';

export function useFollowUpMessageRules() {
  const [rules, setRules] = useState<FollowUpMessageRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await listFollowUpMessageRules());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las reglas de seguimiento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function create(thresholdDays: number, messageTemplate: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const rule = await createFollowUpMessageRule(thresholdDays, messageTemplate);
      setRules((prev) => [...prev, rule].sort((a, b) => a.thresholdDays - b.thresholdDays));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la regla');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, thresholdDays: number, messageTemplate: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const rule = await updateFollowUpMessageRule(id, thresholdDays, messageTemplate);
      setRules((prev) => prev.map((r) => (r.id === id ? rule : r)).sort((a, b) => a.thresholdDays - b.thresholdDays));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la regla');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await deleteFollowUpMessageRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la regla');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { rules, loading, saving, error, create, update, remove };
}
