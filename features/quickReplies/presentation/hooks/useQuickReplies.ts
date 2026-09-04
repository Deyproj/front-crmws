'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  type QuickReply,
} from '@/features/quickReplies';

export function useQuickReplies() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQuickReplies(await listQuickReplies());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes rápidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function create(shortcut: string, content: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const quickReply = await createQuickReply(shortcut, content);
      setQuickReplies((prev) => [...prev, quickReply].sort((a, b) => a.shortcut.localeCompare(b.shortcut)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el mensaje rápido');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, shortcut: string, content: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const quickReply = await updateQuickReply(id, shortcut, content);
      setQuickReplies((prev) =>
        prev.map((q) => (q.id === id ? quickReply : q)).sort((a, b) => a.shortcut.localeCompare(b.shortcut))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el mensaje rápido');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await deleteQuickReply(id);
      setQuickReplies((prev) => prev.filter((q) => q.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el mensaje rápido');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { quickReplies, loading, saving, error, create, update, remove };
}
