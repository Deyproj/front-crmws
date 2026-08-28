'use client';

import { useEffect, useState } from 'react';
import { getConversationSummary } from '@/features/conversations';

/**
 * Resumen de traspaso bajo demanda (Paso 5) — se pide solo cuando el asesor lo solicita
 * (botón "Generar resumen"), nunca automáticamente en cada poll de la bandeja, para no
 * multiplicar llamadas al proveedor de IA sin control.
 */
export function useConversationSummary(conversationId: string | null) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Limpia el resumen anterior al cambiar de conversación — no es válido reutilizarlo,
    // y no es derivable de otra forma sin duplicar el estado inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary(null);
    setError(null);
  }, [conversationId]);

  async function generate() {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getConversationSummary(conversationId);
      setSummary(result.summary);
      if (!result.summary) setError('Sin resumen disponible todavía (falta conocer la conversación o el proveedor de IA).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el resumen');
    } finally {
      setLoading(false);
    }
  }

  return { summary, loading, error, generate };
}
