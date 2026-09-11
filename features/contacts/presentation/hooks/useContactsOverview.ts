'use client';

import { useCallback, useEffect, useState } from 'react';
import { listContacts, getContactStats, type Contact, type ContactStats } from '@/features/contacts';

const POLL_INTERVAL_MS = 20000;

export function useContactsOverview() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [contactsList, stats] = await Promise.all([listContacts(), getContactStats()]);
      setContacts(contactsList);
      setContactStats(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información de clientes');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial + refresco periódico (sin WebSocket/SSE todavía — mismo criterio que
    // useConversationsList; el intervalo es más largo porque esta pantalla no es de atención en vivo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { contacts, contactStats, loading, error, refetch: () => load({ silent: true }) };
}
