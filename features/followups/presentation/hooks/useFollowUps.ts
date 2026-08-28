'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listFollowUpTasks,
  detectFollowUpTasks,
  resolveFollowUpTask,
  dismissFollowUpTask,
  type FollowUpTask,
} from '@/features/followups';
import { listContacts, type Contact } from '@/features/contacts';

export interface FollowUpItem {
  task: FollowUpTask;
  contact: Contact | null;
}

export function useFollowUps() {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tasks, contacts] = await Promise.all([listFollowUpTasks(), listContacts()]);
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      setItems(tasks.map((task) => ({ task, contact: contactsById.get(task.contactId) ?? null })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los seguimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function detect() {
    setDetecting(true);
    setError(null);
    try {
      await detectFollowUpTasks();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la detección');
    } finally {
      setDetecting(false);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionPending(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La acción no se pudo completar');
    } finally {
      setActionPending(false);
    }
  }

  return {
    items,
    loading,
    detecting,
    actionPending,
    error,
    detect,
    resolve: (taskId: string) => runAction(() => resolveFollowUpTask(taskId)),
    dismiss: (taskId: string) => runAction(() => dismissFollowUpTask(taskId)),
  };
}
