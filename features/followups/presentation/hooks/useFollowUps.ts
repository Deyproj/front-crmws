'use client';

import { useCallback, useEffect, useState } from 'react';
import { listFollowUpTasks, detectFollowUpTasks, dismissFollowUpTask, type FollowUpTask } from '@/features/followups';
import { getContactsByIds, type Contact } from '@/features/contacts';

export interface FollowUpItem {
  task: FollowUpTask;
  contact: Contact | null;
}

export function useFollowUps() {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await listFollowUpTasks(targetPage);
      // Una página descartada por completo deja de existir: se vuelve a la última que queda.
      if (targetPage > 0 && result.content.length === 0 && result.totalPages > 0) {
        setPage(result.totalPages - 1);
        return;
      }
      const tasks = result.content;
      // Solo los contactos de la página visible, por id (ver useAgenda).
      const contacts = await getContactsByIds(tasks.map((t) => t.contactId));
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      setItems(tasks.map((task) => ({ task, contact: contactsById.get(task.contactId) ?? null })));
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los seguimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  }, [load, page]);

  async function detect() {
    setDetecting(true);
    setError(null);
    try {
      await detectFollowUpTasks();
      // Las tareas nuevas quedan arriba (más recientes primero): se vuelve a la primera página.
      if (page === 0) await load(0);
      else setPage(0);
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
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La acción no se pudo completar');
    } finally {
      setActionPending(false);
    }
  }

  return {
    items,
    page,
    totalPages,
    goToPage: setPage,
    loading,
    detecting,
    actionPending,
    error,
    detect,
    dismiss: (taskId: string) => runAction(() => dismissFollowUpTask(taskId)),
  };
}
