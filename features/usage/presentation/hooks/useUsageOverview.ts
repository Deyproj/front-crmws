'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCurrentUsage,
  listInteractions,
  getInteractionDetail,
  type CurrentUsage,
  type AiInteraction,
  type AiInteractionDetail,
} from '@/features/usage';

/** Consumo de IA no es una pantalla de atención en vivo — mismo criterio de intervalo largo que useContactsOverview. */
const POLL_INTERVAL_MS = 30000;

export function useUsageOverview() {
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [interactions, setInteractions] = useState<AiInteraction[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [currentUsage, interactionsPage] = await Promise.all([getCurrentUsage(), listInteractions(targetPage)]);
      setUsage(currentUsage);
      setInteractions(interactionsPage.content);
      setTotalPages(interactionsPage.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el consumo de IA');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
    const interval = setInterval(() => load(page, { silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, page]);

  return {
    usage,
    interactions,
    page,
    totalPages,
    loading,
    error,
    goToPage: setPage,
    refetch: () => load(page, { silent: true }),
    loadInteractionDetail: (id: string): Promise<AiInteractionDetail> => getInteractionDetail(id),
  };
}
