'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listKnowledgeEntries,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  type KnowledgeEntry,
} from '@/features/agent';

export function useKnowledgeEntries() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listKnowledgeEntries());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el conocimiento del agente');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function create(question: string, answer: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const entry = await createKnowledgeEntry(question, answer);
      setEntries((prev) => [entry, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la entrada');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, question: string, answer: string, active: boolean): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const entry = await updateKnowledgeEntry(id, question, answer, active);
      setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la entrada');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { entries, loading, saving, error, create, update };
}
