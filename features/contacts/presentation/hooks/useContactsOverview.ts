'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchContacts, getContactStats, type Contact, type ContactFilters, type ContactStats } from '@/features/contacts';

const POLL_INTERVAL_MS = 20000;

export function useContactsOverview(filters: ContactFilters = {}) {
  const { q, stage } = filters;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Cambiar búsqueda o etapa vuelve a la primera página (ajuste durante el render, sin efecto).
  const [lastFilters, setLastFilters] = useState({ q, stage });
  if (lastFilters.q !== q || lastFilters.stage !== stage) {
    setLastFilters({ q, stage });
    setPage(0);
  }
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas viejas cuando la búsqueda cambia más rápido de lo que responde el backend.
  const requestSeq = useRef(0);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const seq = ++requestSeq.current;
      if (!opts?.silent) setLoading(true);
      try {
        const [result, stats] = await Promise.all([searchContacts({ q, stage }, page), getContactStats()]);
        if (seq !== requestSeq.current) return;
        setContacts(result.content);
        setTotalPages(result.totalPages);
        setContactStats(stats);
        setError(null);
      } catch (err) {
        if (seq === requestSeq.current) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la información de clientes');
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [q, stage, page]
  );

  // Solo la primera carga muestra "Cargando..."; cambiar búsqueda, etapa o página recarga en
  // silencio para no desmontar la tabla y que el campo de búsqueda no pierda el foco.
  const loadedOnce = useRef(false);

  useEffect(() => {
    // Carga inicial + refresco periódico (sin WebSocket/SSE todavía — mismo criterio que
    // useConversationsList; el intervalo es más largo porque esta pantalla no es de atención en vivo).
    const silent = loadedOnce.current;
    loadedOnce.current = true;
    load({ silent });
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { contacts, page, totalPages, goToPage: setPage, contactStats, loading, error, refetch: () => load({ silent: true }) };
}
