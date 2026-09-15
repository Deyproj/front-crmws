'use client';

import { useEffect, useState } from 'react';
import {
  getConversationTransferSummary,
  listConversationTransfers,
  type ConversationTransfer,
  type ConversationTransferSummary,
} from '../../api';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo cargar el historial de transferencias';
}

/**
 * Resumen (por asesor y por hora) + listado paginado de transferencias entre asesores en un rango.
 * `membershipId` filtra solo el listado — el resumen siempre muestra a todo el equipo.
 */
export function useTransferHistory(range: { from: string; to: string }) {
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConversationTransferSummary | null>(null);
  const [transfers, setTransfers] = useState<ConversationTransfer[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConversationTransferSummary({ from: range.from, to: range.to })
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  useEffect(() => {
    // Un cambio de rango o de filtro vuelve a la primera página — la página vieja puede no existir más.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [range.from, range.to, membershipId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listConversationTransfers({ from: range.from, to: range.to }, membershipId, page)
      .then((result) => {
        if (cancelled) return;
        setTransfers(result.content);
        setTotalPages(result.totalPages);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, membershipId, page]);

  return { summary, transfers, page, totalPages, loading, error, membershipId, setMembershipId, goToPage: setPage };
}
