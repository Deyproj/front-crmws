'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listGymSoftReminderRules,
  createGymSoftReminderRule,
  updateGymSoftReminderRule,
  deleteGymSoftReminderRule,
  type GymSoftReminderRule,
} from '@/features/gymsoft';

export function useGymSoftReminderRules() {
  const [rules, setRules] = useState<GymSoftReminderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await listGymSoftReminderRules());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las reglas de vencimiento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function create(daysBefore: number, metaTemplateId: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const rule = await createGymSoftReminderRule(daysBefore, metaTemplateId);
      setRules((prev) => [...prev, rule].sort((a, b) => a.daysBefore - b.daysBefore));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la regla');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, daysBefore: number, metaTemplateId: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const rule = await updateGymSoftReminderRule(id, daysBefore, metaTemplateId);
      setRules((prev) => prev.map((r) => (r.id === id ? rule : r)).sort((a, b) => a.daysBefore - b.daysBefore));
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
      await deleteGymSoftReminderRule(id);
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
