'use client';

import { useCallback, useEffect, useState } from 'react';
import { listBroadcasts, type Broadcast } from '@/features/broadcast';

/**
 * Una campaña en curso avanza sola en el servidor (el job envía por tandas y puede durar días por
 * el tope diario), así que sin refresco periódico el progreso se vería congelado.
 */
const REFRESH_INTERVAL_MS = 15000;

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const result = await listBroadcasts(targetPage);
      setBroadcasts(result.content);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las difusiones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
    const timer = setInterval(() => load(page, false), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [page, load]);

  const reload = useCallback(() => load(page, false), [load, page]);

  return { broadcasts, page, totalPages, loading, error, goToPage: setPage, reload };
}
