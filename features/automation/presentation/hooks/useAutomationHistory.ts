'use client';

import { useCallback, useEffect, useState } from 'react';
import { listAutomationDeliveries, type AutomationDelivery, type AutomationKind, type DateRange } from '@/features/automation';

export function useAutomationHistory(range: DateRange, initialKind: AutomationKind | null = null) {
  const [kind, setKind] = useState<AutomationKind | null>(initialKind);
  const [deliveries, setDeliveries] = useState<AutomationDelivery[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await listAutomationDeliveries(range, kind, targetPage);
      setDeliveries(result.content);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial de automatizaciones');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, kind]);

  useEffect(() => {
    // Un cambio de rango o de filtro vuelve a la primera página — la página vieja puede no existir más.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [range.from, range.to, kind]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  }, [load, page]);

  return { deliveries, page, totalPages, loading, error, kind, setKind, goToPage: setPage };
}
